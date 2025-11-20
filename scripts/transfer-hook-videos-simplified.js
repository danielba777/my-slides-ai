const fs = require('fs');
const path = require('path');

// Konfiguration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const NEXTJS_API_BASE = process.env.NEXTJS_API_BASE || 'http://localhost:3000';
const LOCAL_HOOKS_DIR = path.join(process.cwd(), 'public', 'ugc', 'reaction-hooks');

// Colors für bessere Ausgabe
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function formatError(error) {
  return error instanceof Error ? error.message : String(error);
}

async function uploadVideoToServer(fileName) {
  try {
    const filePath = path.join(LOCAL_HOOKS_DIR, fileName);

    // Prüfen ob Datei existiert
    if (!fs.existsSync(filePath)) {
      throw new Error(`Datei nicht gefunden: ${filePath}`);
    }

    // 1. Presigned URL holen
    const presignUrl = `${API_BASE_URL}/files/presign?key=ugc/reaction-hooks/${fileName}&contentType=video/mp4`;
    log(`📋 Hole Upload-URL für ${fileName}...`, 'blue');

    const presignResponse = await fetch(presignUrl);
    if (!presignResponse.ok) {
      throw new Error(`Presign API error: ${presignResponse.status} ${presignResponse.statusText}`);
    }

    const presignData = await presignResponse.json();
    log(`✅ Upload-URL erhalten`, 'green');

    // 2. Datei lesen
    const fileStats = fs.statSync(filePath);
    const fileSizeMB = (fileStats.size / 1024 / 1024).toFixed(1);
    log(`📁 Lese Datei (${fileSizeMB} MB)...`, 'blue');

    const videoBuffer = fs.readFileSync(filePath);

    // 3. Upload
    log(`📤 Lade hoch...`, 'blue');
    const uploadResponse = await fetch(presignData.uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/mp4',
        'Content-Length': videoBuffer.length.toString(),
      },
      body: videoBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    log(`✅ Upload erfolgreich`, 'green');
    return presignData.publicUrl;

  } catch (error) {
    log(`❌ Upload Fehler: ${formatError(error)}`, 'red');
    return null;
  }
}

async function getAvatarsFromDatabase() {
  try {
    log('🔍 Lade Avatars aus Datenbank...', 'blue');
    const response = await fetch(`${NEXTJS_API_BASE}/api/debug/reaction-avatars`);

    if (!response.ok) {
      throw new Error(`Database API error: ${response.status}`);
    }

    const data = await response.json();
    log(`✅ ${data.avatars.length} Avatars geladen`, 'green');
    return data.avatars;
  } catch (error) {
    log(`❌ Datenbank Fehler: ${formatError(error)}`, 'red');
    return [];
  }
}

async function updateAvatarVideoUrl(avatarId, newVideoUrl) {
  try {
    const response = await fetch(`${NEXTJS_API_BASE}/api/ugc/reaction-avatars/${avatarId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        videoUrl: newVideoUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Update failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    return true;
  } catch (error) {
    log(`❌ Update Fehler: ${formatError(error)}`, 'red');
    return false;
  }
}

async function main() {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch API nicht verfügbar. Bitte Node.js 18+ verwenden.');
  }

  log('🚀 Hook Videos Transfer Skript', 'blue');
  log('=' .repeat(50), 'blue');

  // 1. Prüfen ob Verzeichnis existiert
  if (!fs.existsSync(LOCAL_HOOKS_DIR)) {
    log(`❌ Verzeichnis nicht gefunden: ${LOCAL_HOOKS_DIR}`, 'red');
    log('💡 Stelle sicher, dass das Skript im slidescockpit Verzeichnis läuft', 'yellow');
    return;
  }

  // 2. Alle MP4 Dateien finden
  const files = fs.readdirSync(LOCAL_HOOKS_DIR)
    .filter(file => file.endsWith('.mp4'))
    .sort();

  if (files.length === 0) {
    log('ℹ️ Keine MP4 Dateien gefunden', 'yellow');
    return;
  }

  log(`📁 ${files.length} Video-Dateien gefunden:`, 'green');
  files.forEach(file => {
    const filePath = path.join(LOCAL_HOOKS_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(1);
    log(`   📹 ${file} (${sizeMB} MB)`, 'blue');
  });

  // 3. Avatars laden
  const avatars = await getAvatarsFromDatabase();
  if (avatars.length === 0) {
    log('❌ Keine Avatars in Datenbank gefunden', 'red');
    return;
  }

  // 4. Mapping Dateiname -> Avatar ID
  const fileNameToAvatarId = {};
  let localUrlCount = 0;

  avatars.forEach(avatar => {
    if (avatar.videoUrl && avatar.videoUrl.includes('/reaction-hooks/')) {
      const fileName = avatar.videoUrl.split('/').pop();
      if (fileName) {
        fileNameToAvatarId[fileName] = avatar.id;
        localUrlCount++;
      }
    }
  });

  log(`🔗 ${localUrlCount} Avatars mit lokalen Video-URLs gefunden`, 'green');

  if (localUrlCount === 0) {
    log('ℹ️ Keine Avatars mit lokalen URLs zum Aktualisieren', 'yellow');
    return;
  }

  // 5. Transfer durchführen
  log('\n🚀 Starte Transfer...', 'blue');
  log('=' .repeat(50), 'blue');

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < files.length; i++) {
    const fileName = files[i];
    const avatarId = fileNameToAvatarId[fileName];

    log(`\n📦 ${i + 1}/${files.length} - ${fileName}`, 'blue');
    log('-'.repeat(40), 'blue');

    if (!avatarId) {
      log(`⚠️ Kein Avatar für diese Datei gefunden - überspringe`, 'yellow');
      continue;
    }

    // Upload
    const newVideoUrl = await uploadVideoToServer(fileName);

    if (newVideoUrl) {
      log(`🔗 Neue URL: ${newVideoUrl}`, 'green');

      // Datenbank Update
      const updateSuccess = await updateAvatarVideoUrl(avatarId, newVideoUrl);

      if (updateSuccess) {
        successCount++;
        log(`✅ Avatar ${avatarId} erfolgreich aktualisiert`, 'green');
      } else {
        failureCount++;
        log(`❌ Upload ok, aber Datenbank-Update fehlgeschlagen`, 'red');
      }
    } else {
      failureCount++;
      log(`❌ Upload fehlgeschlagen`, 'red');
    }

    // Pause zwischen Uploads
    if (i < files.length - 1) {
      log('⏳ Warte 2 Sekunden...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // 6. Zusammenfassung
  log('\n' + '=' .repeat(50), 'blue');
  log('🎉 Transfer abgeschlossen!', 'blue');
  log(`✅ Erfolgreich: ${successCount}`, 'green');
  log(`❌ Fehlgeschlagen: ${failureCount}`, failureCount > 0 ? 'red' : 'green');

  if (successCount > 0) {
    log('\n💡 Die Videos sind jetzt verfügbar unter:', 'green');
    log('   https://files.slidescockpit.com/ugc/reaction-hooks/', 'blue');
    log('\n🔄 Starten Sie die App neu, um die Änderungen zu sehen', 'yellow');
  }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  log(`❌ Unhandled Rejection: ${reason}`, 'red');
});

process.on('uncaughtException', (error) => {
  log(`❌ Uncaught Exception: ${error.message}`, 'red');
  process.exit(1);
});

main().catch(error => {
  log(`❌ Skript Fehler: ${formatError(error)}`, 'red');
  process.exit(1);
});
