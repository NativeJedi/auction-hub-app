# CI/CD setup — GitHub Actions → ECR → SSM (no SSH, no long-lived keys)

How a push to `main` ships to production:

1. GitHub Actions authenticates to AWS via **OIDC** (no stored access keys).
2. It builds the `server` and `client` images and pushes them to **ECR**, tagged with the commit SHA (and `latest`).
3. It runs **SSM Run Command** on the EC2 instance, which executes `scripts/deploy.sh`: pulls those images from ECR and restarts the stack.

Port 22 stays closed — everything goes through SSM.

Region for all of this: **`eu-north-1`**. Replace `<ACCOUNT_ID>` and `<INSTANCE_ID>` with your values.

---

## 1. Create the two ECR repositories

```bash
aws ecr create-repository --repository-name auction-hub-server --region eu-north-1
aws ecr create-repository --repository-name auction-hub-client --region eu-north-1
```

The registry URL is `<ACCOUNT_ID>.dkr.ecr.eu-north-1.amazonaws.com` — put it in the server `.env` as `ECR_REGISTRY`.

Optional but recommended — a lifecycle policy so old images don't accumulate storage cost (keep the last 10 of each):

```json
{
  "rules": [
    {
      "rulePriority": 1,
      "description": "Keep last 10 images",
      "selection": { "tagStatus": "any", "countType": "imageCountMoreThan", "countNumber": 10 },
      "action": { "type": "expire" }
    }
  ]
}
```

Apply with `aws ecr put-lifecycle-policy --repository-name auction-hub-server --lifecycle-policy-text file://policy.json` (and again for `-client`).

## 2. Create the GitHub OIDC identity provider (once per account)

IAM → Identity providers → Add provider → OpenID Connect:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

## 3. Create the deploy IAM role for GitHub Actions

Create a role (e.g. `github-actions-deploy`) with this **trust policy** — it only trusts this repo's `main` branch:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<ACCOUNT_ID>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:NativeJedi/auction-hub-app:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

Attach this **permissions policy** (ECR push + trigger the deploy over SSM):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EcrAuth",
      "Effect": "Allow",
      "Action": "ecr:GetAuthorizationToken",
      "Resource": "*"
    },
    {
      "Sid": "EcrPush",
      "Effect": "Allow",
      "Action": [
        "ecr:BatchCheckLayerAvailability",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload",
        "ecr:PutImage",
        "ecr:BatchGetImage"
      ],
      "Resource": [
        "arn:aws:ecr:eu-north-1:<ACCOUNT_ID>:repository/auction-hub-server",
        "arn:aws:ecr:eu-north-1:<ACCOUNT_ID>:repository/auction-hub-client"
      ]
    },
    {
      "Sid": "SsmDeploy",
      "Effect": "Allow",
      "Action": ["ssm:SendCommand", "ssm:GetCommandInvocation"],
      "Resource": [
        "arn:aws:ec2:eu-north-1:<ACCOUNT_ID>:instance/<INSTANCE_ID>",
        "arn:aws:ssm:eu-north-1::document/AWS-RunShellScript",
        "arn:aws:ssm:eu-north-1:<ACCOUNT_ID>:*"
      ]
    }
  ]
}
```

Copy the role ARN — it becomes the `AWS_DEPLOY_ROLE_ARN` secret.

## 4. Let the EC2 instance pull from ECR

The instance already has a role (`auction-hub-ec2-ssm`). Attach the managed policy
**`AmazonEC2ContainerRegistryReadOnly`** to it so the instance can `docker login` + pull.

## 5. One-time instance prerequisites

- `ssm-user` must be able to run Docker without sudo:
  ```bash
  sudo usermod -aG docker ssm-user
  ```
- The repo must already exist at `/home/ssm-user/auction-hub-app` (it does from the
  manual deploy). Pull once so `scripts/deploy.sh` is present before the first
  automated run:
  ```bash
  cd /home/ssm-user/auction-hub-app && git pull && chmod +x scripts/deploy.sh
  ```
- Fill `ECR_REGISTRY=<ACCOUNT_ID>.dkr.ecr.eu-north-1.amazonaws.com` in the server `.env`.

## 6. GitHub repository configuration

Settings → Secrets and variables → Actions.

**Secrets:**

| Name | Value |
|------|-------|
| `AWS_DEPLOY_ROLE_ARN` | ARN of the `github-actions-deploy` role |
| `EC2_INSTANCE_ID` | `<INSTANCE_ID>` |

**Variables** (public — baked into the browser bundle):

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | `356932227517-…apps.googleusercontent.com` |
| `NEXT_PUBLIC_APP_DOMAIN` | `https://auctionshub.net` |
| `NEXT_PUBLIC_WS_ORIGIN` | `https://auctionshub.net` |

## 7. Go

The deploy is **manual**: GitHub → **Actions** tab → **Deploy** workflow → **Run workflow**.
Run it from the **`main`** branch (the OIDC trust policy only allows `refs/heads/main`).
The job builds, pushes to ECR, and deploys over SSM. Verify:

- Port 22 is still closed in the security group, yet the deploy succeeds → SSH-less deploy works.
- `docker compose ps` on the instance shows the new images running.

### Notes

- **First run** needs `scripts/deploy.sh` already on the instance (step 5) — after that
  each deploy `git pull`s the latest script itself.
- Rollback: re-run the workflow on an older commit, or on the instance set
  `IMAGE_TAG=<old-sha>` and run `docker compose pull api client && docker compose up -d`.
- If the repo goes **private**, the instance's `git pull` (step in deploy.sh, used only
  to refresh compose/nginx config) needs a read-only deploy key or token.
