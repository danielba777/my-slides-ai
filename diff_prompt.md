Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/components/tiktok/TikTokPostForm.tsx
@@

<div className="space-y-2">
<Label htmlFor="caption">Caption</Label>
<Textarea
id="caption"
placeholder="Write the TikTok caption…"
value={form.caption}
onChange={(event) => updateField("caption", event.target.value)}

-            rows={10}
-            className="bg-white"

*            rows={10}
*            className="bg-white"
           />
         </div>

*        {/** Selected images preview (under prompt) — unified cropped cards */}
*        {form.photoImages?.length > 0 && (
*          <div className="space-y-2">
*            <Label>Selected images</Label>
*            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
*              {form.photoImages.map((url, idx) => (
*                <div
*                  key={`${url}-${idx}`}
*                  className="aspect-[2/3] w-full overflow-hidden rounded-2xl border bg-muted"
*                  aria-label={`Selected image ${idx + 1}`}
*                >
*                  {/** biome-ignore lint/performance/noImgElement: display utility */}
*                  <img
*                    src={url}
*                    alt={`Selected ${idx + 1}`}
*                    className="h-full w-full object-cover"
*                    draggable={false}
*                  />
*                </div>
*              ))}
*            </div>
*          </div>
*        )}
*          {error && <p className="text-sm text-destructive">{error}</p>}
  \*\*\* End Patch
