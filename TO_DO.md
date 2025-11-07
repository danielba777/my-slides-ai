2. Metadaten-Eingabe durch den Nutzer

Ziel

Bevor Inhalte aus deiner App zu TikTok gepostet werden, muss der Nutzer in deiner App die relevanten Metadaten eingeben und/oder bestätigen, damit die Anforderungen von TikTok erfüllt sind. Deine App zeigt UI-Elemente, die folgende Informationen und Optionen abdecken: 1. Caption/Title (Beschreibung) des Posts 2. Privacy/Visibility Level (Wer darf den Post sehen) 3. Interaktions-Optionen (Kommentare, Duet, Stitch) 4. Kommerzielle Inhalte Offenlegung („Branded Content“, „Your Brand“)

Diese Metadaten müssen korrekt sein, bevor du den Post-Request an TikTok sendest. (Quelle: Richtlinien „Required UX Implementation: step 2“) ￼

⸻

Umsetzungsschritte

1. UI Layout & Eingabefelder
   • Ein Formular (z. B. React-Komponente) mit folgenden Feldern:
   • Caption / Title: Textfeld (optional oder Pflicht je nach Inhaltstyp)
   • Privacy Level: Dropdown oder Radio-Buttons mit Optionen, die dynamisch aus der creator_info.privacy_level_options geladen wurden.
   • Comment Allowed: Checkbox oder Toggle – falls comment_disabled == true, muss sie deaktiviert und ausgegraut sein.
   • Duet Allowed: Checkbox oder Toggle – falls duet_disabled == true, deaktivieren.
   • Stitch Allowed: Checkbox oder Toggle – falls stitch_disabled == true, deaktivieren.
   • Ein Abschnitt für Commercial / Branded Content Disclosure:
   • Toggle: „This post includes commercial content / brand promotion“.
   • Wenn aktiv: Auswahlkästchen „My Brand“ und „Branded Content (third-party)“.
   • Hinweistext: z. B. „By posting, you agree to TikTok’s Branded Content Policy and Music Usage Confirmation.“ (wenn „Branded Content“ gewählt) ￼

2. Datenbindung & Validierung
   • Caption/Text darf bearbeitet werden – kein vordefinierter Text, keine fixe Hashtags, unless der Nutzer sie selbst eingibt. (Wasserzeichen/Logos untersagt) ￼
   • Privacy Level muss einer der zurückgegebenen Optionen von creator_info sein – sonst Fehler beim TikTok API Call. ￼
   • Wenn „Branded Content“ aktiv ist und Privacy Level = SELF_ONLY (nur ich): Entweder deaktivieren „SELF_ONLY“, oder automatischer Wechsel auf PUBLIC_TO_EVERYONE (mit Hinweis). ￼
   • Wenn Kommentar/Duet/Stitch deaktiviert in creator_info, dann UI-Element deaktivieren und optional Tooltip: „Feature disabled for this account“.

3. Benutzerfluss
   1. Nutzer wählt Inhalte (Slideshow/Foto) zur Veröffentlichung.
   2. App ruft creator_info ab (siehe Schritt 1).
   3. App zeigt Metadaten-Formular mit voreingestellten Permissi­onen basierend auf creator_info.
   4. Nutzer bearbeitet Caption, wählt Privacy Level, setzt ggf. Commercial Toggle.
   5. App validiert Eingaben (z. B. Caption Länge, Privacy Option gültig, wenn „Branded Content“ -> Privacy ≠ SELF_ONLY).
   6. Nutzer klickt „Submit/Post“ → App sendet Request an TikTok API.
   7. App zeigt Erfolgs- oder Fehlermeldung.

4. Speicherung & Weiterleitung
   • Lokale Zwischenspeicherung der Eingaben erlaubt (z. B. wenn Nutzer später zurückkommt).
   • Keine permanente Speicherung von Metadaten ohne Nutzerzustimmung – Transparenz über Datenverwendung.
   • Beim Posten: die Metadaten (title, privacy_level, disable_comment, etc.) müssen in der API-Anfrage korrekt übergeben werden. Beispiel aus API-Guide: ￼

{
"post_info": {
"title": "Your caption here",
"privacy_level": "PUBLIC_TO_EVERYONE",
"disable_duet": false,
"disable_comment": true
}
}

5. Fehlermeldungen & User-Feedback
   • Wenn Nutzer eine ungültige Privacy Option wählt => sofort Feedback („Please select a valid visibility from the options for your account.“)
   • Wenn „Branded Content“ gewählt wird, aber Sichtbarkeit auf SELF_ONLY steht => Hinweis: „Branded content cannot be private; visibility will be set to Public.“
   • Während Metadaten geladen werden (nach creator_info), „Loading…” Spinner anzeigen.
   • Wenn API Call nach Metadaten/Creator Info fehlschlägt => „Unable to load account info. Please try again later.“
   • Nach erfolgreichem Posten: „Your content was submitted. It may take a few minutes to appear on TikTok.“ (gemäß UX-Richtlinie) ￼

⸻

Schnittstelle zu deinem System
• Komponenten-Props/State:

interface MetadataInputs {
title: string;
privacyLevel: string;
disableComment: boolean;
disableDuet: boolean;
disableStitch: boolean;
isBrandedContent: boolean;
brandOption: "MY_BRAND" | "THIRD_PARTY" | null;
}

    •	API Aufruf zur Post-Initialisierung nach Metadaten:

await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
method: "POST",
headers: {
"Authorization": `Bearer ${accessToken}`,
"Content-Type": "application/json; charset=UTF-8"
},
body: JSON.stringify({
post_info: {
title: metadata.title,
privacy_level: metadata.privacyLevel,
disable_comment: metadata.disableComment,
disable_duet: metadata.disableDuet,
disable_stitch: metadata.disableStitch,
brand_content_toggle: metadata.isBrandedContent,
brand_organic_toggle: metadata.brandOption === "MY_BRAND"
},
// weitere Felder je nach Medientyp …
})
});
