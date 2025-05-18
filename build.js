const fs = require('fs');

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

fs.writeFileSync('js/firebaseConfig.js', configFileContent);
console.log('Firebase-Konfigurationsdatei wurde erstellt.');
