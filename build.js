const fs = require('fs');
const path = require('path');

try {
  console.log('Build-Skript gestartet');
  
  // Überprüfe, ob Umgebungsvariablen vorhanden sind
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  if (missingVars.length > 0) {
    console.error('Fehlende Umgebungsvariablen:', missingVars.join(', '));
    throw new Error('Umgebungsvariablen fehlen');
  }

  const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
  };

  const configFileContent = `
// js/firebaseConfig.js - AUTOMATISCH GENERIERT, NICHT BEARBEITEN
export const FIREBASE_CONFIG = ${JSON.stringify(firebaseConfig, null, 2)};
`;

  // Stelle sicher, dass das Verzeichnis existiert
  const jsDir = path.resolve('./js');
  if (!fs.existsSync(jsDir)) {
    console.log(`Verzeichnis ${jsDir} wird erstellt...`);
    fs.mkdirSync(jsDir, { recursive: true });
  }

  const configFilePath = path.join(jsDir, 'firebaseConfig.js');
  fs.writeFileSync(configFilePath, configFileContent);
  console.log(`Firebase-Konfigurationsdatei wurde erstellt: ${configFilePath}`);
  
  // Ausgabe der gespeicherten Datei zur Überprüfung
  console.log('Dateiinhalt (ohne Schlüsselwerte):');
  console.log('Datei enthält apiKey?: ' + (configFileContent.includes('apiKey') ? 'Ja' : 'Nein'));
} catch (error) {
  console.error('Fehler bei der Generierung der Firebase-Konfiguration:', error);
  process.exit(1);  // Expliziter Exit-Code bei Fehlern
}
