Bitte ändere nur die diffs, so wie ich sie dir unten hinschreibe. Ändere sonst nichts mehr und fasse keine anderen Dateien oder Codestellen an. Bitte strikt nach meinem diff File gehen:

*** Begin Patch
*** Update File: src/server/ugc/video-composer.ts
@@
-      // Positionierung: upper ≈ 18% von oben, middle = Vertikalmitte
-      const yExpr =
-        overlayPosition === "middle"
-          ? "(h-text_h)/2"
-          : "max( (h*0.18) - (text_h/2), 20 )";
-      // drawtext benötigt Escapes für \ : ' %
-      const escapeDrawtext = (s: string) =>
-        s
-          .replace(/\\/g, "\\\\")
-          .replace(/:/g, "\\:")
-          .replace(/'/g, "\\'")
-          .replace(/%/g, "\\%");
-      const text = escapeDrawtext(overlayText);
-      // Korrekt: fontArg anhängen (nicht ".fontArg")
-      const draw = [
-        `drawtext=text='${text}'`,
-        fontArg.join(""),
-        ":fontsize=54",
-        ":fontcolor=white",
-        ":x=(w-text_w)/2",
-        `:y=${yExpr}`,
-        ":borderw=3:bordercolor=black",
-        ":shadowx=2:shadowy=2:shadowcolor=black@0.65",
-      ].join("");
-      console.debug("[UGC][ffmpeg] using -vf:", draw);
+      // Positionierung: upper ≈ 18% von oben, middle = Vertikalmitte
+      const yExprRaw =
+        overlayPosition === "middle"
+          ? "(h-text_h)/2"
+          : "max((h*0.18)-(text_h/2),20)"; // ohne Leerzeichen
+      // In älteren FFmpeg-Builds müssen Kommas in Ausdrücken geescaped werden
+      const yExprEsc = yExprRaw.replace(/,/g, "\\,");
+
+      // drawtext benötigt Escapes für \ : ' %
+      const escapeDrawtext = (s: string) =>
+        s
+          .replace(/\\/g, "\\\\")
+          .replace(/:/g, "\\:")
+          .replace(/'/g, "\\'")
+          .replace(/%/g, "\\%");
+      const text = escapeDrawtext(overlayText);
+      // Korrekt: fontArg anhängen (nicht ".fontArg")
+      const draw = [
+        `drawtext=text='${text}'`,
+        fontArg.join(""),
+        ":fontsize=54",
+        ":fontcolor=white",
+        ":x=(w-text_w)/2",
+        `:y=${yExprEsc}`,
+        ":borderw=3:bordercolor=black",
+        ":shadowx=2:shadowy=2:shadowcolor=black@0.65",
+      ].join("");
+      console.debug("[UGC][ffmpeg] using -vf:", draw);
*** End Patch
