import type { Metadata } from 'next';
import Link from 'next/link';
import LegalLayout, { List, Section } from '@/src/modules/landing/components/LegalLayout';

const LAST_UPDATED = 'June 25, 2026';

const CONTROLLER = 'Ruslan Lukianenko'; // the individual operating AuctionHub
const CONTACT_EMAIL = 'ruslan201010@gmail.com';

export const metadata: Metadata = {
  title: 'Privacy Policy — AuctionHub',
  description:
    'How AuctionHub collects, uses, and protects personal data, and the rights you have under the GDPR and Ukrainian data-protection law.',
  alternates: { canonical: '/privacy' },
};

export default function PrivacyPolicyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated={LAST_UPDATED}>
      <p>
        This Privacy Policy explains how personal data is collected, used, and protected when you
        use AuctionHub (the &ldquo;Service&rdquo;), available at{' '}
        <a className="underline" href="https://auctionshub.net">
          auctionshub.net
        </a>
        . It is written to meet the requirements of the EU General Data Protection Regulation (GDPR)
        and the Law of Ukraine &ldquo;On the Protection of Personal Data.&rdquo;
      </p>
      {/* NOTE (internal, not shown to users): this policy is a draft — have it
          reviewed by a qualified lawyer before relying on it in production. */}

      <Section heading="1. Who is responsible for your data">
        <p>
          The data controller is {CONTROLLER}, an individual operating AuctionHub as a personal
          project. For any privacy question or to exercise your rights, contact:{' '}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>

      <Section heading="2. What personal data we collect">
        <p>We collect only what is needed to run the Service:</p>
        <List
          items={[
            <>
              <strong>Account data.</strong> Your email address; a hashed password (we never store
              plain-text passwords); and, if you sign in with Google, your Google account identifier
              and email-verified status. When you use Google sign-in we receive only your email and
              a Google user ID &mdash; not your name, photo, contacts, or other Google data.
            </>,
            <>
              <strong>Auction content you create.</strong> Auctions, lots, lot descriptions, prices,
              and any images you upload.
            </>,
            <>
              <strong>Data you enter about other people.</strong> When you run an auction you may
              enter the name and email of buyers and of people you invite to bid. See section 8.
            </>,
            <>
              <strong>Activity data.</strong> Bids placed, room membership, and similar records
              generated while using the Service.
            </>,
            <>
              <strong>Technical data.</strong> A session cookie, authentication tokens stored in
              your browser, and server logs (which may include IP address and request metadata) used
              for security and operation.
            </>,
          ]}
        />
      </Section>

      <Section heading="3. Why we use it and our legal basis">
        <p>Under Article 6 of the GDPR, we rely on the following legal bases:</p>
        <List
          items={[
            <>
              <strong>Performance of a contract.</strong> To create and secure your account, run
              auctions, process bids, and send transactional emails such as email confirmation and
              invitations.
            </>,
            <>
              <strong>Legitimate interests.</strong> To keep the Service secure, prevent abuse and
              fraud, debug problems, and improve the product. We balance these interests against
              your rights.
            </>,
            <>
              <strong>Consent.</strong> Where we ask for it specifically &mdash; for example,
              optional communications. You can withdraw consent at any time.
            </>,
            <>
              <strong>Legal obligation.</strong> Where we must retain or disclose data to comply
              with applicable law.
            </>,
          ]}
        />
      </Section>

      <Section heading="4. Cookies and local storage">
        <p>
          We use a strictly necessary <code>session_id</code> cookie to keep you signed in, and we
          store short-lived authentication tokens in your browser&rsquo;s local storage so that live
          auction rooms work. These are essential for the Service to function and are not used for
          advertising or cross-site tracking. We do not currently use analytics or marketing
          cookies.
        </p>
      </Section>

      <Section heading="5. Who we share data with">
        <p>
          We do not sell your personal data. We share it only with service providers
          (&ldquo;processors&rdquo;) that help us operate, and only as needed:
        </p>
        <List
          items={[
            <>
              <strong>Amazon Web Services (AWS).</strong> Hosting, database, file storage (S3), and
              content delivery (CloudFront). Our infrastructure runs in the EU region{' '}
              <code>eu-north-1</code> (Stockholm, Sweden).
            </>,
            <>
              <strong>Google.</strong> Optional &ldquo;Sign in with Google&rdquo; authentication.
              Your use of Google sign-in is also subject to Google&rsquo;s Privacy Policy.
            </>,
            <>
              <strong>Email delivery provider.</strong> A transactional email provider sends
              confirmation and invitation emails on our behalf.
            </>,
          ]}
        />
        <p>
          We may also disclose data where required by law or to protect the rights, safety, and
          security of users and the Service.
        </p>
      </Section>

      <Section heading="6. International data transfers">
        <p>
          Your data is primarily stored in the EU (Sweden). Some providers, such as Google, may
          process data outside the EU. Where that happens, the transfer is protected by an
          appropriate safeguard such as the European Commission&rsquo;s Standard Contractual Clauses
          or an adequacy decision.
        </p>
      </Section>

      <Section heading="7. How long we keep data">
        <List
          items={[
            <>
              <strong>Account data</strong> is kept for as long as your account is active. Account
              deletion is currently handled manually: you can ask us to delete your account at any
              time by emailing{' '}
              <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
              , and we will delete it and the associated personal data without undue delay (and in
              any case within 30 days), except where we must keep limited records to comply with the
              law.
            </>,
            <>
              <strong>Auction content, buyer and participant records, and bids</strong> are kept
              while the related auction exists and are deleted when you delete the auction or your
              account.
            </>,
            <>
              <strong>Server logs</strong> are kept only for a short period for security and
              troubleshooting.
            </>,
          ]}
        />
      </Section>

      <Section heading="8. Data you enter about other people">
        <p>
          If you enter another person&rsquo;s name or email (for example, a buyer or someone you
          invite to bid), you are responsible for having a lawful basis to do so and, where
          required, for informing them. For that data you act as the controller and we act as a
          processor handling it on your behalf. Please only enter data you are entitled to share.
        </p>
      </Section>

      <Section heading="9. Your rights">
        <p>
          Subject to applicable law, you have the right to access, correct, delete, restrict, or
          object to the processing of your personal data, to data portability, and to withdraw
          consent where processing is based on it. To exercise any of these, email{' '}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
        <p>
          In particular, to exercise your right to erasure (&ldquo;right to be forgotten&rdquo;),
          send a deletion request from the email address associated with your account, or otherwise
          allowing us to verify your identity. We process such requests manually and will delete
          your account and associated personal data without undue delay, and in any case within 30
          days, except where the law requires us to retain limited records.
        </p>
        <p>
          You also have the right to lodge a complaint with a supervisory authority. In Ukraine this
          is the Ukrainian Parliament Commissioner for Human Rights (Ombudsman). In the EU it is the
          data-protection authority of your country of residence.
        </p>
      </Section>

      <Section heading="10. Children">
        <p>
          The Service is not directed to children. You must be at least 16 years old (or the minimum
          age required in your country) to create an account. We do not knowingly collect data from
          children below that age.
        </p>
      </Section>

      <Section heading="11. Security">
        <p>
          We use measures such as encrypted connections (HTTPS), hashed passwords, access controls,
          and EU-based hosting to protect your data. No method of transmission or storage is
          completely secure, but we work to protect your information and to address issues promptly.
        </p>
      </Section>

      <Section heading="12. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. We will revise the &ldquo;Last
          updated&rdquo; date above and, where changes are significant, take reasonable steps to
          notify you.
        </p>
      </Section>

      <Section heading="13. Contact">
        <p>
          Questions about this policy or your data? Email{' '}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          . See also our{' '}
          <Link className="underline" href="/terms">
            Terms of Service
          </Link>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
