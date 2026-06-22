import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class StorageService {
  private readonly s3: S3Client;
  private readonly s3ForPresign: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly appConfig: AppConfigService) {
    const {
      STORAGE_ENDPOINT,
      STORAGE_REGION,
      STORAGE_ACCESS_KEY,
      STORAGE_SECRET_KEY,
      STORAGE_PUBLIC_URL,
      STORAGE_UPLOAD_URL,
      STORAGE_BUCKET,
      STORAGE_FORCE_PATH_STYLE,
    } = this.appConfig.storageSettings;

    this.bucket = STORAGE_BUCKET;
    // Read/serve base URL (CloudFront in prod, public MinIO host in dev).
    this.publicUrl = STORAGE_PUBLIC_URL;

    // MinIO needs path-style; AWS S3 uses virtual-hosted. Default true unless set to 'false'.
    const forcePathStyle = STORAGE_FORCE_PATH_STYLE !== 'false';

    // Browser-reachable endpoint the presigned PUT is signed against.
    // For MinIO this equals the public URL; for S3 it must be the S3 endpoint
    // (uploads go straight to S3, not through CloudFront), so the signature host matches.
    const uploadEndpoint = STORAGE_UPLOAD_URL || STORAGE_PUBLIC_URL;

    // When keys are provided (dev/MinIO), use them explicitly.
    // When omitted (prod on EC2), leave undefined so the AWS SDK resolves
    // credentials from the default provider chain — i.e. the instance IAM role.
    const credentials =
      STORAGE_ACCESS_KEY && STORAGE_SECRET_KEY
        ? {
            accessKeyId: STORAGE_ACCESS_KEY,
            secretAccessKey: STORAGE_SECRET_KEY,
          }
        : undefined;

    this.s3 = new S3Client({
      endpoint: STORAGE_ENDPOINT,
      region: STORAGE_REGION,
      credentials,
      forcePathStyle,
    });

    this.s3ForPresign = new S3Client({
      endpoint: uploadEndpoint,
      region: STORAGE_REGION,
      credentials,
      forcePathStyle,
    });
  }

  async createPresignedUploadUrl(
    s3Key: string,
  ): Promise<{ presignedUrl: string; s3Key: string }> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: s3Key,
      ContentType: 'image/webp',
    });

    const presignedUrl = await getSignedUrl(this.s3ForPresign, command, {
      expiresIn: 300,
    });

    return { presignedUrl, s3Key };
  }

  async createPresignedUploadUrls(
    s3Keys: string[],
  ): Promise<{ presignedUrl: string; s3Key: string }[]> {
    return Promise.all(
      s3Keys.map((s3Key) => this.createPresignedUploadUrl(s3Key)),
    );
  }

  getPublicUrl(s3Key: string): string {
    return `${this.publicUrl}/${this.bucket}/${s3Key}`;
  }

  async deleteObject(s3Key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: s3Key }),
    );
  }
}
