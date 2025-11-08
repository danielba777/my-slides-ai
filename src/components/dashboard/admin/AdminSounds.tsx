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
      const res = await fetch("/api/admin/ugc/sounds", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      await load();
      setSound(null);
      setCover(null);
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
      alert(String((err as any).message ?? err));
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
                  className="h-10 w-10 rounded-xl object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-xl bg-muted" />
              )}
              <div className="min-w-0">
                <div className="font-medium truncate">{it.name}</div>
                <div className="text-xs text-muted-foreground">
                  {(it.size / 1024).toFixed(1)} KB
                </div>
              </div>
            </div>
            <a
              href={it.ufsUrl || it.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline"
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
