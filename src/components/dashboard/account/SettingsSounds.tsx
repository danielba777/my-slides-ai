"use client";
import { useEffect, useState } from "react";

type SoundItem = { key: string; name: string; size: number; ufsUrl?: string; url?: string };

export default function SettingsSounds() {
  const [items, setItems] = useState<SoundItem[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const res = await fetch("/api/ugc/sounds", { cache: "no-store" });
    const json = await res.json();
    setItems(json.items ?? []);
  }
  useEffect(() => { load(); }, []);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/ugc/sounds", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      await load();
      setFile(null);
      alert("Sound hochgeladen.");
    } catch (err) {
      alert(String((err as any).message ?? err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleUpload} className="flex items-center gap-3">
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button className="px-3 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-60" disabled={busy || !file}>
          {busy ? "Lädt…" : "Sound hochladen"}
        </button>
      </form>
      <div className="text-sm text-muted-foreground">Ablage: <code>ugc/sounds/…</code></div>
      <div className="grid gap-2">
        {items.map((it) => (
          <div key={it.key} className="rounded-xl border p-3 flex items-center justify-between">
            <div className="truncate">
              <div className="font-medium truncate">{it.name}</div>
              {/* Größe ausgeblendet (KB-Anzeige entfernt) */}
            </div>
            <a href={it.ufsUrl || it.url} target="_blank" rel="noreferrer" className="text-primary text-sm underline">
              Öffnen
            </a>
          </div>
        ))}
        {items.length === 0 && <div className="text-sm opacity-70">Noch keine Sounds hochgeladen.</div>}
      </div>
    </div>
  );
}