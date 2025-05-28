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
      .filter(([_, v]) => !v)
      .map(([k]) => k);
    if (missingKeys.length) {
      console.warn(`Unvollständige Firebase-Konfiguration. Fehlende Werte: ${missingKeys.join(", ")}`);
    } else {
      console.log("Firebase-Konfiguration erfolgreich geladen");
    }
  } catch (e) {
    console.warn("firebaseConfig.js konnte nicht geladen werden:", e);
  }
  return FIREBASE_CONFIG;
}

export async function initDatabase() {
  try {
    FIREBASE_CONFIG = await loadFirebaseConfig();
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
      console.error("Firebase-Konfiguration unvollständig", FIREBASE_CONFIG);
      return false;
    }

    firebaseApp = firebase.apps.length
      ? firebase.app()
      : firebase.initializeApp(FIREBASE_CONFIG);
    console.log("Firebase initialisiert");

    db = firebase.firestore();

    try {
      await db.enablePersistence({ synchronizeTabs: true });
      console.log("Offline-Persistenz aktiviert");
    } catch (err) {
      if (err.code === "failed-precondition") {
        console.warn("Persistenz: mehrere Tabs geöffnet");
      } else if (err.code === "unimplemented") {
        console.warn("Persistenz nicht unterstützt");
      } else {
        console.warn("Persistenz-Fehler:", err);
      }
    }

    try {
      await db.collection("_test_").limit(1).get();
      console.log("Firestore-Verbindung erfolgreich hergestellt");
    } catch {
      db = firebaseApp.firestore();
      console.log("Fallback: Firestore über App-Instanz");
    }

    auth = firebase.auth();
    await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    console.log("Firebase Auth und Persistenz bereit");

    ensureSystemSettings().catch(() => console.warn("ensureSystemSettings fehlgeschlagen"));
    ensureDefaultAssessmentTemplate().catch(() => console.warn("ensureDefaultAssessmentTemplate fehlgeschlagen"));
    ensureCollections().catch(() => console.warn("ensureCollections fehlgeschlagen"));
    migrateDataStructure().catch(() => console.warn("migrateDataStructure fehlgeschlagen"));

    return true;
  } catch (error) {
    console.error("Fehler bei Firebase-Init:", error.code, error.message);
    return false;
  }
}

export async function ensureUsersCollection() {
  if (!db) return;
  const snap = await db.collection("users").limit(1).get();
  console.log(snap.empty ? "users-Collection wird initialisiert" : "users-Collection bereits vorhanden");
}

export async function ensureProjectIdeasCollection() {
  if (!db) return;
  const snap = await db.collection("project_ideas").limit(1).get();
  console.log(snap.empty ? "project_ideas-Collection wird initialisiert" : "project_ideas-Collection bereits vorhanden");
}

export async function ensureCollections() {
  await ensureUsersCollection();
  await ensureProjectIdeasCollection();
}

export async function ensureSystemSettings() {
  if (!db) return;
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
}

export async function ensureDefaultAssessmentTemplate() {
  if (!db) return;
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
        id: cat.id,
        name: cat.name,
        weight: 1
      }))
    });
    console.log("Default-Template erstellt");
  }
}

export async function migrateDataStructure() {
  if (!db) return;
  const old = await db.collection("wbs_teachers").doc("teachers_list").get();
  if (old.exists) {
    console.log("Alte Lehrer-Daten gefunden. Manuelle Migration nötig");
  }
}

export async function checkDatabaseHealth() {
  if (!db) return { status: "disconnected", issues: ["Keine DB-Verbindung"] };
  const health = {
    status: "healthy",
    issues: [],
    collections: {},
    auth: {},
    lastChecked: new Date().toISOString()
  };
  try {
    health.auth = auth.currentUser
      ? { uid: auth.currentUser.uid, email: auth.currentUser.email }
      : null;
    const uSnap = await db.collection("users").limit(1).get();
    health.collections.users = { exists: !uSnap.empty, accessible: true };
    const iSnap = await db.collection("project_ideas").limit(1).get();
    health.collections.projectIdeas = { exists: !iSnap.empty, accessible: true };
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
