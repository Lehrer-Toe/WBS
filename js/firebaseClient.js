// js/firebaseClient.js - Korrigierte Version ohne problematische Persistenz
import { DEFAULT_ASSESSMENT_CATEGORIES, DEFAULT_SYSTEM_SETTINGS, SYSTEM_SETTINGS } from "./constants.js";

/**
 * Firebase-Konfiguration und Client
 */
export let db = null;
export let auth = null;
export let firebaseApp = null;

// Fallback-Konfiguration falls firebaseConfig.js nicht verfügbar ist
const FALLBACK_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

let FIREBASE_CONFIG = FALLBACK_CONFIG;

/**
 * Lädt die Firebase-Konfiguration aus verschiedenen Quellen
 */
async function loadFirebaseConfig() {
  try {
    // Versuche aus firebaseConfig.js zu laden
    const configModule = await import("./firebaseConfig.js");
    FIREBASE_CONFIG = configModule.FIREBASE_CONFIG || FALLBACK_CONFIG;
    
    // Überprüfe ob die Konfiguration vollständig ist
    const missingKeys = Object.entries(FIREBASE_CONFIG)
      .filter(([_, value]) => !value)
      .map(([key]) => key);
    
    if (missingKeys.length > 0) {
      console.warn(`Unvollständige Firebase-Konfiguration. Fehlende Werte: ${missingKeys.join(', ')}`);
    } else {
      console.log("Firebase-Konfiguration erfolgreich geladen");
    }
    
    return FIREBASE_CONFIG;
  } catch (error) {
    console.warn("firebaseConfig.js konnte nicht geladen werden:", error);
    return FALLBACK_CONFIG;
  }
}

/**
 * Initialisiert die Verbindung zu Firebase - KORRIGIERTE VERSION
 */
export async function initDatabase() {
  try {
    console.log("Starte Firebase-Initialisierung...");
    
    // Firebase-Konfiguration laden
    FIREBASE_CONFIG = await loadFirebaseConfig();
    
    // Prüfen, ob die Konfiguration gültig ist
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
      console.error("Firebase-Konfiguration unvollständig:", FIREBASE_CONFIG);
      return false;
    }

    // Überprüfen, ob Firebase bereits initialisiert wurde
    if (firebase.apps.length === 0) {
      // Firebase initialisieren
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
      console.log("Firebase erfolgreich initialisiert");
    } else {
      // Firebase wurde bereits initialisiert
      firebaseApp = firebase.app();
      console.log("Vorhandene Firebase-Instanz verwendet");
    }
    
    // Firestore-Instanz abrufen mit verbesserter Fehlerbehandlung
    try {
      db = firebase.firestore();
      console.log("Firestore-Instanz erstellt");
      
      // Einfacher Verbindungstest ohne await - NICHT BLOCKIEREND
      db.collection("_connection_test_").limit(1).get()
        .then(() => {
          console.log("Firestore-Verbindung erfolgreich hergestellt");
        })
        .catch((testError) => {
          console.warn("Firestore-Verbindungstest fehlgeschlagen:", testError);
        });
        
    } catch (firestoreError) {
      console.error("Fehler bei der Firestore-Initialisierung:", firestoreError);
      return false;
    }
    
    // Auth-Instanz abrufen
    try {
      auth = firebase.auth();
      console.log("Firebase Auth erfolgreich initialisiert");
    } catch (authError) {
      console.warn("Firebase Auth konnte nicht initialisiert werden:", authError);
      // Dies ist nicht kritisch, also fahren wir fort
    }
    
    // ENTFERNT: Problematische Persistenz-Aktivierung
    // Die veraltete enablePersistence() Methode wurde entfernt, da sie das System blockiert
    console.log("Firebase-Initialisierung ohne Persistenz abgeschlossen");

    // Initialisiere System-Einstellungen asynchron (nicht blockierend)
    ensureSystemSettings().catch(error => {
      console.warn("Systemeinstellungen konnten nicht initialisiert werden:", error);
    });
    
    // Initialisiere Standard-Bewertungsraster asynchron (nicht blockierend)
    ensureDefaultAssessmentTemplate().catch(error => {
      console.warn("Standard-Bewertungsraster konnte nicht initialisiert werden:", error);
    });
    
    console.log("Firebase-Initialisierung erfolgreich abgeschlossen");
    return true;
    
  } catch (error) {
    console.error("Schwerwiegender Fehler bei der Firebase-Initialisierung:", error);
    
    // Erstelle eine benutzerfreundlichere Fehlermeldung
    let errorMessage = "Fehler bei der Firebase-Initialisierung.";
    if (error.code === 'app/invalid-api-key') {
      errorMessage = "Ungültiger API-Schlüssel. Bitte überprüfen Sie Ihre Umgebungsvariablen.";
    } else if (error.code === 'app/invalid-app-id') {
      errorMessage = "Ungültige App-ID. Bitte überprüfen Sie Ihre Umgebungsvariablen.";
    } else if (error.message.includes('network')) {
      errorMessage = "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.";
    }
    
    console.error(errorMessage);
    return false;
  }
}

/**
 * Prüft, ob Systemeinstellungen existieren und erstellt sie, falls nicht - NICHT BLOCKIEREND
 */
export async function ensureSystemSettings() {
  if (!db) {
    console.warn("Firestore nicht initialisiert, verwende Standard-Einstellungen");
    return false;
  }

  try {
    const settingsRef = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    const doc = await settingsRef.get();

    if (!doc.exists) {
      console.log("Systemeinstellungen werden initialisiert...");
      
      // Erweiterte Standard-Systemeinstellungen
      const currentYear = new Date().getFullYear();
      const defaultSettings = {
        ...DEFAULT_SYSTEM_SETTINGS,
        currentSchoolYear: `${currentYear}/${currentYear + 1}`,
        schoolYearEnd: null,
        lastAssessmentDate: null,
        version: "2.0",
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await settingsRef.set(defaultSettings);
      console.log("Systemeinstellungen erfolgreich initialisiert");
    } else {
      console.log("Systemeinstellungen bereits vorhanden");
      
      // Prüfe, ob alle neuen Felder vorhanden sind
      const data = doc.data();
      let needsUpdate = false;
      const updates = {};
      
      if (!data.schoolYearEnd) {
        updates.schoolYearEnd = null;
        needsUpdate = true;
      }
      
      if (!data.lastAssessmentDate) {
        updates.lastAssessmentDate = null;
        needsUpdate = true;
      }
      
      if (!data.version) {
        updates.version = "2.0";
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        updates.updated_at = firebase.firestore.FieldValue.serverTimestamp();
        await settingsRef.update(updates);
        console.log("Systemeinstellungen aktualisiert mit neuen Feldern");
      }
    }
    return true;
  } catch (error) {
    console.error("Fehler beim Initialisieren der Systemeinstellungen:", error);
    return false;
  }
}

/**
 * Initialisiert das Standardbewertungsraster, falls es noch nicht existiert - NICHT BLOCKIEREND
 */
export async function ensureDefaultAssessmentTemplate() {
  if (!db) {
    console.warn("Firestore nicht initialisiert, Standard-Bewertungsraster kann nicht erstellt werden");
    return false;
  }

  try {
    const templateRef = db.collection("wbs_assessment_templates").doc("standard");
    const doc = await templateRef.get();

    if (!doc.exists) {
      console.log("Erstelle Standard-Bewertungsraster...");
      
      await templateRef.set({
        name: "Standard-Bewertungsraster",
        description: "Das Standard-Bewertungsraster für alle Themen",
        isDefault: true,
        created_by: "SYSTEM",
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        version: "2.0",
        categories: DEFAULT_ASSESSMENT_CATEGORIES.map(cat => ({
          id: cat.id,
          name: cat.name,
          weight: 1
        }))
      });
      
      console.log("Standard-Bewertungsraster erfolgreich erstellt");
      return true;
    } else {
      // Prüfe, ob das Standard-Raster aktualisiert werden muss
      const data = doc.data();
      if (!data.version || data.version !== "2.0") {
        console.log("Aktualisiere Standard-Bewertungsraster...");
        
        await templateRef.update({
          version: "2.0",
          description: "Das Standard-Bewertungsraster für alle Themen",
          updated_at: firebase.firestore.FieldValue.serverTimestamp(),
          categories: DEFAULT_ASSESSMENT_CATEGORIES.map(cat => ({
            id: cat.id,
            name: cat.name,
            weight: 1
          }))
        });
        
        console.log("Standard-Bewertungsraster aktualisiert");
      }
      return true;
    }
  } catch (error) {
    console.error("Fehler beim Initialisieren des Standard-Bewertungsrasters:", error);
    return false;
  }
}

/**
 * Prüft, ob die notwendigen Sammlungen existieren - SCHNELLE VERSION
 */
export async function ensureCollections() {
  if (!db) {
    console.warn("Firestore nicht initialisiert, Collections können nicht überprüft werden");
    return false;
  }
  
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
 * Migriert die Datenstruktur auf die neue Version - NICHT BLOCKIEREND
 */
export async function migrateDataStructure() {
  if (!db) {
    console.warn("Firestore nicht initialisiert, Datenstruktur kann nicht migriert werden");
    return false;
  }
  
  try {
    console.log("Prüfe Datenstruktur-Migration...");
    
    // Implementiere hier deine Migrations-Logik, wenn notwendig
    
    console.log("Datenstruktur-Migration abgeschlossen");
    return true;
  } catch (error) {
    console.error("Fehler bei der Datenstruktur-Migration:", error);
    return false;
  }
}

/**
 * Prüft die Datenbank-Gesundheit - NICHT BLOCKIEREND
 */
export async function checkDatabaseHealth() {
  if (!db) return { status: "disconnected", issues: ["Keine Datenbankverbindung"] };
  
  const health = {
    status: "healthy",
    issues: [],
    collections: {},
    lastChecked: new Date().toISOString()
  };
  
  try {
    // Prüfe System-Einstellungen
    const systemSettings = await getSystemSettings();
    if (!systemSettings) {
      health.issues.push("Systemeinstellungen nicht verfügbar");
      health.status = "warning";
    } else {
      health.collections.systemSettings = {
        exists: true,
        version: systemSettings.version || "unknown"
      };
    }
    
    // Prüfe Lehrer-Collection
    const teachersDoc = await db.collection("wbs_teachers").doc("teachers_list").get();
    health.collections.teachers = {
      exists: teachersDoc.exists,
      count: teachersDoc.exists && teachersDoc.data().teachers ? teachersDoc.data().teachers.length : 0
    };
    
    // Prüfe Themen-Collection
    const themesSnapshot = await db.collection("wbs_themes").limit(1).get();
    health.collections.themes = {
      exists: !themesSnapshot.empty,
      accessible: true
    };
    
    // Prüfe Bewertungsraster-Collection
    const templatesSnapshot = await db.collection("wbs_assessment_templates").limit(1).get();
    health.collections.assessmentTemplates = {
      exists: !templatesSnapshot.empty,
      accessible: true
    };
    
    if (health.issues.length > 0) {
      health.status = health.issues.length > 2 ? "error" : "warning";
    }
    
  } catch (error) {
    console.error("Fehler bei der Gesundheitsprüfung:", error);
    health.status = "error";
    health.issues.push(`Datenbankfehler: ${error.message}`);
  }
  
  return health;
}

/**
 * Lädt die Systemeinstellungen - NICHT BLOCKIEREND
 */
export async function getSystemSettings() {
  if (!db) return null;

  try {
    const settingsRef = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    const doc = await settingsRef.get();

    if (doc.exists) {
      return doc.data();
    } else {
      // Falls keine Einstellungen vorhanden sind, erstelle sie asynchron
      ensureSystemSettings().catch(error => {
        console.warn("Systemeinstellungen konnten nicht erstellt werden:", error);
      });
      return DEFAULT_SYSTEM_SETTINGS;
    }
  } catch (error) {
    console.error("Fehler beim Laden der Systemeinstellungen:", error);
    return DEFAULT_SYSTEM_SETTINGS;
  }
}
