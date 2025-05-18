const fs = require('fs');
const path = require('path');

try {
  console.log('Firebase-Konfigurationsdatei wird erstellt...');
  
  // Prüfe, ob alle benötigten Umgebungsvariablen existieren
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || ''
  };
  
  // Warne, wenn Variablen fehlen, aber fahre trotzdem fort
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (!value) console.warn(`Warnung: ${key} ist nicht definiert!`);
  });

  const configFileContent = `
// js/firebaseConfig.js - AUTOMATISCH GENERIERT, NICHT BEARBEITEN
export const FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig, null, 2)};
`;

  // Erstelle das Verzeichnis, falls es nicht existiert
  if (!fs.existsSync('js')) {
    fs.mkdirSync('js', { recursive: true });
  }

  fs.writeFileSync('js/firebaseConfig.js', configFileContent);
  console.log('Firebase-Konfigurationsdatei wurde erfolgreich erstellt.');
} catch (error) {
  console.error('Fehler beim Erstellen der Firebase-Konfigurationsdatei:', error);
  process.exit(1);  // Exit mit Fehlercode
}
