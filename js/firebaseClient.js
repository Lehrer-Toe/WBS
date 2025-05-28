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

async function loadConfig() {
  try {
    const mod = await import("./firebaseConfig.js");
    FIREBASE_CONFIG = mod.FIREBASE_CONFIG || FALLBACK_CONFIG;
  } catch {}
}

export async function initDatabase() {
  await loadConfig();
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) return false;

  firebaseApp = firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
  db   = firebase.firestore();
  auth = firebase.auth();
  try { await db.enablePersistence({ synchronizeTabs: true }); } catch {}

  await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

  let role = "guest";
  await new Promise(r => { const u = auth.onAuthStateChanged(() => { u(); r(); }); });
  if (auth.currentUser) {
    const snap = await db.doc(`users/${auth.currentUser.uid}`).get();
    const d = snap.data() || {};
    role = d.role || (d.permissions && d.permissions.role) || "teacher";
  }
  console.log("Angemeldete Rolle:", role);

  if (role === "admin") {
    try { await ensureSystemSettings();          } catch {}
    try { await ensureDefaultTemplate();         } catch {}
    try { await ensureCollections();             } catch {}
    try { await migrateDataStructure();          } catch {}
  }
  return true;
}

async function ensureCollections()       { await ensureUsers(); await ensureIdeas(); }
async function ensureUsers()              { await db.collection("users").limit(1).get(); }
async function ensureIdeas()              { await db.collection("project_ideas").limit(1).get(); }

async function ensureSystemSettings() {
  const ref = db.doc(`${SYSTEM_SETTINGS.collectionName}/${SYSTEM_SETTINGS.documentName}`);
  if (!(await ref.get()).exists) {
    const y = new Date().getFullYear();
    await ref.set({
      ...DEFAULT_SYSTEM_SETTINGS,
      currentSchoolYear: `${y}/${y+1}`,
      version: "2.0",
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
  }
}

async function ensureDefaultTemplate() {
  const ref = db.doc("wbs_assessment_templates/standard");
  if (!(await ref.get()).exists) {
    await ref.set({
      name: "Standard-Bewertungsraster",
      description: "Default für alle Themen",
      isDefault: true,
      version: "2.0",
      created_by: "SYSTEM",
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      categories: DEFAULT_ASSESSMENT_CATEGORIES.map(c => ({ id: c.id, name: c.name, weight: 1 }))
    });
  }
}

async function migrateDataStructure() {
  const old = await db.doc("wbs_teachers/teachers_list").get();
  if (old.exists) console.log("Alte Lehrer-Daten vorhanden");
}

export async function checkDatabaseHealth() {
  if (!db) return { status: "offline" };
  const res = { status: "ok", user: auth.currentUser?.email };
  return res;
}
