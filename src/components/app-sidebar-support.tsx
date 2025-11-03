"use client";

import { Ellipsis, LifeBuoy, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState, type ReactNode } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";

type SupportOption = "issue" | "idea" | "other";

type SupportOptionConfig = {
  value: SupportOption;
  label: string;
  title: string;
  subject: string;
  icon: ReactNode;
};

const SUPPORT_OPTIONS: SupportOptionConfig[] = [
  {
    value: "issue",
    label: "Issue",
    title: "Report an issue",
    subject: "Report an issue",
    icon: <span className="text-4xl leading-none">⚠️</span>,
  },
  {
    value: "idea",
    label: "Idea",
    title: "Share an idea",
    subject: "Share an idea",
    icon: <span className="text-4xl leading-none">💡</span>,
  },
  {
    value: "other",
    label: "Other",
    title: "Tell us anything!",
    subject: "Tell us anything!",
    icon: (
      <span className="flex items-center justify-center rounded-full text-foreground">
        <Ellipsis className="h-9 w-9" strokeWidth={2.8} />
      </span>
    ),
  },
];

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
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>(createInitialStatus);
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  const selectedOptionConfig = selectedOption
    ? SUPPORT_OPTIONS.find((option) => option.value === selectedOption)
    : null;

  const handleOptionSelect = (option: SupportOptionConfig) => {
    setSelectedOption(option.value);
    setMessage("");
    setStatus(createInitialStatus());
  };

  const resetDialog = () => {
    setSelectedOption(null);
    setMessage("");
    setStatus(createInitialStatus());
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedOptionConfig) {
      setStatus({
        loading: false,
        success: false,
        error: "Please choose a support topic before sending.",
      });
      toast.error("Please choose a support topic before sending.");
      return;
    }

    const userEmail = session?.user?.email;
    const userName = session?.user?.name?.trim() || "SlidesCockpit User";

    if (!userEmail) {
      setStatus({
        loading: false,
        success: false,
        error:
          "We could not find your email address. Please contact support directly.",
      });
      toast.error(
        "We could not find your email address. Please contact support directly.",
      );
      return;
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      setStatus({
        loading: false,
        success: false,
        error: "Please enter a short description before sending.",
      });
      toast.error("Please enter a short description before sending.");
      return;
    }

    setStatus({ loading: true, success: false, error: null });

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          subject: selectedOptionConfig.subject,
          message: trimmedMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send support request");
      }

      setStatus(createInitialStatus());
      setMessage("");
      setIsOpen(false);
      setTimeout(() => {
        toast.success("Thanks for your message! We'll respond shortly.");
      }, 150);
    } catch (error) {
      const messageText =
        error instanceof Error
          ? error.message
          : "Failed to send support request";
      setStatus({ loading: false, success: false, error: messageText });
      toast.error(messageText);
    }
  };

  const isSendDisabled = status.loading || message.trim().length === 0;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
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
              onClick={() => setIsOpen(true)}
            >
              <LifeBuoy className="h-5 w-5" />
              <span className="font-semibold">Support</span>
            </SidebarMenuButton>
          </DialogTrigger>
        </SidebarMenuItem>
      </SidebarMenu>

      <DialogContent
        shouldHaveClose={false}
        className="max-w-md space-y-5 bg-white"
      >
        <div className="flex items-start justify-between">
          <DialogTitle>
            {selectedOptionConfig?.title ?? "What's on your mind?"}
          </DialogTitle>
          <DialogClose
            className="-mr-2 -mt-2 rounded-md p-1 text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </DialogClose>
        </div>

        {selectedOptionConfig === null ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {SUPPORT_OPTIONS.map((option) => (
              <Button
                key={option.value}
                variant="outline"
                className="flex flex-col items-center gap-3 border-muted/40 bg-muted/30 py-12 text-foreground hover:bg-muted"
                onClick={() => handleOptionSelect(option)}
              >
                {option.icon}
                <span className="text-sm font-semibold">{option.label}</span>
              </Button>
            ))}
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {status.error ? (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {status.error}
              </div>
            ) : null}

            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Type your message here..."
              className="min-h-[160px]"
              required
              disabled={status.loading}
            />
            <Button type="submit" className="w-full" disabled={isSendDisabled}>
              {status.loading ? "Sending…" : "Send"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
