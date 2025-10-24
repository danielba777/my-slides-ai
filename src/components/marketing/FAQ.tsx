"use client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section } from "./Section";
import { motion } from "framer-motion";
import { HelpCircleIcon, MessageCircleIcon, UsersIcon, BookOpenIcon, TrendingUpIcon } from "lucide-react";

export function MarketingFAQ() {
  const items = [
    {
      q: "Wie viele TikTok-Konten kann ich verbinden?",
      a: "Starter enthält 1 Konto, Growth 3 Konten, Scale 10 Konten und Unlimited hat keine Begrenzung.",
      icon: UsersIcon,
    },
    {
      q: "Kann ich Teammitglieder hinzufügen?",
      a: "Ja. Ab Scale können Sie unbegrenzt Teammitglieder zur Zusammenarbeit einladen.",
      icon: UsersIcon,
    },
    {
      q: "Gibt es eine Schritt-für-Schritt-Anleitung?",
      a: "In der App finden Sie ein schnelles Start-Tutorial und bewährte Vorlagen für den Erfolg.",
      icon: BookOpenIcon,
    },
    {
      q: "Haben Sie ein Partnerprogramm?",
      a: "Ja. Verdienen Sie 20% Provision für jeden Empfehls, der zum Kunden wird.",
      icon: TrendingUpIcon,
    },
    {
      q: "Wie schnell kann ich mit dem Einnähmen beginnen?",
      a: "Die meisten Nutzer erstellen ihre ersten viralen Slides innerhalb von 24 Stunden und sehen die ersten Ergebnisse.",
      icon: TrendingUpIcon,
    },
    {
      q: "Ist der Content wirklich einzigartig?",
      a: "Ja. Unsere KI erstellt einzigartige Inhalte basierend auf Ihren Ideen und Ihrem Brand – keine Kopien.",
      icon: HelpCircleIcon,
    },
    {
      q: "Kann ich mein Branding anpassen?",
      a: "Ja. Passen Sie Farben, Schriftarten und Stile vollständig an Ihr Brand an.",
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
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full text-sm font-medium text-indigo-700 mb-4">
            <HelpCircleIcon className="w-4 h-4" />
            Häufige Fragen
          </div>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight">
            Alles, was Sie wissen
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[#304674] to-[#1f2f55]">
              müssen
            </span>
          </h2>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Finden Sie Antworten auf die wichtigsten Fragen zu <span className="font-bold text-[#304674]">SlidesCockpit</span> und starten Sie erfolgreich durch.
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
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
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
              Bereit, durchzustarten?
            </h3>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Join tausenden erfolgreicher Creator und starten Sie noch heute Ihre TikTok-Karriere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#304674]/10 border border-[#304674]/30 text-white font-semibold rounded-2xl hover:bg-[#304674]/20 transition-colors duration-200 shadow-lg hover:shadow-xl"
              >
                Jetzt starten
              </a>
              <a
                href="#library"
                className="inline-flex items-center justify-center px-8 py-4 bg-[#304674]/10 border border-[#304674]/30 text-white font-semibold rounded-2xl hover:bg-[#304674]/20 transition-colors duration-200"
              >
                Beispiele ansehen
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
