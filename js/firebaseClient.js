// js/firebaseClient.js
import { FIREBASE_CONFIG } from "./firebaseConfig.js";

export let db = null;
export let auth = null;

/**
 * Initialisiert die Verbindung zu Firebase
 */
export async function initDatabase() {
  try {
    // Firebase initialisieren
    firebase.initializeApp(FIREBASE_CONFIG);
    
    // Firestore-Instanz abrufen
    db = firebase.firestore();
    auth = firebase.auth();
    
    // Offline-Persistenz aktivieren (optional)
    await db.enablePersistence().catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Persistenz konnte nicht aktiviert werden, möglicherweise mehrere Tabs geöffnet');
      } else if (err.code === 'unimplemented') {
        console.warn('Ihr Browser unterstützt keine Persistenz');
      }
    });
    
    console.log("Firebase erfolgreich initialisiert");
    return true;
  } catch (error) {
    console.error("Fehler bei der Firebase-Initialisierung:", error);
    return false;
  }
}

/**
 * Prüft, ob die Sammlung "wbs_data" existiert und erstellt sie, falls nicht
 */
export async function ensureCollection() {
  try {
    // In Firestore müssen Sammlungen nicht explizit erstellt werden
    // Sie entstehen automatisch beim ersten Dokument
    console.log("Firebase-Collection ist bereit");
    return true;
  } catch (error) {
    console.error("Fehler beim Prüfen der Collection:", error);
    return false;
  }
}
