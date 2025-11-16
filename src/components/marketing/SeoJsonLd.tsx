
export function SeoJsonLd() {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SlidesCockpit",
    url: "https://slidescockpit.com",
    logo: "https://slidescockpit.com/logo-og.png",
  };

  
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How can I cancel my subscription?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "You can cancel anytime in your account's billing portal. Your plan remains active until the end of the billing period.",
        },
      },
      {
        "@type": "Question",
        name: "How do credits work?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Each plan includes monthly credits that you can spend on generating slides and automations. Credits reset every month.",
        },
      },
      {
        "@type": "Question",
        name: "Can I schedule posts automatically?",
        acceptedAnswer: {
          "@type": "Answer",
          text:
            "Yes. Connect your TikTok account and schedule posts directly from SlidesCockpit. We'll publish them at the selected time.",
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        
        dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }}
      />
      <script
        type="application/ld+json"
        
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }}
      />
    </>
  );
}