// js/main.js

/* ------------------------------------------------------------------ */
/*  Imports                                                           */
/* ------------------------------------------------------------------ */
import { initDatabase, checkDatabaseHealth } from "./firebaseClient.js";
import { loadAllTeachers, loadSystemSettings } from "./adminService.js";
import { loadAssessmentTemplates } from "./assessmentService.js";
import { showLoader, hideLoader, showNotification } from "./uiService.js";

import { initLoginModule, performLogout } from "./modules/loginModule.js";
import { initAdminModule } from "./modules/adminModule.js";
import { initThemeModule } from "./modules/themeModule.js";

import {
  initNewLoginModule as initEnhancedLogin,
  performEnhancedLogout
} from "./modules/newLoginModule.js";
import { initNewAdminModule as initEnhancedAdmin } from "./modules/newAdminModule.js";

/* ------------------------------------------------------------------ */
/*  Globale Konfiguration                                             */
/* ------------------------------------------------------------------ */
const appConfig = {
  useEnhancedFeatures: true,
  debugMode: false
};

let logoutBtn = null; // wird später ersetzt

/* ------------------------------------------------------------------ */
/*  DOM-Start                                                         */
/* ------------------------------------------------------------------ */
document.addEventListener("DOMContentLoaded", async () => {
  showLoader();
  try {
    /* ---------- Firebase ---------- */
    console.log("Initialisiere Firebase …");
    const ok = await initDatabase();
    if (!ok) throw new Error("Datenbank konnte nicht initialisiert werden");

    /* ---------- Basisdaten ---------- */
    await loadAllTeachers().catch(() =>
      console.warn("Lehrer konnten nicht geladen werden"));
    await loadSystemSettings().catch(() =>
      console.warn("System-Einstellungen konnten nicht geladen werden"));
    await loadAssessmentTemplates().catch(() =>
      console.warn("Bewertungsraster konnten nicht geladen werden"));

    /* ---------- Module ---------- */
    await initializeModules();

    /* ---------- Event-Listener ---------- */
    setupGlobalEventListeners();

    console.log("Initialisierung abgeschlossen");
  } catch (err) {
    console.error("Fehler bei der Initialisierung:", err.message);
    showNotification("Fehler bei der Initialisierung: " + err.message, "error");
  } finally {
    hideLoader();
  }
});

/* ------------------------------------------------------------------ */
/*  Modul-Initialisierung                                             */
/* ------------------------------------------------------------------ */
async function initializeModules() {
  if (appConfig.useEnhancedFeatures) {
    try {
      initEnhancedLogin();
      initEnhancedAdmin();
      initAdminModule();
      await initThemeModule();
      console.log("Erweiterte Module initialisiert");
      return;
    } catch (e) {
      console.warn("Erweiterte Module fehlgeschlagen:", e.message);
      appConfig.useEnhancedFeatures = false;
    }
  }

  /* Fallback auf Standard-Module */
  initLoginModule();
  initAdminModule();
  await initThemeModule();
  console.log("Standard-Module initialisiert");
}

/* ------------------------------------------------------------------ */
/*  Event-Listener                                                    */
/* ------------------------------------------------------------------ */
function setupGlobalEventListeners() {
  /* Logout-Button neu verdrahten */
  logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    const clone = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(clone, logoutBtn);
    logoutBtn = clone;

    const handler = appConfig.useEnhancedFeatures &&
                    typeof performEnhancedLogout === "function"
                  ? performEnhancedLogout
                  : performLogout;
    logoutBtn.addEventListener("click", handler);
  }

  /* Tab-Navigation */
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      const pane = document.getElementById(`${tab.dataset.tab}-tab`);
      if (pane) pane.classList.add("active");
    });
  });

  /* Tastatur-Shortcuts & Sichtbarkeitswechsel nur bei erweiterten Features */
  if (appConfig.useEnhancedFeatures) addEnhancedListeners();
}

/* ------------------------------------------------------------------ */
/*  Erweiterte Listener                                               */
/* ------------------------------------------------------------------ */
function addEnhancedListeners() {
  /* Shortcuts */
  document.addEventListener("keydown", e => {
    if (e.ctrlKey && e.key === "F12") {
      e.preventDefault();
      toggleAdminDashboard();
    }
    if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "l") {
      e.preventDefault();
      (typeof performEnhancedLogout === "function" ? performEnhancedLogout : performLogout)();
    }
    if (e.key === "Escape") closeAllModals();
  });

  /* Sichtbarkeit */
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) checkSystemStatus();
  });

  /* Cleanup & Fehler */
  window.addEventListener("beforeunload", cleanup);
  window.addEventListener("error",  ev => console.error("Globaler Fehler:", ev.error));
  window.addEventListener("unhandledrejection", ev =>
    console.error("Unbehandelte Promise-Rejection:", ev.reason));
}

/* ------------------------------------------------------------------ */
/*  Hilfsfunktionen                                                   */
/* ------------------------------------------------------------------ */
function toggleAdminDashboard() {
  const dash = document.getElementById("systemDashboard");
  if (dash) dash.style.display = dash.style.display === "block" ? "none" : "block";
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach(m => {
    if (m.style.display === "flex" || m.style.display === "block") m.style.display = "none";
  });
}

async function checkSystemStatus() {
  if (!appConfig.debugMode) return;
  const health = await checkDatabaseHealth();
  console.log("System-Gesundheit:", health);
}

function cleanup() {
  if (appConfig.debugMode) console.log("Cleanup vor Seitenwechsel");
}

/* ------------------------------------------------------------------ */
/*  Debug-Konsole (optional)                                          */
/* ------------------------------------------------------------------ */
if (appConfig.debugMode) {
  window.WBS_DEBUG = {
    toggleFeatures: () => { appConfig.useEnhancedFeatures = !appConfig.useEnhancedFeatures; location.reload(); },
    checkHealth   : checkSystemStatus
  };
  console.log("Debug-Modus aktiv (WBS_DEBUG verfügbar)");
}
