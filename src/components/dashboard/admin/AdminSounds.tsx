"use client";
import { useEffect, useState } from "react";

type SoundItem = {
  key: string;
  name: string;
  size: number;
  ufsUrl?: string;
  url?: string;
  coverUrl?: string | null;
};

export default function AdminSounds() {
  const [items, setItems] = useState<SoundItem[]>([]);
  const [sound, setSound] = useState<File | null>(null);
  const [cover, setCover] = useState<File | null>(null);
  const [displayName, setDisplayName] = useState<string>("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/ugc/sounds", { cache: "no-store" });
    const json = await res.json();
    setItems(json.items ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!sound) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("sound", sound);
      if (cover) fd.append("cover", cover);
      if (displayName.trim()) fd.append("name", displayName.trim());
      const res = await fetch("/api/admin/ugc/sounds", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        let detail = "";
        try { const j = await res.json(); detail = j?.upstreamBodySnippet || j?.detail || j?.error || ""; } catch {}
        throw new Error(`Upload failed (${res.status}) ${detail}`.trim());
      }
      const data = await res.json().catch(() => ({}));
      await load();
      setSound(null);
      setCover(null);
      setDisplayName("");
      (document.getElementById("sound-input") as HTMLInputElement | null)
        ?.value &&
        ((document.getElementById("sound-input") as HTMLInputElement).value =
          "");
      (document.getElementById("cover-input") as HTMLInputElement | null)
        ?.value &&
        ((document.getElementById("cover-input") as HTMLInputElement).value =
          "");
      alert("Sound (und ggf. Cover) hochgeladen.");
    } catch (err) {
      console.error("[AdminSounds] Upload error:", err);
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Sounds</h2>
      </div>

      <form
        onSubmit={handleUpload}
        className="grid gap-3 md:grid-cols-[1fr_auto] items-end"
      >
        <div className="grid gap-2">
          <label className="text-sm font-medium">Name (Anzeige im Auswahl-Pop-up)</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="z. B. Chill Vibes 120bpm"
            className="h-10 rounded-lg border px-3"
          />
          <label className="text-sm font-medium">Audio-Datei</label>
          <input
            id="sound-input"
            type="file"
            accept="audio/*"
            onChange={(e) => setSound(e.target.files?.[0] ?? null)}
          />
          <label className="text-sm font-medium mt-3">
            Cover-Bild (optional)
          </label>
          <input
            id="cover-input"
            type="file"
            accept="image/*"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          />
        </div>
        <button
          className="h-10 px-4 rounded-xl bg-primary text-primary-foreground disabled:opacity-60"
          disabled={busy || !sound}
        >
          {busy ? "Lädt…" : "Hochladen"}
        </button>
      </form>

      <div className="grid gap-3">
        {items.map((it) => (
          <div
            key={it.key}
            className="flex items-center justify-between rounded-2xl border p-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              {it.coverUrl ? (
                <img
                  src={it.coverUrl}
                  alt=""
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-lg bg-muted" />
              )}
              <div className="min-w-0">
                <div className="font-medium truncate">{it.name}</div>
                {/* Größe ausgeblendet (KB-Anzeige entfernt) */}
              </div>
            </div>
            <a
              href={it.ufsUrl || it.url}
              target="_blank"
              rel="noreferrer"
              className="text-primary text-sm underline"
            >
              Öffnen
            </a>
          </div>
        ))}
        {items.length === 0 && (
          <div className="text-sm opacity-70">
            Noch keine Sounds hochgeladen.
          </div>
        )}
      </div>
    </div>
  );
}
