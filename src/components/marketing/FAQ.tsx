"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  BookOpenIcon,
  HelpCircleIcon,
  MessageCircleIcon,
  TrendingUpIcon,
  UsersIcon,
  CreditCardIcon,
} from "lucide-react";
import { Section } from "./Section";

export function MarketingFAQ() {
  // Grouped by category (design stays the same; we only show clear category blocks)
  const categories: {
    title: string;
    items: { q: string; a: string; icon: React.ComponentType<{ className?: string }> }[];
  }[] = [
    {
      title: "SlidesCockpit General",
      items: [
        {
          q: "How can I cancel my subscription?",
          a: "Open Profile → Billing → Manage Subscription. You'll be redirected to Stripe where you can cancel anytime.",
          icon: HelpCircleIcon,
        },
        {
          q: "How many TikTok accounts can I connect?",
          a: "Depends on your plan: Starter 1, Growth 3, Scale 10, Unlimited ∞. You can upgrade any time.",
          icon: UsersIcon,
        },
        {
          q: "Can I invite team members?",
          a: "Workspace access is planned. Until then, you may share your account with trusted collaborators.",
          icon: UsersIcon,
        },
        {
          q: "Do you have an affiliate program?",
          a: "Not yet. Email info@slidescockpit.com to get notified when it launches.",
          icon: TrendingUpIcon,
        },
      ],
    },
    {
      title: "TikTok Setup & Management",
      items: [
        {
          q: "How do I connect my TikTok account?",
          a: "Click Connect TikTok in the dashboard and complete the official OAuth flow. Your account will appear under Connections.",
          icon: BookOpenIcon,
        },
        {
          q: "What permissions does SlidesCockpit need?",
          a: "Only posting rights. We never like, comment, or access private info from your TikTok account.",
          icon: HelpCircleIcon,
        },
        {
          q: "Can I schedule posts automatically?",
          a: "Yes. After connecting your account you can schedule slideshows to publish at specific times.",
          icon: MessageCircleIcon,
        },
        {
          q: "OAuth failed — can I reconnect?",
          a: "Yes. Remove access in TikTok's Security → Apps and reconnect via SlidesCockpit.",
          icon: HelpCircleIcon,
        },
      ],
    },
    {
      title: "Usage, Credits & Plans",
      items: [
        {
          q: "How do credits work?",
          a: "Each plan includes a number of slideshow generations. The Free plan includes a small monthly quota to get started.",
          icon: TrendingUpIcon,
        },
        {
          q: "Do unused credits roll over?",
          a: "When upgrading, remaining credits are carried over automatically to your new plan.",
          icon: TrendingUpIcon,
        },
        {
          q: "Can I switch plans anytime?",
          a: "Yes. Upgrades apply instantly; downgrades take effect at the end of the billing cycle.",
          icon: HelpCircleIcon,
        },
        {
          q: "What if I run out of credits?",
          a: "Upgrade your plan or wait until your credits reset at the start of the next period.",
          icon: HelpCircleIcon,
        },
      ],
    },
    {
      title: "Slides & Automation",
      items: [
        {
          q: "Can I post to multiple accounts at once?",
          a: "Yes, depending on your plan limit you can schedule the same slideshow to several TikTok accounts.",
          icon: MessageCircleIcon,
        },
        {
          q: "Can I edit or delete slides after scheduling?",
          a: "You can edit drafts before they're published. Once live on TikTok, manage the post directly in TikTok.",
          icon: BookOpenIcon,
        },
        {
          q: "Where do the images come from?",
          a: "From your uploads or our image sets. For commercial use we recommend your own or licensed media.",
          icon: HelpCircleIcon,
        },
        {
          q: "Can I upload my own images?",
          a: "Absolutely. Upload custom images and mix them with AI or library content.",
          icon: MessageCircleIcon,
        },
      ],
    },
    {
      title: "Billing & Support",
      items: [
        {
          q: "How is billing handled?",
          a: "All payments are processed securely via Stripe. Invoices and plan details are available in Billing.",
          icon: CreditCardIcon,
        },
        {
          q: "Do you offer refunds?",
          a: "Refunds are provided as content credits only. Monetary refunds aren't available once AI content is generated.",
          icon: HelpCircleIcon,
        },
        {
          q: "How do I contact support?",
          a: "Email us at info@slidescockpit.com or use the in-app support. We're happy to help.",
          icon: HelpCircleIcon,
        },
      ],
    },
  ];

  return (
    <Section id="faq">
      <div className="relative mx-auto max-w-5xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-6 mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-[#c2d5ff] rounded-full text-sm font-medium text-indigo-700 mb-4">
            <HelpCircleIcon className="w-4 h-4" />
            Frequently asked questions
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Everything you need
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#304674] to-[#1f2f55]">
              to know
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Find answers to the most important{" "}
            <span className="font-bold text-[#304674]">SlidesCockpit</span>{" "}
            questions and launch with confidence.
          </p>
        </motion.div>

        {/* FAQ Items (grouped by category) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {categories.map((cat, cIdx) => (
            <div
              key={cat.title}
              className="rounded-2xl border border-gray-200/60 bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden"
            >
              {/* Category header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50/40 to-purple-50/30">
                <h3 className="text-lg font-semibold text-gray-900">{cat.title}</h3>
              </div>

              <Accordion type="single" collapsible className="space-y-2">
                {cat.items.map((it, idx) => (
                  <motion.div
                    key={`${cIdx}-${idx}`}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: (cIdx * 0.05) + idx * 0.08 }}
                  >
                    <AccordionItem
                      value={`cat-${cIdx}-item-${idx}`}
                      className="border-b border-gray-100 last:border-b-0 overflow-hidden"
                    >
                      <AccordionTrigger className="text-left text-gray-900 hover:no-underline hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 rounded-none px-6 py-5 transition-all duration-200 group">
                        <div className="flex items-center gap-4 w-full">
                          <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-[#c2d5ff] flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                            <it.icon className="w-5 h-5 text-[#304674]" />
                          </div>
                          <span className="text-base sm:text-lg font-semibold leading-tight">
                            {it.q}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-6 text-[15px] leading-relaxed text-gray-600 pl-20">
                        {it.a}
                      </AccordionContent>
                    </AccordionItem>
                  </motion.div>
                ))}
              </Accordion>
            </div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="bg-gradient-to-r from-[#304674] to-[#1f2f55] rounded-3xl p-8 sm:p-12 text-white shadow-2xl">
            <h3 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to launch?
            </h3>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of successful creators and kick off your TikTok
              engine today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#304674]/10 border border-[#304674]/30 text-white font-semibold rounded-2xl hover:bg-[#304674]/20 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Get started
              </a>
              <a
                href="#library"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#304674]/10 border border-[#304674]/30 text-white font-semibold rounded-2xl hover:bg-[#304674]/20 transition-colors duration-200"
              >
                See examples
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
