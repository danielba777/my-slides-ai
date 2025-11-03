Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/components/marketing/Hero.tsx
@@
return (
<Section className="relative min-h-[85vh] overflow-hidden bg-[#111] py-0">

-      {/* Netflix Background - Fixed z-index hierarchy */}
-      {posterMatrix.length > 0 && (
-        <div className="hero-background-container">
-          {/* Gradient Overlay */}
-          <div className="hero-gradient-overlay" />
-
-          {/* Animated Background */}
-          <div className="hero-perspective-wrapper">
-            <div className="hero-animated-grid">
-              {posterMatrix.map((row, rowIndex) => (
-                <div key={`hero-row-${rowIndex}`} className="hero-image-row">
-                  {row.map((imageUrl, itemIndex) => (
-                <div
-                  key={`hero-row-${rowIndex}-item-${itemIndex}`}
-                  className="hero-image-card" >
-                      {isTikTokCdn(imageUrl) ? (
-                        // Fallback auf <img> für TikTok-CDNs → keine Next-Whitelist nötig
-                        <img
-                          src={imageUrl}
-                          alt=""
-                          loading={rowIndex < 2 ? "eager" : "lazy"}
-                          className="h-full w-full object-cover"
-                          decoding="async"
-                        />
-                      ) : (
-                        <Image
-                          src={imageUrl}
-                          alt=""
-                          fill
-                          /* Nur für die kleinen Kacheln: extrem klein halten */
-                          sizes="125px"
-                          /* Next darf optimieren -> erzeugt AVIF/WebP automatisch */
-                          quality={60}
-                          // Avoid Next.js runtime error: can't set both priority and loading
-                          // Use priority for first 2 rows, lazy for the rest
-                          priority={rowIndex < 2}
-                          loading={rowIndex < 2 ? undefined : "lazy"}
-                          style={{ objectFit: "cover", objectPosition: "center" }}
-                        />
-                      )}
-                       </div>
-                     ))}
-                   </div>
-                 ))}
-                </div>
-              ))}
-            </div>
-          </div>
-        </div>
-      )}

*      {/* Netflix Background - Fixed z-index hierarchy */}
*      {posterMatrix.length > 0 && (
*        <div className="hero-background-container">
*          {/* Gradient Overlay */}
*          <div className="hero-gradient-overlay" />
*
*          {/* Animated Background */}
*          <div className="hero-perspective-wrapper">
*            <div className="hero-animated-grid">
*              {posterMatrix.map((row, rowIndex) => (
*                <div key={`hero-row-${rowIndex}`} className="hero-image-row">
*                  {row.map((imageUrl, itemIndex) => (
*                    <div
*                      key={`hero-row-${rowIndex}-item-${itemIndex}`}
*                      className="hero-image-card"
*                    >
*                      {isTikTokCdn(imageUrl) ? (
*                        // Fallback auf <img> für TikTok-CDNs → keine Next-Whitelist nötig
*                        <img
*                          src={imageUrl}
*                          alt=""
*                          loading={rowIndex < 2 ? "eager" : "lazy"}
*                          className="h-full w-full object-cover"
*                          decoding="async"
*                        />
*                      ) : (
*                        <Image
*                          src={imageUrl}
*                          alt=""
*                          fill
*                          sizes="125px"
*                          quality={60}
*                          // Use priority for first 2 rows, lazy for the rest
*                          priority={rowIndex < 2}
*                          loading={rowIndex < 2 ? undefined : "lazy"}
*                          style={{ objectFit: "cover", objectPosition: "center" }}
*                        />
*                      )}
*                    </div>
*                  ))}
*                </div>
*              ))}
*            </div>
*          </div>
*        </div>
*      )}
  \*\*\* End Patch
