const fs = require('fs');
const path = require('path');

try {
  console.log('Firebase-Konfigurationsdatei wird erstellt...');
  
  // Erstelle das Verzeichnis, falls es nicht existiert
  if (!fs.existsSync('js')) {
    fs.mkdirSync('js', { recursive: true });
  }
  
  // Hier werden die Umgebungsvariablen für Netlify verwendet
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

  // Hier wird eine Konfiguration erstellt, die sowohl mit Netlify als auch mit Vite funktioniert
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
  
  // Erstelle eine js/modules-Weiterleitung, um 404-Fehler zu vermeiden
  if (!fs.existsSync('js/modules')) {
    fs.mkdirSync('js/modules', { recursive: true });
  }

  // Erstelle Redirect-Dateien, die auf die Hauptmodule verweisen
  const redirectModules = ['adminModule.js', 'loginModule.js', 'themeModule.js', 'templateModule.js'];
  
  redirectModules.forEach(module => {
    const redirectContent = `// Weiterleitung zu ../
import * as moduleContent from '../${module}';
export default moduleContent;
export * from '../${module}';
`;
    fs.writeFileSync(`js/modules/${module}`, redirectContent);
    console.log(`Redirect für ${module} erstellt.`);
  });
  
} catch (error) {
  console.error('Fehler beim Erstellen der Firebase-Konfigurationsdatei:', error);
  process.exit(1);
}
