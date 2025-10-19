"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTikTokAccounts } from "@/hooks/use-tiktok-accounts";
import { toast } from "sonner";

interface TikTokPostPayload {
  openId: string;
  caption: string;
  mediaUrl: string;
  mediaType: "video" | "photo";
  thumbnailTimestampMs?: number;
  autoAddMusic: boolean;
  postMode: "INBOX" | "PUBLISH" | "DIRECT_POST" | "MEDIA_UPLOAD";
  contentPostingMethod: "UPLOAD" | "MEDIA_UPLOAD" | "DIRECT_POST" | "URL";
}

interface PostStartResponse {
  accepted: boolean;
  publishId: string;
  status: "processing";
}

interface StatusResponse {
  status: "processing" | "success" | "failed" | "inbox";
  postId?: string;
  releaseUrl?: string;
}

interface TikTokPostResult {
  publishId: string;
  status: StatusResponse["status"];
  postId?: string;
  releaseUrl?: string;
}

export default function TikTokPostingTestPage() {
  const [form, setForm] = useState<TikTokPostPayload>({
    openId: "",
    caption: "",
    mediaUrl: "",
    mediaType: "video",
    thumbnailTimestampMs: 1000,
    autoAddMusic: true,
    postMode: "PUBLISH",
    contentPostingMethod: "UPLOAD",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<TikTokPostResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const {
    accounts,
    loading: accountsLoading,
    error: accountsError,
    refresh: refreshAccounts,
  } = useTikTokAccounts();

  useEffect(() => {
    if (accountsError) {
      toast.error(accountsError);
    }
  }, [accountsError]);

  useEffect(() => {
    if (accounts.length === 0) {
      setForm((prev) => ({ ...prev, openId: "" }));
      return;
    }

    const exists = accounts.some((account) => account.openId === form.openId);
    if (!exists) {
      const fallback = accounts[0];
      if (fallback) {
        setForm((prev) => ({ ...prev, openId: fallback.openId }));
      }
    }
  }, [accounts, form.openId]);

  const updateField = useCallback(
    <K extends keyof TikTokPostPayload>(
      key: K,
      value: TikTokPostPayload[K],
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const pollStatus = useCallback(
    async (openId: string, publishId: string): Promise<StatusResponse> => {
      const MAX_ATTEMPTS = 30;
      const DELAY_MS = 5_000;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const response = await fetch(
          `/api/tests/tiktok-post/status?openId=${encodeURIComponent(openId)}&publishId=${encodeURIComponent(publishId)}`,
          {
            cache: "no-store",
          },
        );
        const payload = (await response.json().catch(() => null)) as StatusResponse | { error?: string } | null;

        if (!response.ok || !payload || typeof payload !== "object" || !("status" in payload)) {
          const message =
            payload &&
            typeof payload === "object" &&
            "error" in payload &&
            typeof payload.error === "string"
              ? payload.error
              : "TikTok Status konnte nicht abgefragt werden";
          throw new Error(message);
        }

        if (payload.status !== "processing") {
          return payload;
        }

        await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
      }

      throw new Error(
        "TikTok Status blieb im Status 'processing'. Bitte versuche es später erneut.",
      );
    },
    [],
  );

  const handleSubmit = useCallback(async () => {
    if (!form.openId) {
      toast.error("Bitte wähle einen verbundenen TikTok Account aus");
      return;
    }

    if (!form.mediaUrl) {
      toast.error("Bitte gib eine Medien-URL aus dem Files-Bucket an");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/tests/tiktok-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          openId: form.openId,
          caption: form.caption,
          mediaUrl: form.mediaUrl,
          mediaType: form.mediaType,
          thumbnailTimestampMs: form.thumbnailTimestampMs,
          autoAddMusic: form.autoAddMusic,
          postMode: form.postMode,
          contentPostingMethod: form.contentPostingMethod,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | PostStartResponse
        | { error?: string }
        | null;

      if (!response.ok || !payload || typeof payload !== "object" || !("status" in payload)) {
        const message =
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          typeof payload.error === "string"
            ? payload.error
            : "TikTok Posting fehlgeschlagen";
        setError(message);
        toast.error(message);
        return;
      }

      if ("accepted" in payload && payload.accepted) {
        setResult({ publishId: payload.publishId, status: payload.status });
        toast.success("TikTok Post wurde gestartet – Status wird abgefragt");

        try {
          const finalStatus = await pollStatus(form.openId, payload.publishId);
          setResult({
            publishId: payload.publishId,
            status: finalStatus.status,
            postId: finalStatus.postId ?? payload.publishId,
            releaseUrl: finalStatus.releaseUrl,
          });

          if (finalStatus.status === "success") {
            toast.success("TikTok Post erfolgreich veröffentlicht");
          } else if (finalStatus.status === "inbox") {
            toast.success("TikTok Post wurde in den Inbox-Entwürfen abgelegt");
          } else if (finalStatus.status === "failed") {
            toast.error("TikTok Post wurde von TikTok abgelehnt");
          }
        } catch (pollError) {
          const message =
            pollError instanceof Error
              ? pollError.message
              : "TikTok Status konnte nicht abgefragt werden";
          setError(message);
          toast.error(message);
        }
        return;
      }

      setResult({
        publishId: payload.publishId ?? "",
        status: payload.status,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [form, pollStatus]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold">TikTok Posting Test</h1>
        <p className="text-muted-foreground">
          Lade ein Asset über die Pre-Sign-Route hoch und teste danach das
          direkte Posting zu TikTok.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post konfigurieren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="openId">Verbundenes TikTok Konto</Label>
              <select
                id="openId"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                disabled={accountsLoading || accounts.length === 0}
                value={form.openId}
                onChange={(event) => updateField("openId", event.target.value)}
              >
                {accountsLoading && <option>Lade Konten…</option>}
                {!accountsLoading && accounts.length === 0 && (
                  <option>Keine TikTok Accounts verbunden</option>
                )}
                {accounts.map((account) => {
                  const label =
                    account.username ?? account.displayName ?? account.openId;
                  return (
                    <option key={account.openId} value={account.openId}>
                      {label}
                    </option>
                  );
                })}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mediaUrl">Medien-URL</Label>
              <Input
                id="mediaUrl"
                placeholder="https://files.slidescockpit.com/..."
                value={form.mediaUrl}
                onChange={(event) =>
                  updateField("mediaUrl", event.target.value)
                }
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mediaType">Medientyp</Label>
              <select
                id="mediaType"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.mediaType}
                onChange={(event) => {
                  const nextType = event.target
                    .value as TikTokPostPayload["mediaType"];
                  setForm((prev) => ({
                    ...prev,
                    mediaType: nextType,
                    postMode:
                      nextType === "photo"
                        ? "INBOX"
                        : prev.postMode === "INBOX" ||
                            prev.postMode === "MEDIA_UPLOAD"
                          ? "PUBLISH"
                          : prev.postMode,
                    contentPostingMethod:
                      nextType === "photo"
                        ? "MEDIA_UPLOAD"
                        : prev.contentPostingMethod === "MEDIA_UPLOAD"
                          ? "UPLOAD"
                          : prev.contentPostingMethod,
                  }));
                }}
              >
                <option value="video">Video</option>
                <option value="photo">Photo (Carousel)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnailTimestamp">
                Thumbnail Timestamp (ms)
              </Label>
              <Input
                id="thumbnailTimestamp"
                type="number"
                value={form.thumbnailTimestampMs ?? ""}
                onChange={(event) =>
                  updateField(
                    "thumbnailTimestampMs",
                    event.target.value === ""
                      ? undefined
                      : Number(event.target.value),
                  )
                }
                disabled={form.mediaType !== "video"}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="postMode">Post Mode</Label>
              <select
                id="postMode"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.postMode}
                onChange={(event) =>
                  updateField(
                    "postMode",
                    event.target.value as TikTokPostPayload["postMode"],
                  )
                }
              >
                <option value="INBOX">Inbox (Draft)</option>
                <option value="PUBLISH">Direct Publish</option>
                <option value="MEDIA_UPLOAD">TikTok Media Upload</option>
                <option value="DIRECT_POST">TikTok Direct Post</option>
              </select>
              <p className="text-sm text-muted-foreground">
                Inbox entspricht TikToks Draft-Flow. Für Direct Publish wähle
                PUBLISH/DIRECT_POST.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="contentPostingMethod">Posting Methode</Label>
              <select
                id="contentPostingMethod"
                className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={form.contentPostingMethod}
                onChange={(event) =>
                  updateField(
                    "contentPostingMethod",
                    event.target
                      .value as TikTokPostPayload["contentPostingMethod"],
                  )
                }
              >
                <option value="UPLOAD">Upload (Videos)</option>
                <option value="MEDIA_UPLOAD">
                  Media Upload (Inbox/Drafts)
                </option>
                <option value="DIRECT_POST">Direct Post</option>
                <option value="URL">Pull from URL</option>
              </select>
              <p className="text-sm text-muted-foreground">
                Muss zu TikToks post_mode passen. MEDIA_UPLOAD sendet Inhalte in
                den Inbox-Entwurf.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Was soll TikTok posten?"
              value={form.caption}
              onChange={(event) => updateField("caption", event.target.value)}
              rows={4}
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="auto-music"
              checked={form.autoAddMusic}
              onCheckedChange={(checked) =>
                updateField("autoAddMusic", checked)
              }
            />
            <div>
              <Label htmlFor="auto-music">Automatische Musik hinzufügen</Label>
              <p className="text-sm text-muted-foreground">
                Aktiviert standardmäßig, damit TikTok Hintergrundmusik wählt.
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex items-center gap-4">
          <Button
            onClick={handleSubmit}
            disabled={submitting || accountsLoading || accounts.length === 0}
          >
            {submitting ? "Posting & Polling..." : "TikTok Post auslösen"}
          </Button>
          <Button
            variant="outline"
            onClick={() => void refreshAccounts()}
            disabled={accountsLoading}
          >
            Accounts aktualisieren
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardFooter>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Ergebnis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="font-semibold">Publish ID:</span>{" "}
              {result.publishId}
            </p>
            {result.postId && (
              <p>
                <span className="font-semibold">Post ID:</span> {result.postId}
              </p>
            )}
            {result.releaseUrl ? (
              <p>
                <span className="font-semibold">Release URL:</span>{" "}
                <a
                  href={result.releaseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline"
                >
                  {result.releaseUrl}
                </a>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Keine Release URL verfügbar – bei Inbox-Posts liefert TikTok
                keine URL.
              </p>
            )}
            <p>
              <span className="font-semibold">Status:</span> {result.status}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
