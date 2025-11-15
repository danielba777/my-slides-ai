TikTok-Textstile mit HTML/CSS reproduzieren

Schriften und Grundstil von TikTok-Texten

TikTok verwendet eigene Schriftarten und definierte Stiloptionen für Texte in Videos. Seit 2023 ist TikTok Sans die Hauptschriftart der Plattform und wird für Texteinblendungen (Overlays) und das UI genutzt ￼. Diese Schrift steht als Open-Source-Font zur Verfügung ￼. Historisch wurden jedoch in der TikTok-App verschiedene Font-Stile angeboten, die an bekannte Schriften angelehnt sind ￼. Die gängigsten Textstile (und entsprechende Fonts) sind:
• Classic: Früher Proxima Nova Semibold (heute ersetzt durch TikTok Sans im Classic-Stil). Dieser Font ist ein klarer, gut lesbarer Sans-Serif ￼. Ein freier Ersatz ist z.B. Montserrat Semibold, da er Proxima Nova visuell nahekommt ￼. Classic-Text wird oft mittig oder oben im Video platziert und hat einen markanten abgerundeten Hintergrund (siehe unten) ￼.
• Typewriter: Eine monospace-Schrift mit großzügigem Zeichenabstand ￼. TikTok nutzt hier ein Design ähnlich Courier; als Duplikat wird Source Code Pro Bold empfohlen ￼. Der monospace-Look mit großem Abstand zwischen den Buchstaben verleiht diesem Stil seinen klassischen „Schreibmaschinen“-Charakter ￼. In CSS kann man hierfür font-family: 'Source Code Pro', monospace; font-weight: bold; letter-spacing: 0.05em; nutzen.
• Handwriting: Ein kursiver Handschrift-Stil. TikTok verwendete hierfür eine geschwungene Script-Schrift (ähnlich Kaufmann oder Kaffeesatz); als freie Alternative bietet sich Googles Yesteryear an ￼. Dieser Stil sollte in größerer Schriftgröße eingesetzt werden, da er in klein schwer lesbar ist ￼. Oft wird ein leichter Schatten oder eine Kontur hinzugefügt, um die Lesbarkeit vor unruhigem Hintergrund zu verbessern ￼.
• Serif: Ein klassischer Serifenschrift-Stil (einziger Serif-Font in TikTok). Entspricht ungefähr Georgia Bold ￼. Hier ist es üblich, weißen oder schwarzen Text auf neutralem Hintergrund zu verwenden ￼, um den traditionellen Buchsatz-Look zu erzeugen.
• Neon: Ein markanter, ganz in Großbuchstaben gehaltener Stil mit glühendem Hintergrund wie ein Neon-Leuchtschild ￼. Die Schrift ist geometrisch und abgerundet (TikToks Neon ähnelt Aveny-T; als freie Variante wird Abel genutzt) ￼. Dieser Stil zeichnet sich durch einen leuchtenden Schimmer hinter weißem Text aus ￼. (Im TikTok-Editor wird das erzielt, indem weißer Text dupliziert und die hintere Kopie in Farbe weichgezeichnet wird ￼.)

Größe und Abstand: TikTok gibt keine festen Pixelgrößen vor, aber Texte werden so skaliert, dass sie auf Mobilgeräten gut lesbar sind (häufig 6–10% der Videohöhe als Schriftgröße, etwa 24–60px bei 1080×1920 Videos, je nach Bedeutung). Zeilenabstand wird in der App automatisch gesetzt, meist knapp über 1.0 (damit Hintergrundboxen jede Zeile eng umschließen). Beim Typewriter-Stil sorgt der Monospace-Font schon für gleichmäßigen Abstand; zusätzlich verstärkt ein leichtes letter-spacing den Effekt. Beim Handwriting-Stil empfiehlt es sich, die Schrift deutlich größer zu wählen und evtl. den Zeichenabstand minimal zu erhöhen, um die Lesbarkeit zu verbessern ￼. Generell nutzt TikTok Sans und die Alternativfonts eine mittlere Dicke (Medium/Bold), damit die Untertitel auch auf kleinem Bildschirm klar erkennbar sind ￼.

Text mit farbigem Hintergrund (Highlight-Box)

Eine der auffälligsten TikTok-Textoptionen ist der hervorgehobene Text mit Hintergrundfarbe. Dabei erscheint der Text auf einem farbigen, abgerundeten Rechteck – oft vergleichbar mit einem Textmarker-Effekt. Dieser Stil wird z.B. im Classic-Font häufig verwendet und ist prägendent für den TikTok-Look ￼. Die Hintergrundbox hat runde Ecken und passt sich der Textlänge an. In der TikTok-App kann man diesen Modus aktivieren, indem man beim Text-Editor auf das „A“-Symbol tippt, wodurch verschiedene Darstellungen durchgeschaltet werden (u.a. ohne Hintergrund, mit Hintergrund) ￼.

Farbwahl: TikTok bietet eine Palette vordefinierter Farben für Text und Hintergründe. Wird der Hintergrund aktiviert, verwendet TikTok automatisch einen Kontrast zwischen Text- und Hintergrundfarbe – z.B. weißer Text auf dunklem Hintergrund oder schwarzer Text auf hellem Hintergrund ￼. Wählt man im Editor etwa „Weiß“ und aktiviert das Highlight, erhält man schwarzen Text auf weißem Hintergrund (wie eine weiße Sprechblase) ￼. Bei farbigem Hintergrund (Rot, Gelb usw.) wird typischerweise weißer Text darüber gelegt für maximale Lesbarkeit. Die offiziell verfügbaren Hintergrundfarben umfassen u.a. Schwarz (#000000), Rot (#EA403F), Orange (#FF933D), Gelb (#F2CD46), Lindgrün (#78C25E), Türkis (#77C8A6), Hellblau (#3496F0), Dunkelblau (#3496F0), Violett (#5756D4), Pink (#F7D7E9), Braun (#A3895B), Dunkelgrün (#32523B), Blaugrau (#2F688C), Hellgrau (#92979E) und Dunkelgrau (#333333) ￼ ￼. (Die doppelt aufgeführte Code #3496F0 wird in der App für einen Blauton verwendet, vermutlich war einer davon ursprünglich etwas dunkler.)

Um diesen Stil in HTML/CSS nachzubauen, kann man einen <span> oder <div> um den Text legen und folgendes CSS anwenden:

.highlight-box {
display: inline-block; /_ passt sich Textgröße an _/
background-color: #F2CD46; /_ z.B. TikTok-Gelb als Hintergrund _/
color: #000000; /_ schwarzer Text auf hellem Gelb _/
font-family: 'Montserrat Semibold', sans-serif; /_ oder TikTok Sans Classic _/
font-size: 32px; /_ Beispielgröße – anpassen nach Bedarf _/
line-height: 1.2; /_ enger Zeilenabstand, Box umschließt Text _/
padding: 0.2em 0.4em; /_ horizontaler/vertikaler Puffer in der Box _/
border-radius: 0.3em; /_ abgerundete Ecken für den „Bubble“-Effekt _/
}

Dieser CSS-Code erzeugt etwa den Effekt des klassischen TikTok-Textbanners. Die border-radius kann je nach Geschmack erhöht werden, um noch rundere Pillen-Formen zu erzielen (TikTok nutzt deutlich abgerundete Ecken ￼). Wichtig ist, den Kontrast sicherzustellen: man sollte je nach gewählter Hintergrundfarbe die color (Textfarbe) auf weiß (#FFF) oder schwarz (#000) setzen, um dem TikTok-Stil zu entsprechen ￼. Mehrzeiliger Text sollte in einzelne Zeilen aufgeteilt werden (z.B. jeder Absatz in einem eigenen <div>), da TikTok pro Zeile separate hinterlegte Kästen rendert – so bleibt jede Zeile individuell umrahmt, ohne durchgehende Box über mehrere Zeilen.

Text mit Umrandung (Outline-/Stroke-Stil)

Ein weiterer TikTok-Textstil ist Text mit Kontur (oft auch Stroke genannt). Dabei erhält die Schrift einen farbigen Rand um die Buchstaben. In vielen TikTok-Videos sieht man beispielsweise weiße Schrift mit schwarzer Umrandung, was als Untertitel-Stil sehr beliebt ist (weißer Text mit schwarzer Kontur bietet maximale Lesbarkeit vor jedem Hintergrund). TikTok selbst verwendet Konturen vor allem in speziellen Fällen – z.B. kann man im Handwriting-Stil optional einen feinen Rand hinzufügen, um den weißen Script-Text vom Hintergrund abzuheben ￼. Auch automatische Untertitel und einige Effekte setzen auf weiße Schrift mit dunkler Outline für bessere Lesbarkeit.

In CSS gibt es zwei gängige Methoden, um eine Outline nachzubilden: 1. Mit CSS text-stroke (WebKit): Dieses proprietäre CSS-Attribut zeichnet eine Kontur um die Glyphen ￼. Beispiel: -webkit-text-stroke: 2px black; würde einen 2px schwarzen Rand um den Text legen. Wichtig: Bei Verwendung von text-stroke muss man auch eine Textfarbe definieren (per color oder -webkit-text-fill-color), da sonst der Fülltext transparent sein kann ￼. Browser-Unterstützung besteht in Chrome, Safari, Edge (WebKit/Chromium-basierte), jedoch nicht in Firefox ￼. 2. Mit mehrfachen Textschatten: Durch Kombination mehrerer text-shadow-Deklarationen kann man eine Pseudo-Kontur erzeugen, indem man Schatten in alle Richtungen ohne Unschärfe zeichnet. Beispielsweise vier Schatten für oben, unten, links, rechts um 1px versetzt. Diese Methode ist universell browserkompatibel.

Nachfolgend ein CSS-Beispiel für weiße Schrift mit schwarzer Outline im TikTok-Stil unter Nutzung beider Techniken (Stroke und Fallback via Shadow):

.outline-text {
font-family: 'TikTok Sans', sans-serif; /_ oder Proxima/Montserrat Semibold _/
font-size: 28px;
color: #FFFFFF; /_ weiße Schriftfüllung _/
/_ Primäre Methode: WebKit Text Stroke _/
-webkit-text-stroke: 2px #000000; /_ 2px schwarze Kontur _/
-webkit-text-fill-color: #FFFFFF; /_ weiße Füllfarbe, überschreibt color falls nötig _/
/_ Fallback Methode: Mehrfacher Textschatten für Kontur _/
text-shadow:
2px 0 0 #000,
-2px 0 0 #000,
0 2px 0 #000,
0 -2px 0 #000,
1.4px 1.4px 0 #000, /_ diagonale Schatten für Ecken _/
-1.4px 1.4px 0 #000,
1.4px -1.4px 0 #000,
-1.4px -1.4px 0 #000;
}

In diesem Code sorgt -webkit-text-stroke für eine saubere Kontur ￼. Die zusätzlichen text-shadow-Angaben stellen sicher, dass auch Browser ohne text-stroke den Text mit schwarzem Rand anzeigen (hier wurden acht Schatten verwendet – vier orthogonal, vier diagonal – um einen annähernd 2px breiten gleichmäßigen Rand zu erzeugen). Dieses Prinzip kann man für andere Farbkombinationen analog anwenden (z.B. schwarze Schrift mit weißer Outline, indem man color: #000 und die Outline-Farbe auf weiß setzt). TikTok selbst verwendet meist schwarz/weiß als Outline-Kombination für maximale Kontrastwirkung.

Text mit Schatteneffekten (Neon-Glow und Schlagschatten)

TikToks Editor bietet auch Textstile mit Schatten und Leuchteffekten. Ein bekanntes Beispiel ist der Neon-Textstil, bei dem weißer Text vor einem farbigen, verschwommenen Glow erscheint ￼. Dieser Glow wirkt wie ein leuchtender Schatten und lässt den Text hervorstechen. Ein anderer Anwendungsfall sind einfache Schlagschatten für bessere Lesbarkeit – z.B. ein leichter schwarzer Schatten hinter heller Schrift (TikTok verwendet solche dezenten Schatten z.B. automatisch für Untertitel oder bei hellen Schriftfarben auf hellem Hintergrund).

Neon-Glow nachbauen: Im TikTok-Neonstil wird der Effekt erzielt, indem der Text zweimal übereinander gelegt wird: die obere Ebene in Weiß, die darunterliegende in der Neonfarbe und mit Unschärfe ￼. In reinem CSS kann man einen ähnlichen Effekt mit text-shadow erzielen. Durch einen unscharfen (blurred) Schatten in kräftiger Farbe entsteht ein Leuchten. Beispiel für weißen Text mit neon-pinkem Schein:

.neon-text {
font-family: 'Abel', sans-serif; /_ z.B. Abel als Neon-Ersatzfont _/
font-size: 36px;
text-transform: uppercase; /_ Neon-Stil ist in TikTok immer Versalien _/
color: #FFFFFF; /_ Weißer Vordergrundtext _/
text-shadow:
0 0 8px #ff2ecc, /_ weicher pinkfarbener Schein _/
0 0 16px #ff2ecc,
0 0 24px #ff2ecc;
}

Hier erzeugen drei text-shadow-Layer mit steigender Unschärfe einen neonartigen Glow. Der Schatten wird ohne Versatz (0 0) und nur mit Blur-Radius gezeichnet – im obigen Beispiel 8px, 16px, 24px – was zu einem diffusen, leuchtenden Rand führt. Man kann die Intensität über die Farbwerte und Blur-Radien anpassen. (TikTok setzt intern etwa einen Blur-Wert von ~0.6 auf die hintere Textebene ein ￼, was einem weichen Schein entspricht.) Alternativ kann man für noch kräftigeren Neon-Look die farbige Textebene duplizieren und mittels CSS-Filter filter: blur(4px) unscharf machen, dann via position:absolute hinter den weißen Text legen – dieser zweischichtige Ansatz entspricht genau dem TikTok-Vorgehen ￼, erfordert aber zwei HTML-Elemente.

Schlagschatten: Für andere Schriftstile (z.B. Handwriting oder Serif) ist ein klassischer Schlagschatten nützlich. Ein einfacher einzeiliger CSS-Textshadow kann genügen, z.B.:

.shadow-text {
color: #FFFFFF;
text-shadow: 2px 2px 4px rgba(0,0,0,0.7);
}

Dies würde weißen Text mit einem leicht nach rechts-unten versetzten, weichgezeichneten dunklen Schatten anzeigen – subtil genug, um die Lesbarkeit zu erhöhen, ohne wie ein Neon-Effekt auszusehen. TikTok empfiehlt selbst, bei verschnörkelten oder hellen Schriften dezente Schatten oder Konturen einzusetzen, damit die Schrift sich vom Hintergrund abhebt ￼. Der Schatten sollte dabei in neutralen Farben (schwarz oder eine zum Hintergrund kontrastierende Farbe) und moderater Transparenz gehalten sein, um professionell zu wirken.

Einbettung der Texte als Overlay im Web

Um TikTok-Textstile eins zu eins im Web nachzustellen, muss man nicht nur die reinen CSS-Stile anwenden, sondern auch die Texte ähnlich positionieren wie in der TikTok-App. In TikTok-Videos werden Texte als Overlays auf dem Video gerendert ￼ – das bedeutet, sie liegen über dem Videobild und nicht darin eingebrannt. Im Web erreicht man dies, indem man den Video-Container relativ positioniert und Texte darin absolut positioniert. Beispiel:

<div class="video-container" style="position: relative;">
  <video src="video.mp4" width="360" height="640" ...></video>
  <div class="tiktok-caption" style="
       position: absolute; 
       left: 50%; bottom: 15%; 
       transform: translateX(-50%);">
    <span class="highlight-box">Folge mir für mehr Tipps!</span>
  </div>
</div>

Im obigen Snippet wird ein Textoverlay zentriert am unteren Rand des Videos platziert (15% über dem Bottom, z.B. für Untertitel). In TikTok gelten Safe-Zone-Richtlinien, um sicherzustellen, dass Text nicht von UI-Elementen verdeckt wird. Man sollte wichtige Texte nicht zu nah an den Rand setzen: Bei einem 1080×1920-Video empfiehlt TikTok ca. 130px Abstand vom oberen Rand (oben erscheinen Username/Profilbild), 250px vom unteren Rand (unten liegen Beschriftung, Buttons) und etwa 60px seitlich frei zu lassen ￼. In Prozent sind das rund 12% oben, 23% unten und ~5.5% seitlich als Puffer. Dieses „Safe Zone“-Prinzip garantiert, dass die Texte wie in der App frei sichtbar sind und nicht durch Bedienelemente oder Zuschnitt verloren gehen ￼.

Schließlich sollte man darauf achten, dass die Z-Reihenfolge stimmt – d.h. das Textelement muss im Vordergrund bleiben (z-index > Video) – und dass auf mobilen Geräten die Schrift ausreichend groß skaliert. Mit den obigen CSS-Beispielen und Hinweisen zu Farbe, Font und Position lassen sich die TikTok-Textstile sehr realistisch in HTML/CSS nachbauen. Wichtig ist, dieselben Farben und Schriftarten/Gewichte zu verwenden, da diese den Wiedererkennungswert ausmachen ￼ ￼. Mit Montserrat/Monospace/Yesteryear oder dem offiziellen TikTok Sans Font und den gezeigten CSS-Effekten (Hinterlegter Kasten, Outline, Schatten) erreicht man praktisch eine 1:1-Kopie der TikTok-Videotext-Optik im Web.

Quellen: TikTok/CapCut-Community-Diskussionen, TikTok Entwickler-Blog & Dokumentation, sowie Analysen von Kapwing und anderen, die TikTok-Textstile nachstellen ￼ ￼ ￼ ￼ ￼ ￼. Diese Informationen und CSS-Beispiele ermöglichen es, die TikTok-Textoptionen (Highlight-Box, Outline-Text, Neon-Shadow etc.) originalgetreu im Web umzusetzen.
