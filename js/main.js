// js/main.js

import { initDatabase } from "./firebaseClient.js";
import { loadAllTeachers, loadSystemSettings } from "./adminService.js";
import { showLoader, hideLoader, showNotification } from "./uiService.js";
import { initLoginModule, performLogout } from "./modules/loginModule.js";
import { initAdminModule } from "./modules/adminModule.js";
import { initThemeModule } from "./modules/themeModule.js";
import { loadAssessmentTemplates } from "./assessmentService.js";
import { initNewLoginModule as initEnhancedLogin, performEnhancedLogout as performEnhancedLogout } from "./modules/newLoginModule.js";
import { initNewAdminModule as initEnhancedAdmin } from "./modules/newAdminModule.js";

const appConfig = {
  useEnhancedFeatures: true,
  debugMode: false
};

let logoutBtn = null;

document.addEventListener("DOMContentLoaded", async function() {
  showLoader();
  try {
    console.log("Initialisiere Firebase...");
    const ok = await initDatabase();
    console.log("Firebase initialisiert:", ok);
    if (!ok) throw new Error("Datenbank konnte nicht initialisiert werden");

    await loadAllTeachers().catch(() => console.warn("Lehrer laden fehlgeschlagen"));
    await loadSystemSettings().catch(() => console.warn("System-Einstellungen laden fehlgeschlagen"));
    await loadAssessmentTemplates().catch(() => console.warn("Bewertungsraster laden fehlgeschlagen"));

    console.log("Initialisiere Module...");
    if (appConfig.useEnhancedFeatures) {
      try {
        initEnhancedLogin();
        initEnhancedAdmin();
        initAdminModule();
        await initThemeModule();
        console.log("Erweiterte Module initialisiert");
      } catch {
        appConfig.useEnhancedFeatures = false;
        initLoginModule();
        initAdminModule();
        await initThemeModule();
        console.log("Standard-Module initialisiert");
      }
    } else {
      initLoginModule();
      initAdminModule();
      await initThemeModule();
      console.log("Standard-Module initialisiert");
    }

    setupGlobalEventListeners();
    console.log("Initialisierung abgeschlossen");
  } catch (error) {
    console.error("Fehler bei der Initialisierung:", error.message);
    showNotification("Fehler bei der Initialisierung: " + error.message, "error");
  } finally {
    hideLoader();
  }
});

function setupGlobalEventListeners() {
  logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    const clone = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(clone, logoutBtn);
    logoutBtn = clone;
    if (appConfig.useEnhancedFeatures && typeof performEnhancedLogout === "function") {
      logoutBtn.addEventListener("click", performEnhancedLogout);
    } else {
      logoutBtn.addEventListener("click", performLogout);
    }
  }

  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      const pane = document.getElementById(tab.dataset.tab + "-tab");
      if (pane) pane.classList.add("active");
    });
  });

  if (appConfig.useEnhancedFeatures) {
    document.addEventListener("keydown", e => {
      if (e.key === "F12" && e.ctrlKey) {
        e.preventDefault();
        toggleAdminDashboard();
      }
      if (e.ctrlKey && e.altKey && e.key.toLowerCase() === "l") {
        e.preventDefault();
        (typeof performEnhancedLogout === "function" ? performEnhancedLogout : performLogout)();
      }
      if (e.key === "Escape") closeAllModals();
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) checkSystemStatus();
    });

    window.addEventListener("beforeunload", () => cleanup());
    window.addEventListener("error", ev => {
      console.error("Globaler Fehler:", ev.error);
      if (appConfig.debugMode) showNotification("Ein Fehler ist aufgetreten. Siehe Konsole.", "error");
    });
    window.addEventListener("unhandledrejection", ev => {
      console.error("Unbehandelte Promise-Rejection:", ev.reason);
      if (appConfig.debugMode) showNotification("Ein Promise-Fehler ist aufgetreten. Siehe Konsole.", "error");
    });
  }
}

function toggleAdminDashboard() {
  const dash = document.getElementById("systemDashboard");
  if (dash) dash.style.display = dash.style.display === "block" ? "none" : "block";
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach(m => {
    if (m.style.display === "block" || m.style.display === "flex") {
      m.style.display = "none";
    }
  });
}

async function checkSystemStatus() {
  if (appConfig.debugMode) console.log("System-Status wird überprüft");
  const { status, issues } = await (await import("./firebaseClient.js")).checkDatabaseHealth();
  if (appConfig.debugMode) console.log("System-Gesundheit:", status, issues);
}

function cleanup() {
  if (appConfig.debugMode) console.log("Cleanup");
}
