// js/firebaseClient.js
import { FIREBASE_CONFIG } from "./firebaseConfig.js";
import { SYSTEM_SETTINGS, DEFAULT_SYSTEM_SETTINGS } from "./constants.js";

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

    // Initialisiere System-Einstellungen, falls sie noch nicht existieren
    await ensureSystemSettings();
    
    return true;
  } catch (error) {
    console.error("Fehler bei der Firebase-Initialisierung:", error);
    alert("Fehler bei der Firebase-Initialisierung. Bitte prüfen Sie die Konsole für Details.");
    return false;
  }
}

/**
 * Prüft, ob Systemeinstellungen existieren und erstellt sie, falls nicht
 */
export async function ensureSystemSettings() {
  if (!db) return false;

  try {
    const settingsRef = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    const doc = await settingsRef.get();

    if (!doc.exists) {
      console.log("Systemeinstellungen werden initialisiert...");
      await settingsRef.set({
        ...DEFAULT_SYSTEM_SETTINGS,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("Systemeinstellungen erfolgreich initialisiert");
    } else {
      console.log("Systemeinstellungen bereits vorhanden");
    }
    return true;
  } catch (error) {
    console.error("Fehler beim Initialisieren der Systemeinstellungen:", error);
    return false;
  }
}

/**
 * Prüft, ob die notwendigen Sammlungen existieren und erstellt sie
 */
export async function ensureCollections() {
  if (!db) return false;
  
  try {
    // In Firestore müssen Sammlungen nicht explizit erstellt werden
    // Sie entstehen automatisch beim ersten Dokument
    console.log("Firebase-Collections sind bereit");
    return true;
  } catch (error) {
    console.error("Fehler beim Prüfen der Collections:", error);
    return false;
  }
}

/**
 * Lädt die Systemeinstellungen
 */
export async function getSystemSettings() {
  if (!db) return null;

  try {
    const settingsRef = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    const doc = await settingsRef.get();

    if (doc.exists) {
      return doc.data();
    } else {
      // Falls keine Einstellungen vorhanden sind, erstelle sie
      await ensureSystemSettings();
      const newDoc = await settingsRef.get();
      return newDoc.data();
    }
  } catch (error) {
    console.error("Fehler beim Laden der Systemeinstellungen:", error);
    return null;
  }
}

/**
 * Aktualisiert die Systemeinstellungen
 */
export async function updateSystemSettings(settings) {
  if (!db) return false;

  try {
    const settingsRef = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    await settingsRef.update({
      ...settings,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Systemeinstellungen:", error);
    return false;
  }
}

/**
 * Initialisiert das Standardbewertungsraster, falls es noch nicht existiert
 */
export async function ensureDefaultAssessmentTemplate() {
  if (!db) return false;

  try {
    const templateRef = db.collection("wbs_assessment_templates").doc("standard");
    const doc = await templateRef.get();

    if (!doc.exists) {
      await templateRef.set({
        name: "Standard-Bewertungsraster",
        isDefault: true,
        created_by: "SYSTEM",
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        categories: [
          { id: "presentation", name: "Präsentation", weight: 1 },
          { id: "content", name: "Inhalt", weight: 1 },
          { id: "language", name: "Sprache", weight: 1 },
          { id: "impression", name: "Eindruck", weight: 1 },
          { id: "examination", name: "Prüfung", weight: 1 },
          { id: "reflection", name: "Reflexion", weight: 1 },
          { id: "expertise", name: "Fachwissen", weight: 1 },
          { id: "documentation", name: "Dokumentation", weight: 1 }
        ]
      });
      return true;
    }
    return true;
  } catch (error) {
    console.error("Fehler beim Initialisieren des Standard-Bewertungsrasters:", error);
    return false;
  }
}
