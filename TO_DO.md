1. Zielsetzung

Vor dem Posten (Foto- oder Slideshow-Inhalt) deiner App muss sichergestellt werden, dass du die aktuellen Informationen des TikTok-Creators abrufst und in der UI anzeigst. Damit gewährleistest du, dass der Nutzer weiß, über welches Konto gepostet wird und welche Sichtbarkeits-/Interaktions-Optionen zur Verfügung stehen. (Quelle: Content Posting API „Query Creator Info“). ￼

⸻

2. API-Endpunkt & Authentifizierung

Endpoint

POST https://open.tiktokapis.com/v2/post/publish/creator_info/query/

Anforderungen
• HTTP Methode: POST ￼
• Header:
• Authorization: Bearer {access_token} — der Access Token des TikTok-Nutzers, der deine App autorisiert hat. ￼
• Content-Type: application/json; charset=UTF-8 ￼
• Body: leer JSON Objekt {} (keine Pflichtfelder) — oft reicht ein leeres Body laut Dokumentation. ￼

Rate Limit
• Jede Nutzerzugriffstoken-Kombination ist auf 20 Anfragen pro Minute begrenzt. ￼

⸻

3. Antwortstruktur (Response)

Beispiel aus der Dokumentation: ￼

{
"data": {
"creator_avatar_url": "https://lf16-tt4d.tiktokcdn.com/obj/.../avatar.jpg",
"creator_username": "tiktok",
"creator_nickname": "TikTok Official",
"privacy_level_options": ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"],
"comment_disabled": false,
"duet_disabled": false,
"stitch_disabled": true,
"max_video_post_duration_sec": 300
},
"error": {
"code": "ok",
"message": "",
"log_id": "202210112248442CB9319E1FB30C1073F3"
}
}

Wichtige Felder
• creator_avatar_url → URL zum Avatar des Creators.
• creator_username → eindeutiger Nutzername (z. B. „@user“)
• creator_nickname → Anzeigename.
• privacy_level_options → Liste der Sichtbarkeitsoptionen, die dem Nutzer zur Verfügung stehen.
• comment_disabled → true, wenn Kommentare deaktiviert sind.
• duet_disabled, stitch_disabled → ob Duet bzw. Stitch deaktiviert sind.
• max_video_post_duration_sec → maximale erlaubte Videolänge für diesen Creator (nur relevant für Video-Posts)

⸻

4. UI-Implementierungsschritte

4.1 Zeitpunkt des Abrufs
• Beim Rendern der „Post to TikTok“-Seite (also bevor der Nutzer auf „Posten“ klickt) solltest du diesen API-Call ausführen. (Siehe Required UX § 1a) ￼

4.2 Anzeige des Creators
• Zeige dem Nutzer deutlich an:
• Avatar (creator_avatar_url)
• Nickname (creator_nickname) oder Nutzername (creator_username)
Damit ist klar, über welches Konto gepostet wird.

4.3 Sichtbarkeits-/Interaktions-Optionen
• Zeige eine Auswahl (Dropdown, Radio Buttons) basierend auf privacy_level_options.
• Wenn comment_disabled === true, deaktiviere bzw. verstecke Kommentare-Toggle.
• Wenn duet_disabled === true oder stitch_disabled === true, deaktiviere die entsprechenden Toggles (für Foto/Slideshow ggf. nicht relevant).

4.4 Einschränkungen beachten
• Wenn max_video_post_duration_sec vorhanden und dein Inhalt länger ist → blockiere oder warne den Nutzer (z. B. Slider oder Fehlermeldung) und verhindere das Posten. (Für Foto/Slideshow irrelevant, aber implementiere generisch) ￼
• Wenn die API-Antwort ein Fehlerfeld zeigt mit z. B. spam_risk_too_many_posts oder user_banned_from_posting → unterbinde den Post-Flow und zeige eine Benachrichtigung („You currently cannot post via this account, try later“). ￼

⸻

5. Fehler-Handling & Fallstricke
   • Wenn HTTP Status ≠ 200 oder error.code ≠ "ok" → handle entsprechend. Z. B.:
   • access_token_invalid → forciere erneute Authentifizierung.
   • scope_not_authorized → informiere Nutzer, dass deine App nicht die nötigen Scopes hat.
   • rate_limit_exceeded → zeige „Please wait and try again later.“
   • Stelle sicher, dass deine UI nicht vorschnell weitermacht, bevor dieser Call abgeschlossen ist (z. B. disable „Posten“-Button bis Daten geladen sind).

⸻

6. Beispiel-Code (Pseudo-TypeScript)

async function fetchCreatorInfo(accessToken: string): Promise<CreatorInfo> {
const res = await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", {
method: "POST",
headers: {
"Authorization": `Bearer ${accessToken}`,
"Content-Type": "application/json; charset=UTF-8"
},
body: JSON.stringify({}) // empty body
});
const json = await res.json();
if (json.error?.code !== "ok") {
throw new Error(`TikTok error: ${json.error.code} – ${json.error.message}`);
}
return json.data as CreatorInfo;
}

// In React component:
const [creatorInfo, setCreatorInfo] = useState<CreatorInfo | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
fetchCreatorInfo(userAccessToken)
.then(info => {
setCreatorInfo(info);
setLoading(false);
})
.catch(err => {
console.error("Error fetching creator info", err);
setLoading(false);
// show UI message
});
}, [userAccessToken]);

// In render():
if (loading) return <Spinner />;
if (creatorInfo == null) return <div>Error loading account info</div>;

return (

  <div className="creator-info">
    <img src={creatorInfo.creator_avatar_url} alt="Creator Avatar" />
    <span>{creatorInfo.creator_nickname}</span>
    <select name="privacyLevel">
      {creatorInfo.privacy_level_options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
    {creatorInfo.comment_disabled && <div>Comments are disabled for this account.</div>}
    {/* Enable/disable duet/stitch toggles based on flags */}
  </div>
);

⸻

7. Integration in deinen Workflow
   • Rufe fetchCreatorInfo auf vor dem Nutzer zulässt Inhalte zu posten.
   • Speichere creatorInfo in deinem Formular-State (z. B. React State -> presentationState etc.).
   • Nutze creatorInfo.privacy_level_options als Optionen für den Privacy-Dropdown in deinem UI.
   • Deaktiviere oder verstecke Interaktions-Optionen (Kommentare, Duet, Stitch) je nach creatorInfo.
   • Wenn Fehler oder Einschränkungen erkannt werden → zeige Nutzer-Feedback und blockiere den Post-Flow.
