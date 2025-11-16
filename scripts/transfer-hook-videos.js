const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:3001'; // Ihre API URL anpassen
const LOCAL_HOOKS_DIR = path.join(process.cwd(), 'public', 'ugc', 'reaction-hooks');

async function uploadVideoToServer(filePath, fileName) {
  try {
    // 1. Presigned URL von der API holen
    const presignResponse = await fetch(`${API_BASE_URL}/files/presign?key=ugc/reaction-hooks/${fileName}&contentType=video/mp4`);
    const presignData = await presignResponse.json();

    if (!presignData.uploadUrl) {
      throw new Error('Keine Upload-URL erhalten');
    }

    // 2. Video-Datei lesen
    const videoBuffer = fs.readFileSync(filePath);

    // 3. Video hochladen
    const uploadResponse = await fetch(presignData.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
      },
      body: videoBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status}`);
    }

    console.log(`✅ ${fileName} erfolgreich hochgeladen`);
    return presignData.publicUrl;

  } catch (error) {
    console.error(`❌ Fehler bei ${fileName}:`, error.message);
    return null;
  }
}

async function updateVideoUrlInDatabase(avatarId, newVideoUrl) {
  try {
    // Update über die Next.js API
    const response = await fetch(`http://localhost:3000/api/ugc/reaction-avatars/${avatarId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: newVideoUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Database update failed: ${response.status}`);
    }

    console.log(`✅ Avatar ${avatarId} URL aktualisiert`);
    return true;

  } catch (error) {
    console.error(`❌ Fehler beim Aktualisieren von Avatar ${avatarId}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starte Transfer der Hook Videos...\n');

  // 1. Prüfen ob das lokale Verzeichnis existiert
  if (!fs.existsSync(LOCAL_HOOKS_DIR)) {
    console.error('❌ Lokales Verzeichnis nicht gefunden:', LOCAL_HOOKS_DIR);
    return;
  }

  // 2. Alle MP4-Dateien im Verzeichnis finden
  const files = fs.readdirSync(LOCAL_HOOKS_DIR).filter(file => file.endsWith('.mp4'));

  if (files.length === 0) {
    console.log('ℹ️ Keine MP4-Dateien zum Übertragen gefunden');
    return;
  }

  console.log(`📁 ${files.length} Video-Dateien gefunden\n`);

  // 3. Aktuelle Avatars aus der Datenbank holen
  let avatars;
  try {
    const response = await fetch('http://localhost:3000/api/debug/reaction-avatars');
    const data = await response.json();
    avatars = data.avatars;
  } catch (error) {
    console.error('❌ Konnte Avatars nicht aus Datenbank laden:', error.message);
    return;
  }

  // 4. Dateiname zu Avatar ID mapping
  const fileNameToAvatarId = {};
  avatars.forEach(avatar => {
    if (avatar.videoUrl && avatar.videoUrl.includes('/reaction-hooks/')) {
      const fileName = avatar.videoUrl.split('/').pop();
      fileNameToAvatarId[fileName] = avatar.id;
    }
  });

  console.log('🔍 Avatars mit lokalen Video-URLs:', Object.keys(fileNameToAvatarId).length, '\n');

  // 5. Videos übertragen und URLs aktualisieren
  let successCount = 0;
  let failureCount = 0;

  for (const fileName of files) {
    const filePath = path.join(LOCAL_HOOKS_DIR, fileName);
    const avatarId = fileNameToAvatarId[fileName];

    if (!avatarId) {
      console.log(`⚠️ Kein Avatar für Datei ${fileName} gefunden - überspringe`);
      continue;
    }

    process.stdout.write(`📤 Übertrage ${fileName}... `);

    const newVideoUrl = await uploadVideoToServer(filePath, fileName);

    if (newVideoUrl) {
      const updateSuccess = await updateVideoUrlInDatabase(avatarId, newVideoUrl);
      if (updateSuccess) {
        successCount++;
        console.log(`✅ Fertig`);
      } else {
        failureCount++;
        console.log(`❌ Upload ok, aber DB Update fehlgeschlagen`);
      }
    } else {
      failureCount++;
      console.log(`❌ Upload fehlgeschlagen`);
    }

    // Kleine Pause zwischen Uploads
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n🎉 Transfer abgeschlossen!`);
  console.log(`✅ Erfolgreich: ${successCount}`);
  console.log(`❌ Fehlgeschlagen: ${failureCount}`);
  console.log(`\n💡 Die Videos sind jetzt unter https://files.slidescockpit.com verfügbar`);
}

main().catch(console.error);