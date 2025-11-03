Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

_ Begin Patch
_ Update File: src/components/marketing/Hero.tsx

@@
.hero-content-wrapper {
position: relative;
/_ Navbar has z-50 — set hero below it to avoid overlapping while scrolling _/
z-index: 20;
/_ Create new stacking context isolated from background _/
isolation: isolate;
/_ Promote to own layer _/
will-change: transform;
transform: translateZ(0);
min-height: 89vh;
display: flex;
flex-direction: column;
justify-content: center;
padding: 5rem 1.25rem 2.5rem;
}

-        /* Ensure the small KPI badge ("10M+ views … 2025") always sits a bit UNDER the fixed navbar,
-           regardless of screen size – and neutralize any negative Tailwind margins on that element. */
-        .hero-content-wrapper > .max-w-5xl > :first-child {
-          /* Fallback nav height ~64px; add a little breathing room */
-          margin-top: calc(var(--nav-height, 4rem) + 0.5rem) !important;
-        }

         @media (min-width: 640px) {
           .hero-content-wrapper {
             padding: 5rem 1.5rem 2.5rem;
           }

-          .hero-content-wrapper > .max-w-5xl > :first-child {
-            /* Slightly taller nav on many setups + a bit more gap */
-            margin-top: calc(var(--nav-height, 4.25rem) + 0.75rem) !important;
-          }
         }

         @media (min-width: 1024px) {
           .hero-content-wrapper {
             padding-top: 5rem;
           }

-          .hero-content-wrapper > .max-w-5xl > :first-child {
-            /* Desktop navs are often ~72px–80px; keep a pleasant offset */
-            margin-top: calc(var(--nav-height, 4.5rem) + 1rem) !important;
-          }
         }

\_ End Patch
