import Link from "next/link";

export const metadata = {
  title: "Terms of Service | SlidesCockpit",
  description: "Contractual terms that govern the usage of SlidesCockpit.",
};

export default function TermsOfServicePage() {
  const lastUpdated = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "2-digit",
    year: "numeric",
  }).format(new Date("2025-10-26"));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      {}
      <div className="mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:underline"
        >
          <span aria-hidden>←</span>
          <span>Back</span>
        </Link>
      </div>

      {}
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: {lastUpdated}
      </p>

      {}
      <div className="prose prose-neutral mt-8 max-w-none prose-headings:scroll-mt-24">
        <p>
          Welcome to SlidesCockpit. By accessing or using our service at{" "}
          <strong>https://slidescockpit.com</strong>, you agree to be bound by
          these Terms of Service ("Terms").
        </p>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing or using SlidesCockpit, you agree to these Terms and our
          Privacy Policy. If you disagree with any part of these terms, you may
          not access the service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          SlidesCockpit provides a web application for TikTok and Instagram
          carousel automation and scheduling. The service may include:
        </p>
        <ul>
          <li>AI-based carousel and post creation</li>
          <li>Social media scheduling and automation</li>
          <li>Integration with TikTok and Instagram APIs</li>
        </ul>

        <h2>3. Account Terms</h2>
        <ul>
          <li>Have a valid email address</li>
          <li>Provide accurate account information</li>
          <li>Be responsible for maintaining account security</li>
          <li>Notify us of any unauthorized account usage</li>
        </ul>

        <h2>4. Subscription and Trial Terms</h2>
        <ul>
          <li>Billing occurs monthly</li>
          <li>Users may cancel their subscription at any time</li>
          <li>Refunds are prorated</li>
          <li>
            For failed post generations, refunds are provided only in the form
            of content credits
          </li>
          <li>
            AI-generated content (text, images, or slides) is non-refundable
            once generated
          </li>
          <li>
            Credits used for AI-generated content cannot be restored, regardless
            of satisfaction with the results
          </li>
        </ul>

        <h2>5. Platform Integration Terms</h2>
        <ul>
          <li>
            You authorize SlidesCockpit to upload content to your TikTok and
            Instagram accounts
          </li>
          <li>
            You remain responsible for compliance with TikTok’s and Instagram’s
            Terms of Service
          </li>
          <li>
            You maintain ownership of all content uploaded through our service
          </li>
          <li>
            You can revoke TikTok access through TikTok’s security settings at
            any time
          </li>
          <li>
            You can revoke Instagram access through your Meta account or
            SlidesCockpit settings
          </li>
        </ul>

        <h2>6. Image Sets and User Responsibility</h2>
        <p>
          SlidesCockpit provides access to a library of "image sets" for use in
          slide and post creation. Regarding these images:
        </p>
        <ul>
          <li>
            All image sets are provided "as is" without any warranties of
            ownership, licensing, or right of use
          </li>
          <li>
            SlidesCockpit does not claim ownership of these images and cannot
            guarantee their copyright status
          </li>
          <li>
            While these images are available for use in posts created on our
            platform, we strongly recommend replacing them with your own
            properly licensed content for public or commercial use
          </li>
          <li>
            By using any image sets in your published content, you assume full
            and complete responsibility for such use
          </li>
          <li>
            You agree to indemnify, defend, and hold harmless SlidesCockpit, its
            owners, directors, employees, agents, and affiliates from any
            claims, damages, losses, or liabilities arising from your use of
            these images
          </li>
          <li>
            SlidesCockpit bears no responsibility for any copyright infringement
            or intellectual property violations resulting from your use of these
            images
          </li>
          <li>
            You agree not to redistribute, sell, or license any image sets
            outside of posts created using the SlidesCockpit platform
          </li>
          <li>
            SlidesCockpit reserves the right to remove access to any image at
            any time without notice or liability
          </li>
        </ul>

        <h2>7. Service Modifications</h2>
        <ul>
          <li>We may modify or discontinue any feature without prior notice</li>
          <li>We may make changes to the service at our discretion</li>
          <li>
            We will consider user feedback regarding discontinued features
          </li>
        </ul>

        <h2>8. Data Storage and Account Management</h2>
        <ul>
          <li>
            We store basic user information (name, email, user_id) and created
            posts indefinitely
          </li>
          <li>No confidential information is stored</li>
          <li>
            To delete your account, email{" "}
            <a href="mailto:info@slidescockpit.com">info@slidescockpit.com</a>
          </li>
          <li>We do not maintain backups of user data</li>
        </ul>

        <h2>9. Usage Terms</h2>
        <ul>
          <li>No daily or monthly usage limits apply</li>
          <li>Account sharing is permitted</li>
          <li>Commercial use is allowed</li>
        </ul>

        <h2>10. Service Interruptions</h2>
        <ul>
          <li>
            We may provide free content credits as compensation for extended
            downtime
          </li>
          <li>
            No monetary compensation is provided for service interruptions
          </li>
        </ul>

        <h2>11. Intellectual Property</h2>
        <p>
          The SlidesCockpit name and logo are protected trademarks. Users retain
          all rights to their created content. Any AI-generated templates,
          designs, or system-generated assets may be reused by SlidesCockpit to
          improve the service.
        </p>

        <h2>12. Legal Jurisdiction</h2>
        <p>
          Any legal disputes shall be resolved in Düsseldorf, Germany. Claims
          must be filed within 24 hours of the incident in question.
        </p>

        <h2>13. Age Requirements</h2>
        <p>
          While we do not enforce strict age restrictions, users under 13 years
          old should have parental consent.
        </p>

        <h2>14. Changes to Terms</h2>
        <p>We reserve the right to modify these Terms at any time.</p>

        <h2>15. Contact Information</h2>
        <p>
          For questions about these Terms, please contact:{" "}
          <a href="mailto:info@slidescockpit.com">info@slidescockpit.com</a>
        </p>
      </div>
    </main>
  );
}
