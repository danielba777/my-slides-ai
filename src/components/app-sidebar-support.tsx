"use client";

import { LifeBuoy } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";

type SupportOption = "issue" | "idea" | "other";

const SUPPORT_OPTIONS: Array<{ value: SupportOption; label: string }> = [
  { value: "issue", label: "Issue" },
  { value: "idea", label: "Idea" },
  { value: "other", label: "Other" },
];

const createInitialFormData = () => ({
  name: "",
  email: "",
  subject: "",
  message: "",
});

type FormData = ReturnType<typeof createInitialFormData>;

type FormStatus = {
  loading: boolean;
  success: boolean;
  error: string | null;
};

const createInitialStatus = (): FormStatus => ({
  loading: false,
  success: false,
  error: null,
});

export function SidebarSupportButton() {
  const [selectedOption, setSelectedOption] = useState<SupportOption | null>(
    null,
  );
  const [formData, setFormData] = useState<FormData>(createInitialFormData);
  const [status, setStatus] = useState<FormStatus>(createInitialStatus);

  const handleOptionSelect = (option: (typeof SUPPORT_OPTIONS)[number]) => {
    setSelectedOption(option.value);
    setFormData({
      ...createInitialFormData(),
      subject: option.label,
    });
    setStatus(createInitialStatus());
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus({ loading: true, success: false, error: null });
    const currentSubject = formData.subject;

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send support request");
      }

      setStatus({ loading: false, success: true, error: null });
      setFormData({
        ...createInitialFormData(),
        subject: currentSubject,
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to send support request";
      setStatus({ loading: false, success: false, error: message });
    }
  };

  const resetDialog = () => {
    setSelectedOption(null);
    setFormData(createInitialFormData());
    setStatus(createInitialStatus());
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) {
          resetDialog();
        }
      }}
    >
      <SidebarMenu>
        <SidebarMenuItem>
          <DialogTrigger asChild>
            <SidebarMenuButton
              type="button"
              className="font-semibold"
              tooltip="Support"
            >
              <LifeBuoy className="h-5 w-5" />
              <span className="font-semibold">Support</span>
            </SidebarMenuButton>
          </DialogTrigger>
        </SidebarMenuItem>
      </SidebarMenu>

      <DialogContent className="max-w-md space-y-5">
        <DialogHeader>
          <DialogTitle>What&apos;s on your mind?</DialogTitle>
        </DialogHeader>

        {selectedOption === null ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {SUPPORT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                onClick={() => handleOptionSelect(option)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {status.success ? (
              <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700">
                Thanks for your message! We&apos;ll respond shortly.
              </div>
            ) : null}

            {status.error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {status.error}
              </div>
            ) : null}

            <div className="text-sm text-muted-foreground">
              Selected: {formData.subject || "Support request"}
            </div>

            <Input
              name="name"
              placeholder="Your name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={status.loading}
            />
            <Input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={status.loading}
            />
            <Input
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleChange}
              required
              disabled={status.loading}
            />
            <Textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="How can we help?"
              className="min-h-[140px]"
              required
              disabled={status.loading}
            />
            <Button type="submit" className="w-full" disabled={status.loading}>
              {status.loading ? "Sending…" : "Send message"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
