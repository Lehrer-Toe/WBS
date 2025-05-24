const fs = require('fs');
const path = require('path');

try {
  console.log('Firebase-Konfigurationsdatei wird erstellt...');
  
  // Erstelle das Verzeichnis, falls es nicht existiert
  if (!fs.existsSync('js')) {
    fs.mkdirSync('js', { recursive: true });
  }
  
  // Firebase-Config
  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY || '',
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: process.env.VITE_FIREBASE_APP_ID || ''
  };

  const configFileContent = `
// js/firebaseConfig.js - AUTOMATISCH GENERIERT, NICHT BEARBEITEN
export const FIREBASE_CONFIG = {
  apiKey: ${JSON.stringify(firebaseConfig.apiKey)},
  authDomain: ${JSON.stringify(firebaseConfig.authDomain)},
  projectId: ${JSON.stringify(firebaseConfig.projectId)},
  storageBucket: ${JSON.stringify(firebaseConfig.storageBucket)},
  messagingSenderId: ${JSON.stringify(firebaseConfig.messagingSenderId)},
  appId: ${JSON.stringify(firebaseConfig.appId)}
};
`;

  fs.writeFileSync('js/firebaseConfig.js', configFileContent);
  console.log('Firebase-Konfigurationsdatei wurde erfolgreich erstellt.');
  
  // NICHTS WEITERES TUN - Keine Module kopieren oder umleiten
  
} catch (error) {
  console.error('Fehler beim Erstellen der Firebase-Konfigurationsdatei:', error);
  process.exit(1);
}
