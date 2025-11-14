"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section } from "./Section";

export function MarketingFAQ() {
  // Grouped by category (design stays the same; we only show clear category blocks)
  const categories: {
    title: string;
    items: {
      q: string;
      a: string;
    }[];
  }[] = [
    {
      title: "SlidesCockpit General",
      items: [
        {
          q: "How can I cancel my subscription?",
          a: "Open Profile → Billing → Manage Subscription. You'll be redirected to Stripe where you can cancel anytime.",
        },
        {
          q: "How many TikTok accounts can I connect?",
          a: "Depends on your plan: Starter 1, Growth 3, Scale 10, Unlimited ∞. You can upgrade any time.",
        },
        {
          q: "Can I invite team members?",
          a: "Workspace access is planned. Until then, you may share your account with trusted collaborators.",
        },
        {
          q: "Do you have an affiliate program?",
          a: "Not yet. Email info@slidescockpit.com to get notified when it launches.",
        },
      ],
    },
    {
      title: "TikTok Setup & Management",
      items: [
        {
          q: "How do I connect my TikTok account?",
          a: "Click Connect TikTok in the dashboard and complete the official OAuth flow. Your account will appear under Connections.",
        },
        {
          q: "What permissions does SlidesCockpit need?",
          a: "Only posting rights. We never like, comment, or access private info from your TikTok account.",
        },
        {
          q: "Can I schedule posts automatically?",
          a: "Yes. After connecting your account you can schedule slideshows to publish at specific times.",
        },
        {
          q: "OAuth failed - can I reconnect?",
          a: "Yes. Remove access in TikTok's Security → Apps and reconnect via SlidesCockpit.",
        },
      ],
    },
    {
      title: "Usage, Credits & Plans",
      items: [
        {
          q: "How do credits work?",
          a: "Each plan includes a number of slideshow generations. The Free plan includes a small monthly quota to get started.",
        },
        {
          q: "Do unused credits roll over?",
          a: "When upgrading, remaining credits are carried over automatically to your new plan.",
        },
        {
          q: "Can I switch plans anytime?",
          a: "Yes. Upgrades apply instantly; downgrades take effect at the end of the billing cycle.",
        },
        {
          q: "What if I run out of credits?",
          a: "Upgrade your plan or wait until your credits reset at the start of the next period.",
        },
      ],
    },
    {
      title: "Slides & Automation",
      items: [
        {
          q: "Can I post to multiple accounts at once?",
          a: "Yes, depending on your plan limit you can schedule the same slideshow to several TikTok accounts.",
        },
        {
          q: "Can I edit or delete slides after scheduling?",
          a: "You can edit drafts before they're published. Once live on TikTok, manage the post directly in TikTok.",
        },
        {
          q: "Where do the images come from?",
          a: "From your uploads or our image sets. For commercial use we recommend your own or licensed media.",
        },
        {
          q: "Can I upload my own images?",
          a: "Absolutely. Upload custom images and mix them with AI or library content.",
        },
      ],
    },
    {
      title: "Billing & Support",
      items: [
        {
          q: "How is billing handled?",
          a: "All payments are processed securely via Stripe. Invoices and plan details are available in Billing.",
        },
        {
          q: "Do you offer refunds?",
          a: "Refunds are provided as content credits only. Monetary refunds aren't available once AI content is generated.",
        },
        {
          q: "How do I contact support?",
          a: "Email us at info@slidescockpit.com or use the in-app support. We're happy to help!‚",
        },
      ],
    },
  ];

  return (
    <Section id="faq">
      <div className="text-center space-y-5 mb-8">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-zinc-900 leading-tight">
          Frequently Asked Questions
        </h2>
      </div>
      <div className="mx-auto max-w-3xl px-4 sm:px-0">
        <div className="space-y-10">
          {categories.map((cat, cIdx) => (
            <section key={cat.title} className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">{cat.title}</h3>
              <Accordion
                type="single"
                collapsible
                className="divide-y divide-gray-200 border-b border-gray-200"
              >
                {cat.items.map((it, idx) => (
                  <AccordionItem
                    key={`${cIdx}-${idx}`}
                    value={`cat-${cIdx}-item-${idx}`}
                    className="border-0"
                  >
                    <AccordionTrigger className="flex w-full items-center justify-between py-4 text-left text-lg font-medium text-zinc-900 hover:underline">
                      <span>{it.q}</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 pr-8 text-base leading-relaxed text-zinc-800">
                      {it.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}
        </div>
      </div>
    </Section>
  );
}
