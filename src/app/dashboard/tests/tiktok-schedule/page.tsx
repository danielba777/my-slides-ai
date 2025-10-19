"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useTikTokAccounts } from "@/hooks/use-tiktok-accounts";
import { toast } from "sonner";

interface ScheduleResult {
  scheduled: boolean;
  runAt: string;
  jobKey: string;
}

type MediaType = "photo" | "video";
type PostMode = "INBOX" | "PUBLISH" | "DIRECT_POST" | "MEDIA_UPLOAD";
type PostingMethod = "UPLOAD" | "MEDIA_UPLOAD" | "DIRECT_POST" | "URL";

interface ScheduleFormState {
  openId: string;
  caption: string;
  mediaUrl: string;
  mediaType: MediaType;
  thumbnailTimestampMs?: number;
  autoAddMusic: boolean;
  postMode: PostMode;
  contentPostingMethod: PostingMethod;
  publishAt: string;
  idempotencyKey: string;
}

export default function TikTokScheduleTestPage() {
  const {
    accounts,
    loading: accountsLoading,
    error: accountsError,
    refresh: refreshAccounts,
  } = useTikTokAccounts();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ScheduleResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initialPublishAt = useMemo(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  }, []);

  const [form, setForm] = useState<ScheduleFormState>({
    openId: "",
    caption: "",
    mediaUrl: "",
    mediaType: "photo",
    autoAddMusic: true,
    postMode: "INBOX",
    contentPostingMethod: "MEDIA_UPLOAD",
    publishAt: initialPublishAt,
    idempotencyKey: `schedule_${Date.now()}`,
  });

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
      if (!fallback) {
        setForm((prev) => ({ ...prev, openId: "" }));
        return;
      }
      setForm((prev) => ({ ...prev, openId: fallback.openId }));
    }
  }, [accounts, form.openId]);

  const updateField = useCallback(
    <K extends keyof ScheduleFormState>(key: K, value: ScheduleFormState[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
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

    if (!form.publishAt) {
      toast.error("Bitte wähle ein Veröffentlichungsdatum");
      return;
    }

    if (!form.idempotencyKey.trim()) {
      toast.error("Bitte gib einen Idempotency Key an");
      return;
    }

    const publishDate = new Date(form.publishAt);
    if (Number.isNaN(publishDate.getTime())) {
      toast.error("Ungültiges Datum");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    const media =
      form.mediaType === "photo"
        ? [{ type: "photo" as const, url: form.mediaUrl }]
        : [
            {
              type: "video" as const,
              url: form.mediaUrl,
              thumbnailTimestampMs: form.thumbnailTimestampMs ?? 1000,
            },
          ];

    const payload = {
      openId: form.openId,
      publishAt: publishDate.toISOString(),
      idempotencyKey: form.idempotencyKey,
      post: {
        caption: form.caption,
        postMode: form.postMode,
        media,
        settings: {
          contentPostingMethod: form.contentPostingMethod,
          privacyLevel: "SELF_ONLY",
          duet: false,
          comment: false,
          stitch: false,
          autoAddMusic: form.autoAddMusic,
          videoMadeWithAi: false,
          brandContentToggle: false,
          brandOrganicToggle: false,
        },
      },
    };

    try {
      const response = await fetch("/api/tests/tiktok-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => null)) as ScheduleResult | { error?: string } | null;

      if (!response.ok || !data || typeof data !== "object" || !("scheduled" in data)) {
        const message =
          data && typeof data === "object" && "error" in data && typeof data.error === "string"
            ? data.error
            : "TikTok Scheduling fehlgeschlagen";
        setError(message);
        toast.error(message);
        return;
      }

      setResult(data);
      toast.success("TikTok Post wurde erfolgreich geplant");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  const resetIdempotencyKey = useCallback(() => {
    updateField("idempotencyKey", `schedule_${Date.now()}`);
  }, [updateField]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold">TikTok Scheduling Test</h1>
        <p className="text-muted-foreground">
          Plane einen TikTok-Post über die SlidesCockpit API und überprüfe den Hintergrund-Worker.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post planen</CardTitle>
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
                  const label = account.username ?? account.displayName ?? account.openId;
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
                onChange={(event) => updateField("mediaUrl", event.target.value)}
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
                  const nextType = event.target.value as MediaType;
                  setForm((prev) => ({
                    ...prev,
                    mediaType: nextType,
                    postMode:
                      nextType === "photo"
                        ? "INBOX"
                        : prev.postMode === "INBOX" || prev.postMode === "MEDIA_UPLOAD"
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
                <option value="photo">Photo (Inbox)</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="thumbnailTimestamp">Thumbnail Timestamp (ms)</Label>
              <Input
                id="thumbnailTimestamp"
                type="number"
                value={form.thumbnailTimestampMs ?? ""}
                onChange={(event) =>
                  updateField(
                    "thumbnailTimestampMs",
                    event.target.value === "" ? undefined : Number(event.target.value),
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
                  updateField("postMode", event.target.value as PostMode)
                }
              >
                <option value="INBOX">Inbox (Draft)</option>
                <option value="PUBLISH">Direct Publish</option>
                <option value="MEDIA_UPLOAD">TikTok Media Upload</option>
                <option value="DIRECT_POST">TikTok Direct Post</option>
              </select>
              <p className="text-sm text-muted-foreground">
                Inbox entspricht TikToks Draft-Flow. Für Direct Publish wähle PUBLISH/DIRECT_POST.
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
                    event.target.value as PostingMethod,
                  )
                }
              >
                <option value="UPLOAD">Upload (Videos)</option>
                <option value="MEDIA_UPLOAD">Media Upload (Inbox/Drafts)</option>
                <option value="DIRECT_POST">Direct Post</option>
                <option value="URL">Pull from URL</option>
              </select>
              <p className="text-sm text-muted-foreground">
                Muss zu TikToks post_mode passen. MEDIA_UPLOAD sendet Inhalte in den Inbox-Entwurf.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="publishAt">Veröffentlichungszeit (UTC)</Label>
              <Input
                id="publishAt"
                type="datetime-local"
                value={form.publishAt}
                onChange={(event) => updateField("publishAt", event.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Werte werden als UTC-String an die API gesendet.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="idempotencyKey">Idempotency Key</Label>
              <div className="flex gap-2">
                <Input
                  id="idempotencyKey"
                  value={form.idempotencyKey}
                  onChange={(event) => updateField("idempotencyKey", event.target.value)}
                />
                <Button type="button" variant="secondary" onClick={resetIdempotencyKey}>
                  Neu
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Gleiche Keys verhindern doppelte Jobs in der Queue.
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
              id="autoMusic"
              checked={form.autoAddMusic}
              onCheckedChange={(checked) => updateField("autoAddMusic", checked)}
            />
            <div>
              <Label htmlFor="autoMusic">Automatische Musik hinzufügen</Label>
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
            {submitting ? "Planen..." : "TikTok Post planen"}
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
              <span className="font-semibold">Job Key:</span> {result.jobKey}
            </p>
            <p>
              <span className="font-semibold">Ausführung geplant für:</span> {result.runAt}
            </p>
            <p>
              <span className="font-semibold">Status:</span>{" "}
              {result.scheduled ? "Job wurde erfolgreich eingeplant" : "Planung fehlgeschlagen"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
