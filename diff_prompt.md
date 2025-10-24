Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/app/admin/slideshow-library/posts/new/page.tsx
@@

-          publishedAt: new Date(formData.publishedAt),
-          createdAt: new Date(formData.createdAt),

*          publishedAt: formData?.publishedAt ? new Date(formData.publishedAt) : undefined,
*          createdAt: formData?.createdAt ? new Date(formData.createdAt) : undefined,
  \*\*\* End Patch
