// js/firebaseClient.js
import { FIREBASE_CONFIG } from "./firebaseConfig.js";

export let db = null;
export let auth = null;

/**
 * Initialisiert die Verbindung zu Firebase
 */
export async function initDatabase() {
  try {
    // Prüfen, ob die Konfiguration gültig ist
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
      console.error("Firebase-Konfiguration unvollständig:", FIREBASE_CONFIG);
      return false;
    }

    // Firebase initialisieren
    firebase.initializeApp(FIREBASE_CONFIG);
    
    // Firestore-Instanz abrufen
    db = firebase.firestore();
    auth = firebase.auth();
    
    // Offline-Persistenz aktivieren (optional)
    try {
      await db.enablePersistence({synchronizeTabs: true}).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Persistenz konnte nicht aktiviert werden, möglicherweise mehrere Tabs geöffnet');
        } else if (err.code === 'unimplemented') {
          console.warn('Ihr Browser unterstützt keine Persistenz');
        }
      });
    } catch (persistenceError) {
      console.warn("Persistenz-Fehler, nicht kritisch:", persistenceError);
    }
    
    console.log("Firebase erfolgreich initialisiert");
    return true;
  } catch (error) {
    console.error("Fehler bei der Firebase-Initialisierung:", error);
    alert("Fehler bei der Firebase-Initialisierung. Bitte prüfen Sie die Konsole für Details.");
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
