// js/firebaseClient.js

import { DEFAULT_ASSESSMENT_CATEGORIES, DEFAULT_SYSTEM_SETTINGS, SYSTEM_SETTINGS } from "./constants.js";

export let db = null;
export let auth = null;
export let firebaseApp = null;

const FALLBACK_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

let FIREBASE_CONFIG = FALLBACK_CONFIG;

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

    // Firestore initialisieren und Test-Query
    try {
      db = firebase.firestore();
      await db.collection("_test_").limit(1).get();
      console.log("Firestore-Verbindung erfolgreich hergestellt");
    } catch {
      db = firebaseApp.firestore();
      console.log("Firestore über App-Instanz initialisiert");
    }

    // Auth initialisieren und Persistenz setzen
    auth = firebase.auth();
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    console.log("Firebase Auth und Persistenz bereit");

    // Offline-Persistenz aktivieren
    await db.enablePersistence({ synchronizeTabs: true }).catch(err => {
      if (err.code === 'failed-precondition') {
        console.warn("Persistenz: mehrere Tabs geöffnet");
      } else if (err.code === 'unimplemented') {
        console.warn("Persistenz nicht unterstützt");
      }
    });

    // Datenstruktur sicherstellen
    await ensureSystemSettings();
    await ensureDefaultAssessmentTemplate();
    await ensureCollections();
    await migrateDataStructure();

    return true;
  } catch (error) {
    console.error("Fehler bei der Firebase-Initialisierung:", error);
    alert("Fehler bei der Firebase-Initialisierung. Details in Konsole.");
    return false;
  }
}

export async function ensureUsersCollection() {
  if (!db) return false;
  try {
    const snap = await db.collection("users").limit(1).get();
    console.log(snap.empty
      ? "users-Collection wird initialisiert..."
      : "users-Collection bereits vorhanden");
    return true;
  } catch (e) {
    console.error("Fehler in users-Collection:", e);
    return false;
  }
}

export async function ensureProjectIdeasCollection() {
  if (!db) return false;
  try {
    const snap = await db.collection("project_ideas").limit(1).get();
    console.log(snap.empty
      ? "project_ideas-Collection wird initialisiert..."
      : "project_ideas-Collection bereits vorhanden");
    return true;
  } catch (e) {
    console.error("Fehler in project_ideas-Collection:", e);
    return false;
  }
}

// NEU: kombiniert beide Checks
export async function ensureCollections() {
  await ensureUsersCollection();
  await ensureProjectIdeasCollection();
  return true;
}

export async function ensureSystemSettings() {
  if (!db) return false;
  try {
    const ref = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    const doc = await ref.get();
    if (!doc.exists) {
      const year = new Date().getFullYear();
      await ref.set({
        ...DEFAULT_SYSTEM_SETTINGS,
        currentSchoolYear: `${year}/${year + 1}`,
        schoolYearEnd: null,
        lastAssessmentDate: null,
        version: "2.0",
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("Systemeinstellungen initialisiert");
    }
    return true;
  } catch (e) {
    console.error("Fehler in Systemeinstellungen:", e);
    return false;
  }
}

export async function ensureDefaultAssessmentTemplate() {
  if (!db) return false;
  try {
    const ref = db.collection("wbs_assessment_templates").doc("standard");
    const doc = await ref.get();
    if (!doc.exists) {
      await ref.set({
        name: "Standard-Bewertungsraster",
        description: "Das Standard-Bewertungsraster für alle Themen",
        isDefault: true,
        created_by: "SYSTEM",
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        version: "2.0",
        categories: DEFAULT_ASSESSMENT_CATEGORIES.map(cat => ({
          id: cat.id, name: cat.name, weight: 1
        }))
      });
      console.log("Default-Template erstellt");
    }
    return true;
  } catch (e) {
    console.error("Fehler im Default-Template:", e);
    return false;
  }
}

export async function migrateDataStructure() {
  if (!db) return false;
  try {
    const old = await db.collection("wbs_teachers").doc("teachers_list").get();
    if (old.exists) {
      console.log("Alte Lehrer-Daten gefunden. Manuelle Migration nötig.");
    }
    return true;
  } catch (e) {
    console.error("Fehler bei Migration:", e);
    return false;
  }
}

export async function checkDatabaseHealth() {
  if (!db) return { status: "disconnected", issues: ["Keine DB-Verbindung"] };
  const health = { status: "healthy", issues: [], collections: {}, auth: {}, lastChecked: new Date().toISOString() };
  try {
    health.auth = auth.currentUser ? {
      uid: auth.currentUser.uid,
      email: auth.currentUser.email
    } : null;
    const usersSnap = await db.collection("users").limit(1).get();
    health.collections.users = { exists: !usersSnap.empty, accessible: true };
    const ideasSnap = await db.collection("project_ideas").limit(1).get();
    health.collections.projectIdeas = { exists: !ideasSnap.empty, accessible: true };
  } catch (e) {
    console.error("Health-Check-Fehler:", e);
    health.status = "error";
    health.issues.push(e.message);
  }
  return health;
}

export async function getSystemSettings() {
  if (!db) return null;
  try {
    const ref = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    const doc = await ref.get();
    return doc.exists ? doc.data() : null;
  } catch (e) {
    console.error("Fehler beim Laden Systemeinstellungen:", e);
    return null;
  }
}
