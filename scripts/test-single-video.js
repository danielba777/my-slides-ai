const fs = require('fs');
const path = require('path');

// Konfiguration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const NEXTJS_API_BASE = process.env.NEXTJS_API_BASE || 'http://localhost:3000';
const LOCAL_HOOKS_DIR = path.join(process.cwd(), 'public', 'ugc', 'reaction-hooks');

// Colors
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

async function testSingleVideo() {
  log('🧪 SICHERHEITSTEST - Nur EINE Datei', 'blue');
  log('=' .repeat(50), 'blue');

  // 1. Prüfen ob Verzeichnis existiert
  if (!fs.existsSync(LOCAL_HOOKS_DIR)) {
    log(`❌ Verzeichnis nicht gefunden: ${LOCAL_HOOKS_DIR}`, 'red');
    return;
  }

  // 2. Nur die ERSTE Datei finden für Test
  const files = fs.readdirSync(LOCAL_HOOKS_DIR)
    .filter(file => file.endsWith('.mp4'))
    .slice(0, 1); // NUR EINE DATEI!

  if (files.length === 0) {
    log('ℹ️ Keine MP4 Dateien gefunden', 'yellow');
    return;
  }

  const testFile = files[0];
  log(`🎯 Teste mit Datei: ${testFile}`, 'yellow');

  // 3. API-Konnektivität testen
  log('\n🔍 1. Teste API-Konnektivität...', 'blue');

  try {
    // Test presign API
    const presignResponse = await fetch(`${API_BASE_URL}/files/presign?key=test.txt&contentType=text/plain`);
    if (presignResponse.ok) {
      log('✅ slidescockpit-api erreichbar', 'green');
    } else {
      log(`❌ slidescockpit-api Fehler: ${presignResponse.status}`, 'red');
      return;
    }
  } catch (error) {
    log(`❌ slidescockpit-api nicht erreichbar: ${formatError(error)}`, 'red');
    log('💡 Stelle sicher, dass die API auf http://localhost:3001 läuft', 'yellow');
    return;
  }

  try {
    // Test Next.js API
    const debugResponse = await fetch(`${NEXTJS_API_BASE}/api/debug/reaction-avatars`);
    if (debugResponse.ok) {
      log('✅ Next.js App erreichbar', 'green');
    } else {
      log(`❌ Next.js App Fehler: ${debugResponse.status}`, 'red');
      return;
    }
  } catch (error) {
    log(`❌ Next.js App nicht erreichbar: ${formatError(error)}`, 'red');
    log('💡 Stelle sicher, dass die App auf http://localhost:3000 läuft', 'yellow');
    return;
  }

  // 4. Avatar für Testdatei finden
  log('\n🔍 2. Suche passenden Avatar...', 'blue');

  let avatars;
  try {
    const response = await fetch(`${NEXTJS_API_BASE}/api/debug/reaction-avatars`);
    const data = await response.json();
    avatars = data.avatars;
  } catch (error) {
    log(`❌ Konnte Avatars nicht laden: ${formatError(error)}`, 'red');
    return;
  }

  const targetAvatar = avatars.find(avatar =>
    avatar.videoUrl && avatar.videoUrl.includes(testFile)
  );

  if (!targetAvatar) {
    log(`⚠️ Kein Avatar für Datei ${testFile} gefunden`, 'yellow');
    log('💡 Das bedeutet, die Datei ist nicht mit einem Avatar verknüpft', 'yellow');
    return;
  }

  log(`✅ Avatar gefunden: ${targetAvatar.name} (ID: ${targetAvatar.id})`, 'green');
  log(`📍 Aktuelle URL: ${targetAvatar.videoUrl}`, 'blue');

  // 5. Sicherheitsfrage
  log('\n⚠️ SICHERHEITSFRAGE:', 'yellow');
  log(`   Das Skript wird jetzt die Datei "${testFile}" hochladen`, 'yellow');
  log(`   und die URL von "${targetAvatar.videoUrl}" aktualisieren.`, 'yellow');
  log('', 'reset');
  log('   🔒 Backups:', 'green');
  log('   - Lokale Datei bleibt unverändert', 'green');
  log('   - Alte URL kann wiederhergestellt werden', 'green');
  log('', 'reset');

  // Test läuft ohne Bestätigung (nur Anzeige)
  log('\n🚀 WÜRDE JETZT STARTEN (Simulation):', 'blue');
  log('   1. Presigned URL holen', 'blue');
  log('   2. Datei hochladen zu S3', 'blue');
  log('   3. Datenbank aktualisieren', 'blue');
  log('   4. Ergebnis überprüfen', 'blue');

  log('\n✅ Test abgeschlossen! Alles ist bereit für den echten Transfer.', 'green');
  log(`\n💡 Führe jetzt aus: node scripts/transfer-hook-videos-simplified.js`, 'blue');
}

main().catch(error => {
  log(`❌ Skript Fehler: ${formatError(error)}`, 'red');
});

async function main() {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch API nicht verfügbar. Bitte Node.js 18+ verwenden.');
  }

  await testSingleVideo();
}
