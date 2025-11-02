Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/components/marketing/Hero.tsx
@@
<Image
src={imageUrl}
alt=""
fill
/_ Nur für die kleinen Kacheln: extrem klein halten _/
sizes="125px"
/_ Next darf optimieren -> erzeugt AVIF/WebP automatisch _/

-                        quality={30}
-                        loading="lazy"

*                        quality={30}
*                        // Avoid Next.js runtime error: can't set both priority and loading
*                        // Use priority for first 2 rows, lazy for the rest
*                        priority={rowIndex < 2}
*                        loading={rowIndex < 2 ? undefined : "lazy"}
                         style={{ objectFit: "cover", objectPosition: "center" }}

-                        priority={rowIndex < 2}
                         />
  \*\*\* End Patch
