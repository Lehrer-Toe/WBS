// js/firebaseClient.js - Erweiterte Version mit Auth-Unterstützung
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
    const configModule = await import("./firebaseConfig.js");
    FIREBASE_CONFIG = configModule.FIREBASE_CONFIG || FALLBACK_CONFIG;
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
 * Initialisiert die Verbindung zu Firebase mit Auth-Unterstützung
 */
export async function initDatabase() {
  try {
    FIREBASE_CONFIG = await loadFirebaseConfig();
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
      console.error("Firebase-Konfiguration unvollständig:", FIREBASE_CONFIG);
      return false;
    }

    if (firebase.apps.length === 0) {
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
      console.log("Firebase erfolgreich initialisiert");
    } else {
      firebaseApp = firebase.app();
      console.log("Vorhandene Firebase-Instanz verwendet");
    }
    
    try {
      db = firebase.firestore();
      await db.collection("_test_").limit(1).get();
      console.log("Firestore-Verbindung erfolgreich hergestellt");
    } catch (firestoreError) {
      console.error("Fehler bei der Firestore-Initialisierung:", firestoreError);
      try {
        db = firebaseApp.firestore();
        console.log("Firestore über App-Instanz initialisiert");
      } catch (retryError) {
        console.error("Firestore konnte nicht initialisiert werden:", retryError);
        return false;
      }
    }
    
    try {
      auth = firebase.auth();
      console.log("Firebase Auth erfolgreich initialisiert");
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      console.log("Auth-Persistenz konfiguriert");
    } catch (authError) {
      console.error("Firebase Auth konnte nicht initialisiert werden:", authError);
      return false;
    }
    
    try {
      await db.enablePersistence({ synchronizeTabs: true }).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Persistenz konnte nicht aktiviert werden, möglicherweise mehrere Tabs geöffnet');
        } else if (err.code === 'unimplemented') {
          console.warn('Ihr Browser unterstützt keine Persistenz');
        }
      });
      console.log("Offline-Persistenz aktiviert");
    } catch (persistenceError) {
      console.warn("Persistenz-Fehler, nicht kritisch:", persistenceError);
    }

    await ensureSystemSettings();
    await ensureDefaultAssessmentTemplate();
    await ensureUsersCollection();
    await ensureProjectIdeasCollection();
    await migrateDataStructure();
    
    return true;
  } catch (error) {
    console.error("Schwerwiegender Fehler bei der Firebase-Initialisierung:", error);
    let errorMessage = "Fehler bei der Firebase-Initialisierung.";
    if (error.code === 'app/invalid-api-key') {
      errorMessage = "Ungültiger API-Schlüssel. Bitte überprüfen Sie Ihre Umgebungsvariablen.";
    } else if (error.code === 'app/invalid-app-id') {
      errorMessage = "Ungültige App-ID. Bitte überprüfen Sie Ihre Umgebungsvariablen.";
    } else if (error.message.includes('network')) {
      errorMessage = "Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.";
    }
    alert(errorMessage + " Bitte prüfen Sie die Konsole für Details.");
    return false;
  }
}

/**
 * NEU: Stellt sicher, dass die users-Collection existiert
 */
export async function ensureUsersCollection() {
  if (!db) {
    console.warn("Firestore nicht initialisiert, users-Collection kann nicht überprüft werden");
    return false;
  }
  try {
    const usersSnapshot = await db.collection("users").limit(1).get();
    if (usersSnapshot.empty) {
      console.log("Keine Benutzer gefunden. users-Collection wird initialisiert...");
    } else {
      console.log("users-Collection bereits vorhanden");
    }
    return true;
  } catch (error) {
    console.error("Fehler beim Prüfen der users-Collection:", error);
    return false;
  }
}

/**
 * NEU: Stellt sicher, dass die project_ideas-Collection existiert
 */
export async function ensureProjectIdeasCollection() {
  if (!db) {
    console.warn("Firestore nicht initialisiert, project_ideas-Collection kann nicht überprüft werden");
    return false;
  }
  try {
    const ideasSnapshot = await db.collection("project_ideas").limit(1).get();
    if (ideasSnapshot.empty) {
      console.log("Keine Projektideen gefunden. project_ideas-Collection wird initialisiert...");
    } else {
      console.log("project_ideas-Collection bereits vorhanden");
    }
    return true;
  } catch (error) {
    console.error("Fehler beim Prüfen der project_ideas-Collection:", error);
    return false;
  }
}

/**
 * Prüft, ob Systemeinstellungen existieren und erstellt sie, falls nicht
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
 * Initialisiert das Standardbewertungsraster, falls es noch nicht existiert
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
 * Migriert die Datenstruktur auf die neue Version
 */
export async function migrateDataStructure() {
  if (!db) {
    console.warn("Firestore nicht initialisiert, Datenstruktur kann nicht migriert werden");
    return false;
  }
  try {
    console.log("Prüfe Datenstruktur-Migration...");
    await migrateOldTeachersToUsers();
    console.log("Datenstruktur-Migration abgeschlossen");
    return true;
  } catch (error) {
    console.error("Fehler bei der Datenstruktur-Migration:", error);
    return false;
  }
}

/**
 * NEU: Migriert alte Lehrer-Daten zu neuen Benutzer-Daten
 */
async function migrateOldTeachersToUsers() {
  try {
    const teachersDoc = await db.collection("wbs_teachers").doc("teachers_list").get();
    if (teachersDoc.exists) {
      const teachersData = teachersDoc.data();
      const teachers = teachersData.teachers || [];
      console.log(`Migriere ${teachers.length} Lehrer zu neuen Benutzerdaten...`);
      console.log("Hinweis: Alte Lehrer-Daten gefunden. Diese müssen manuell als neue Benutzer angelegt werden.");
    }
    return true;
  } catch (error) {
    console.error("Fehler bei der Lehrer-Migration:", error);
    return false;
  }
}

/**
 * Prüft die Datenbank-Gesundheit
 */
export async function checkDatabaseHealth() {
  if (!db) return { status: "disconnected", issues: ["Keine Datenbankverbindung"] };
  const health = {
    status: "healthy",
    issues: [],
    collections: {},
    auth: {},
    lastChecked: new Date().toISOString()
  };
  try {
    if (auth) {
      health.auth = {
        initialized: true,
        currentUser: auth.currentUser ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email
        } : null
      };
    } else {
      health.issues.push("Firebase Auth nicht initialisiert");
      health.status = "warning";
    }
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
    const usersSnapshot = await db.collection("users").limit(1).get();
    health.collections.users = {
      exists: !usersSnapshot.empty,
      accessible: true
    };
    const ideasSnapshot = await db.collection("project_ideas").limit(1).get();
    health.collections.projectIdeas = {
      exists: !ideasSnapshot.empty,
      accessible: true
    };
    const themesSnapshot = await db.collection("wbs_themes").limit(1).get();
    health.collections.themes = {
      exists: !themesSnapshot.empty,
      accessible: true
    };
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
      await ensureSystemSettings();
      const newDoc = await settingsRef.get();
      return newDoc.data();
    }
  } catch (error) {
    console.error("Fehler beim Laden der Systemeinstellungen:", error);
    return null;
  }
}
