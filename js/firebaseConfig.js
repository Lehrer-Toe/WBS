// js/firebaseConfig.js - Enhanced with better environment variable handling
/**
 * Firebase-Konfigurationsdatei
 * 
 * Diese Datei wird automatisch von build.js generiert und sollte nicht manuell bearbeitet werden.
 * Sie stellt die Verbindungsdaten für Firebase bereit und unterstützt verschiedene Umgebungen.
 */

// Umgebungsvariablen aus verschiedenen Quellen versuchen zu laden
function getEnvVar(name, defaultValue = '') {
  // Versuche verschiedene Umgebungsvariablen-Quellen (Node.js, Vite, importierte Variablen)
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name];
  }
  
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name];
  }
  
  // Für Netlify-spezifische Umgebungsvariablen
  if (typeof window !== 'undefined' && window.ENV && window.ENV[name]) {
    return window.ENV[name];
  }
  
  return defaultValue;
}

// Firebase-Konfiguration mit Fallback-Werten
export const FIREBASE_CONFIG = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY', ''),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN', ''),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID', ''),
  storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET', ''),
  messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID', ''),
  appId: getEnvVar('VITE_FIREBASE_APP_ID', '')
};

// Log Warnings für fehlende Konfiguration (nur in Entwicklungsumgebung)
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  const missingVars = Object.entries(FIREBASE_CONFIG)
    .filter(([_, value]) => !value)
    .map(([key]) => key);
  
  if (missingVars.length > 0) {
    console.warn(`Firebase-Konfiguration unvollständig. Fehlende Werte: ${missingVars.join(', ')}`);
    console.info('Tipp: Legen Sie eine .env-Datei im Projektverzeichnis an mit den benötigten VITE_FIREBASE_* Variablen');
  }
}
