const fs = require('fs');
const path = require('path');

try {
  console.log('Firebase-Konfigurationsdatei wird erstellt...');
  
  // Erstelle das Verzeichnis, falls es nicht existiert
  if (!fs.existsSync('js')) {
    fs.mkdirSync('js', { recursive: true });
  }
  
  // Hier werden die Umgebungsvariablen direkt verwendet
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || ''
  };

  // Überprüfe leere Werte und gib Warnungen aus
  let missingVars = [];
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) missingVars.push(key);
  });
  
  if (missingVars.length > 0) {
    console.warn(`Warnung: Folgende Umgebungsvariablen fehlen oder sind leer: ${missingVars.join(', ')}`);
    console.warn('Die Anwendung könnte möglicherweise nicht richtig funktionieren.');
  }

  // Hier wird die Firebase-Konfiguration direkt als KONSTANTE exportiert - kein Vite-Syntax (import.meta.env)
  const configFileContent = `
// js/firebaseConfig.js - AUTOMATISCH GENERIERT, NICHT BEARBEITEN
export const FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig, null, 2)};
`;

  fs.writeFileSync('js/firebaseConfig.js', configFileContent);
  console.log('Firebase-Konfigurationsdatei wurde erfolgreich erstellt.');
} catch (error) {
  console.error('Fehler beim Erstellen der Firebase-Konfigurationsdatei:', error);
  process.exit(1);
}
