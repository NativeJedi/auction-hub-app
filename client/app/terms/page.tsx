import type { Metadata } from 'next';
import Link from 'next/link';
import LegalLayout, { List, Section } from '@/src/modules/landing/components/LegalLayout';

const LAST_UPDATED = 'June 25, 2026';

// TODO: replace the placeholders below with real details before publishing.
const PROVIDER = 'Ruslan Lukianenko'; // the individual operating AuctionHub
const CONTACT_EMAIL = 'ruslan201010@gmail.com';
const GOVERNING_LAW = 'Ukraine';

export const metadata: Metadata = {
  title: 'Terms of Service — AuctionHub',
  description:
    'The terms that govern your use of AuctionHub, including accounts, acceptable use, content responsibility, and liability.',
  alternates: { canonical: '/terms' },
};

export default function TermsOfServicePage() {
  return (
    <LegalLayout title="Terms of Service" lastUpdated={LAST_UPDATED}>
      <p>
        These Terms of Service (the &ldquo;Terms&rdquo;) govern your use of AuctionHub (the
        &ldquo;Service&rdquo;), available at{' '}
        <a className="underline" href="https://auctionshub.net">
          auctionshub.net
        </a>
        , operated by {PROVIDER} (&ldquo;we,&rdquo; &ldquo;us&rdquo;). By creating an account or
        using the Service, you agree to these Terms.
      </p>
      {/* NOTE (internal, not shown to users): these terms are a draft — have them
          reviewed by a qualified lawyer before relying on them in production. */}

      <Section heading="1. The Service">
        <p>
          AuctionHub is a platform for running live, in-person auctions, letting an organizer manage
          lots and letting participants place bids in real time from their own devices. We provide
          the software; we are not a party to, and not responsible for, the auctions, sales,
          payments, or any transaction between organizers and participants.
        </p>
      </Section>

      <Section heading="2. Eligibility and accounts">
        <List
          items={[
            <>
              You must be at least 16 years old (or the minimum age required in your country) to use
              the Service.
            </>,
            <>
              You are responsible for the accuracy of your account information and for keeping your
              credentials confidential.
            </>,
            <>You are responsible for all activity that occurs under your account.</>,
          ]}
        />
      </Section>

      <Section heading="3. Acceptable use">
        <p>You agree not to:</p>
        <List
          items={[
            <>use the Service for any unlawful purpose or fraudulent auction;</>,
            <>
              upload content that is illegal, infringing, deceptive, or violates the rights of
              others;
            </>,
            <>
              attempt to disrupt, overload, reverse-engineer, or gain unauthorized access to the
              Service or its infrastructure;
            </>,
            <>enter personal data about other people without a lawful basis to do so.</>,
          ]}
        />
      </Section>

      <Section heading="4. Your content and responsibilities">
        <p>
          You retain ownership of the auctions, lots, descriptions, and images you create
          (&ldquo;Your Content&rdquo;). You grant us a limited license to host and display Your
          Content solely to operate the Service. You are responsible for Your Content and for
          ensuring your auctions comply with all applicable laws, including consumer-protection and
          tax obligations.
        </p>
        <p>
          When you enter information about buyers or invited participants, you confirm you are
          entitled to share it and that you have informed those people where the law requires it.
          See our{' '}
          <Link className="underline" href="/privacy">
            Privacy Policy
          </Link>{' '}
          for how such data is handled.
        </p>
      </Section>

      <Section heading="5. No warranty">
        <p>
          The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
          warranties of any kind, whether express or implied, to the maximum extent permitted by
          law. We do not guarantee that the Service will be uninterrupted, error-free, or secure, or
          that any auction will achieve a particular outcome.
        </p>
      </Section>

      <Section heading="6. Limitation of liability">
        <p>
          To the maximum extent permitted by law, we are not liable for any indirect, incidental, or
          consequential damages, or for any loss of profits, data, or goodwill, arising from your
          use of the Service. This does not limit any liability that cannot be excluded under
          applicable law, and it does not affect the statutory rights of consumers in the EU and
          Ukraine.
        </p>
      </Section>

      <Section heading="7. Termination">
        <p>
          You may stop using the Service at any time and may request deletion of your account by
          emailing{' '}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          . We may suspend or terminate access if you breach these Terms or use the Service in a way
          that harms others or the Service. On termination, the rights granted to you end, and we
          will handle your data as described in the Privacy Policy.
        </p>
      </Section>

      <Section heading="8. Changes to the Service and Terms">
        <p>
          We may modify or discontinue features, and we may update these Terms. When we make
          material changes we will update the &ldquo;Last updated&rdquo; date and take reasonable
          steps to notify you. Continued use after changes take effect means you accept the updated
          Terms.
        </p>
      </Section>

      <Section heading="9. Governing law">
        <p>
          These Terms are governed by the laws of {GOVERNING_LAW}, without regard to conflict-of-law
          rules. If you are a consumer in the EU, you also benefit from any mandatory protections of
          the law of your country of residence; nothing in these Terms removes those rights.
        </p>
      </Section>

      <Section heading="10. Contact">
        <p>
          Questions about these Terms? Email{' '}
          <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </Section>
    </LegalLayout>
  );
}
