Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

**_ Begin Patch
_** Update File: src/components/marketing/Hero.tsx
@@
return (

- <Section className="relative min-h-[92vh] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 overflow-hidden">
-      {/* Background decorations (wrapper to keep JSX balanced) */}
-      <div className="pointer-events-none absolute inset-0 -z-10">
-        <div
-          className="absolute inset-0 opacity-30 bg-repeat"
-          style={{
-            backgroundImage: `url("data:image/svg+xml,%3Csvg%20width='80'%20height='80'%20viewBox='0%200%2080%2080'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cg%20fill='%23304674'%20fill-opacity='0.05'%3E%3Cpath%20d='M40%200h40v40H40z'/%3E%3Cpath%20d='M0%2040h40v40H0z'/%3E%3C/g%3E%3C/svg%3E")`,
-          }}
-        />
-        {/* Minimalistische, einfarbige Akzent-Glow statt bunter Blobs */}
-        <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#304674]/15 blur-3xl" />
-      </div>

* <Section className="relative min-h-[92vh] overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900">
*      {/* Background decorations */}
*      <div className="pointer-events-none absolute inset-0 -z-10">
*        <div
*          className="absolute inset-0 opacity-30 bg-repeat"
*          style={{
*            backgroundImage:
*              `url("data:image/svg+xml,%3Csvg%20width='80'%20height='80'%20viewBox='0%200%2080%2080'%20xmlns='http://www.w3.org/2000/svg'%3E%3Cg%20fill='%23304674'%20fill-opacity='0.05'%3E%3Cpath%20d='M40%200h40v40H40z'/%3E%3Cpath%20d='M0%2040h40v40H0z'/%3E%3C/g%3E%3C/svg%3E")`,
*          }}
*        />
*        <div
*          className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
*          style={{ backgroundColor: "rgba(48,70,116,0.15)" }}
*        />
*      </div>
  @@

-      <div className="relative z-10 flex min-h-[92vh] flex-col justify-center px-5 sm:px-6 pt-4 sm:pt-6 pb-10">

*      <div className="relative z-10 flex min-h-[92vh] flex-col justify-center px-5 sm:px-6 pt-4 sm:pt-6 pb-10">
  \*\*\* End Patch
