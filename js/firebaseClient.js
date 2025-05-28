import { DEFAULT_ASSESSMENT_CATEGORIES,
         DEFAULT_SYSTEM_SETTINGS,
         SYSTEM_SETTINGS } from "./constants.js";

export let db = null;
export let auth = null;
export let firebaseApp = null;

/* ------------------------------ Config ------------------------------ */

const FALLBACK_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};
let FIREBASE_CONFIG = FALLBACK_CONFIG;

async function loadConfig() {
  try {
    const mod = await import("./firebaseConfig.js");
    FIREBASE_CONFIG = mod.FIREBASE_CONFIG || FALLBACK_CONFIG;
    console.log("Firebase-Konfiguration geladen");
  } catch {
    console.warn("firebaseConfig.js fehlt – Fallback-Config wird verwendet");
  }
}

/* ------------------------------ Init ------------------------------ */

export async function initDatabase() {
  await loadConfig();
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
    console.error("Fehlende Firebase-Config", FIREBASE_CONFIG); return false;
  }

  firebaseApp = firebase.apps.length ? firebase.app()
                                     : firebase.initializeApp(FIREBASE_CONFIG);
  db   = firebase.firestore();
  auth = firebase.auth();

  /* Offline-Cache (Fehler ignorieren) */
  try { await db.enablePersistence({ synchronizeTabs: true }); }
  catch (e) { console.warn("Persistenz nicht möglich:", e.code); }

  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

  /* ---------- Rolle prüfen ---------- */
  let role = "guest";
  try {
    await auth.authStateReady();                 // 10.5-SDK
    const u = auth.currentUser;
    if (u) {
      const snap = await db.doc(`users/${u.uid}`).get();
      role = snap.exists ? (snap.data().role || "teacher") : "teacher";
    }
  } catch (e) {
    console.warn("Rollen-Abruf fehlgeschlagen:", e.message);
  }
  console.log("Angemeldete Rolle:", role);

  /* ---------- Nur Admins legen Strukturen an ---------- */
  if (role === "admin") {
    try { await ensureSystemSettings();          } catch (e) { console.warn("ensureSystemSettings:",          e.code); }
    try { await ensureDefaultTemplate();         } catch (e) { console.warn("ensureDefaultAssessment:",       e.code); }
    try { await ensureCollections();             } catch (e) { console.warn("ensureCollections:",            e.code); }
    try { await migrateDataStructure();          } catch (e) { console.warn("migrateDataStructure:",         e.code); }
  }

  return true;
}

/* ------------------------------ Ensure-Funktionen ------------------------------ */

async function ensureCollections() {
  await ensureUsers(); await ensureIdeas();
}
async function ensureUsers()  {
  const s = await db.collection("users").limit(1).get();
  console.log(s.empty ? "users-Collection angelegt" : "users vorhanden");
}
async function ensureIdeas()  {
  const s = await db.collection("project_ideas").limit(1).get();
  console.log(s.empty ? "project_ideas angelegt" : "project_ideas vorhanden");
}

async function ensureSystemSettings() {
  const ref = db.doc(`${SYSTEM_SETTINGS.collectionName}/${SYSTEM_SETTINGS.documentName}`);
  if (!(await ref.get()).exists) {
    const yr = new Date().getFullYear();
    await ref.set({
      ...DEFAULT_SYSTEM_SETTINGS,
      currentSchoolYear: `${yr}/${yr+1}`,
      version: "2.0",
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Systemeinstellungen angelegt");
  }
}

async function ensureDefaultTemplate() {
  const ref = db.doc("wbs_assessment_templates/standard");
  if (!(await ref.get()).exists) {
    await ref.set({
      name       : "Standard-Bewertungsraster",
      description: "Default für alle Themen",
      isDefault  : true,
      version    : "2.0",
      created_by : "SYSTEM",
      created_at : firebase.firestore.FieldValue.serverTimestamp(),
      updated_at : firebase.firestore.FieldValue.serverTimestamp(),
      categories : DEFAULT_ASSESSMENT_CATEGORIES.map(c => ({
        id: c.id, name: c.name, weight: 1
      }))
    });
    console.log("Default-Template angelegt");
  }
}

async function migrateDataStructure() {
  const old = await db.doc("wbs_teachers/teachers_list").get();
  if (old.exists) console.log("Alte Lehrer-Sammlung gefunden – manuelle Migration nötig");
}

/* ------------------------------ Health-Check (optional unverändert) ------------------------------ */

export async function checkDatabaseHealth() {
  if (!db) return { status: "offline" };
  const res = { status: "ok", user: auth.currentUser?.email };
  try {
    res.settings = (await db.doc(`${SYSTEM_SETTINGS.collectionName}/${SYSTEM_SETTINGS.documentName}`).get()).exists;
  } catch { res.status = "warn"; }
  return res;
}
