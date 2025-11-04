Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

--- src/app/dashboard/ugc/page.tsx
+++ src/app/dashboard/ugc/page.tsx
@@ -255,9 +255,9 @@
} catch (error) {
console.error("[UGC] handleSchedule failed", error);

-      toast.error(
-        error instanceof Error ? error.message : "Scheduling...
-      );

*      toast.error(
*        error instanceof Error ? error.message : "Scheduling failed"
*      );
       } finally {
         setScheduleSubmitting(false);
       }
  @@ -286,7 +286,7 @@
  <Textarea
  value={hook}
  onChange={(event) => setHook(event.target.value)}

-                placeholder="z. B. \"In 5 Sekunden zeige ich dir, wie ich 3x mehr Leads erziele\""

*                placeholder={'z. B. "In 5 Sekunden zeige ich dir, wie ich 3x mehr Leads erziele"'}
                 rows={4}
               />
             </CardContent>
