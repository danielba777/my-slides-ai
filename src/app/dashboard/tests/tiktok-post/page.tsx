"use client";

import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface TikTokPostPayload {
  openId: string;
  caption: string;
  mediaUrl: string;
  mediaType: "video" | "photo";
  thumbnailTimestampMs?: number;
  autoAddMusic: boolean;
}

interface ApiResponse {
  success: boolean;
  postId: string;
  releaseUrl: string;
  status: string;
}

export default function TikTokPostingTestPage() {
  const [form, setForm] = useState<TikTokPostPayload>({
    openId: "",
    caption: "",
    mediaUrl: "",
    mediaType: "video",
    thumbnailTimestampMs: 1000,
    autoAddMusic: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = useCallback(<K extends keyof TikTokPostPayload>(key: K, value: TikTokPostPayload[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!form.openId || !form.mediaUrl) {
      toast.error("OpenID und Medien-URL sind Pflichtfelder");
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
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload || typeof payload !== "object") {
        const message =
          payload && typeof payload.error === "string"
            ? payload.error
            : "TikTok Posting fehlgeschlagen";
        setError(message);
        toast.error(message);
        return;
      }

      setResult(payload as ApiResponse);
      toast.success("TikTok Post erfolgreich ausgelöst");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unbekannter Fehler";
      setError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  return (
    <div className="flex flex-col gap-6 p-8">
      <div>
        <h1 className="text-3xl font-semibold">TikTok Posting Test</h1>
        <p className="text-muted-foreground">
          Lade ein Asset über die Pre-Sign-Route hoch und teste danach das direkte Posting zu TikTok.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post konfigurieren</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="openId">TikTok OpenID</Label>
              <Input
                id="openId"
                placeholder="z. B. 94bf305f6eeef301fea2b957"
                value={form.openId}
                onChange={(event) => updateField("openId", event.target.value)}
              />
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
                onChange={(event) =>
                  updateField("mediaType", event.target.value as TikTokPostPayload["mediaType"])
                }
              >
                <option value="video">Video</option>
                <option value="photo">Photo (Carousel)</option>
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
              />
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
              onCheckedChange={(checked) => updateField("autoAddMusic", checked)}
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
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Posting..." : "TikTok Post auslösen"}
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
            <p><span className="font-semibold">Post ID:</span> {result.postId}</p>
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
            <p><span className="font-semibold">Status:</span> {result.status}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
