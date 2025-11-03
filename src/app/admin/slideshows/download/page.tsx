"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminDownloadPage() {
  const [url, setUrl] = useState("");
  const [extractedId, setExtractedId] = useState<string | null>(null);
  const [extractedUsername, setExtractedUsername] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    setErrorMessage(null);
    setResult(null);
    try {
      const parsedUrl = new URL(url.trim());
      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      const possibleId = segments.at(-1) ?? "";
      const numericMatch = possibleId.match(/\d+/);
      const id = numericMatch ? numericMatch[0] : null;

      const usernameSegment = segments.find((segment) => segment.startsWith("@"));
      const username = usernameSegment?.replace(/^@/, "")?.trim() ?? null;

      if (!id) {
        setExtractedId("No ID found");
        setExtractedUsername(username);
        return;
      }

      if (!username) {
        setExtractedId(id);
        setExtractedUsername(null);
        setErrorMessage("Could not extract username from URL");
        return;
      }

      setExtractedId(id);
      setExtractedUsername(username);

      setIsSaving(true);
      const response = await fetch("/api/apify/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ awemeId: id, profileUsername: username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string"
            ? data.error
            : "Failed to trigger Apify run",
        );
      }

      setResult(data);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        error instanceof Error ? error.message : "Invalid URL or request failed",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <div className="flex flex-col gap-2">
        <label
          className="text-sm font-medium text-muted-foreground"
          htmlFor="tiktok-url"
        >
          TikTok URL
        </label>
        <Input
          id="tiktok-url"
          placeholder="https://www.tiktok.com/@username/photo/123456789"
          value={url}
          onChange={(event) => setUrl(event.target.value)}
        />
      </div>
      <div className="flex justify-start">
        <Button onClick={handleSave} disabled={!url.trim() || isSaving}>
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
      {extractedId && (
        <div className="rounded-md border border-muted-foreground/20 bg-muted/20 p-3 text-sm">
          Extracted ID: <span className="font-mono">{extractedId}</span>
        </div>
      )}
      {extractedUsername && (
        <div className="rounded-md border border-muted-foreground/20 bg-muted/20 p-3 text-sm">
          Extracted Username: <span className="font-mono">{extractedUsername}</span>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}
      {result ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Response
          </h3>
          <pre className="max-h-[420px] overflow-auto rounded-md border border-muted-foreground/20 bg-muted/10 p-3 text-xs">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}
