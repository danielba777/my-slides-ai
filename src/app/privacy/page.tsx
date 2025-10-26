import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | SlidesCockpit",
  description:
    "Overview of how SlidesCockpit collects, uses, and protects personal data.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(new Date("2025-10-26"));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline"
        >
          <span aria-hidden>←</span>
          <span>Back</span>
        </Link>
      </div>

      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {lastUpdated}
      </p>

      <div className="prose prose-neutral mt-8 max-w-none prose-headings:scroll-mt-24">
        <p>
          At SlidesCockpit (<strong>https://slidescockpit.com</strong>), we are
          committed to protecting your privacy and ensuring the security of your
          personal information. This Privacy Policy outlines how we collect,
          use, and safeguard your data when you use our web application.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          We collect minimal personal information necessary to provide our
          services:
        </p>
        <ul>
          <li>Email address</li>
          <li>User ID (provided by TikTok or other connected platforms)</li>
        </ul>
        <p>
          This information is used to associate the content you create with your
          account and to facilitate payments through Stripe.
        </p>

        <h2>2. How We Use Your Information</h2>
        <ul>
          <li>To tie the content you create to your account</li>
          <li>To facilitate payments through Stripe</li>
          <li>
            To upload posts or carousels to TikTok or Instagram on your behalf
            (with your explicit permission)
          </li>
        </ul>

        <h2>3. TikTok and Instagram Integration</h2>
        <p>
          When you grant us permission to access your TikTok or Instagram
          account, we only use this access to upload your content. We do not:
        </p>
        <ul>
          <li>Access personal information from your accounts</li>
          <li>Like, comment, or follow accounts on your behalf</li>
          <li>Edit or delete your existing posts</li>
          <li>Upload any content without your explicit permission</li>
        </ul>

        <h2>4. Authentication and API Usage</h2>
        <p>
          SlidesCockpit uses authentication systems and social media APIs (such
          as TikTok and Instagram) to provide functionality. By using our
          service, you agree to their respective Terms of Service and Privacy
          Policies.
        </p>
        <p>
          SlidesCockpit accesses and uses authorized data solely for the purpose
          of posting content on your behalf. Authentication tokens are stored
          securely until they expire and require re-authentication.
        </p>

        <h3>Data Deletion and Revoking Access</h3>
        <p>
          You can revoke SlidesCockpit's access to your connected accounts at
          any time through TikTok or Meta security settings. Once revoked, all
          related tokens and data will be promptly deleted.
        </p>

        <h2>5. Data Sharing and Third Parties</h2>
        <p>
          We do not sell, share, or disclose your personal information to any
          third parties. Your data is kept strictly within SlidesCockpit for
          service functionality.
        </p>

        <h2>6. Data Storage and Security</h2>
        <p>
          Your information is stored securely in our database and will not be
          transferred outside our system unless you request us to delete your
          email and associated data.
        </p>

        <h2>7. Cookies and Tracking</h2>
        <p>
          We do not use cookies or tracking technologies to track users. We use
          PostHog to monitor button clicks and app interactions to improve user
          experience. This information is internal and not shared with any third
          parties.
        </p>

        <h2>8. Your Rights</h2>
        <p>
          You have the right to request deletion of your account and associated
          data. To exercise this right, please contact us using the email below.
        </p>

        <h2>9. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Any changes will
          be posted on this page.
        </p>

        <h2>10. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us
          at:
        </p>
        <p>
          <strong>Email:</strong>{" "}
          <a href="mailto:info@slidescockpit.com">info@slidescockpit.com</a>
        </p>

        <h2>11. Compliance</h2>
        <p>
          While we strive to follow best practices in data protection, we
          recommend consulting with a legal professional to ensure full
          compliance with applicable privacy laws (such as GDPR or CCPA)
          depending on your location and usage.
        </p>
      </div>
    </main>
  );
}
