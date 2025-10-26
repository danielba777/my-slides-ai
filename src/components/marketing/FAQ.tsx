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
} from "lucide-react";
import { Section } from "./Section";

export function MarketingFAQ() {
  const items = [
    {
      q: "How many TikTok accounts can I connect?",
      a: "Starter includes 1 account, Growth 3 accounts, Scale 10 accounts, and Unlimited has no cap.",
      icon: UsersIcon,
    },
    {
      q: "Can I add team members?",
      a: "Yes. Starting with Scale you can invite unlimited collaborators to work together.",
      icon: UsersIcon,
    },
    {
      q: "Is there a step-by-step guide?",
      a: "Inside the app you'll find a quick-start tutorial plus proven templates for repeatable wins.",
      icon: BookOpenIcon,
    },
    {
      q: "Do you have a partner program?",
      a: "Yes. Earn 20% commission for every referral that becomes a customer.",
      icon: TrendingUpIcon,
    },
    {
      q: "How fast can I start seeing revenue?",
      a: "Most users create their first viral slides within 24 hours and see traction shortly after.",
      icon: TrendingUpIcon,
    },
    {
      q: "Is the content truly unique?",
      a: "Yes. Our AI produces original content based on your ideas and brand—never recycled scripts.",
      icon: HelpCircleIcon,
    },
    {
      q: "Can I match my branding?",
      a: "Yes. Customize colors, fonts, and styles to mirror your brand perfectly.",
      icon: MessageCircleIcon,
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

        {/* FAQ Items */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-gray-200/60 bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden">
            <Accordion type="single" collapsible className="space-y-2">
              {items.map((it, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <AccordionItem
                    value={`item-${idx}`}
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
