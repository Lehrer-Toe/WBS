// js/main.js

import { 
  initDatabase, 
  ensureCollections, 
  ensureDefaultAssessmentTemplate, 
  checkDatabaseHealth 
} from "./firebaseClient.js";
import { loadAllTeachers, loadSystemSettings } from "./adminService.js";
import { showLoader, hideLoader, showNotification } from "./uiService.js";
import { initLoginModule, performLogout } from "./modules/loginModule.js";
import { initAdminModule } from "./modules/adminModule.js";
import { initThemeModule } from "./modules/themeModule.js";
import { loadAssessmentTemplates } from "./assessmentService.js";
import { 
  initNewLoginModule as initEnhancedLogin, 
  performEnhancedLogout as performEnhancedLogout 
} from "./modules/newLoginModule.js";
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
    const dbInitialized = await initDatabase();
    console.log("Firebase initialisiert:", dbInitialized);
    if (!dbInitialized) throw new Error("Datenbank konnte nicht initialisiert werden");

    console.log("Stelle Collections sicher...");
    await ensureCollections();
    console.log("Collections sind bereit");

    console.log("Stelle Default Assessment Template sicher...");
    await ensureDefaultAssessmentTemplate();
    console.log("Default Assessment Template ist bereit");

    console.log("Lade Lehrer-Daten...");
    const teachersLoaded = await loadAllTeachers();
    console.log("Lehrer geladen:", teachersLoaded);

    console.log("Lade System-Einstellungen...");
    await loadSystemSettings();
    console.log("System-Einstellungen geladen");

    console.log("Lade Bewertungsraster...");
    await loadAssessmentTemplates();
    console.log("Bewertungsraster geladen");

    console.log("Initialisiere Module...");
    await initializeModules();
    console.log("Module initialisiert");

    console.log("Richte Event-Listener ein...");
    setupGlobalEventListeners();
    console.log("Event-Listener eingerichtet");

    console.log("Initialisierung abgeschlossen!");
  } catch (error) {
    console.error("Fehler bei der Initialisierung:", error);
    showNotification("Fehler bei der Initialisierung: " + error.message, "error");
    try {
      console.log("Versuche Fallback-Initialisierung...");
      await initializeStandardModules();
    } catch (fallbackError) {
      console.error("Fallback-Initialisierung fehlgeschlagen:", fallbackError);
    }
  } finally {
    hideLoader();
  }
});

async function initializeModules() {
  if (appConfig.useEnhancedFeatures) {
    try {
      console.log("Initialisiere erweiterte Module...");
      initEnhancedLogin();
      initEnhancedAdmin();
      initAdminModule();
      await initThemeModule();
      console.log("Erweiterte Module erfolgreich initialisiert");
      return true;
    } catch (error) {
      console.warn("Erweiterte Module konnten nicht initialisiert werden:", error);
      console.log("Falle zurück auf Standard-Module...");
      appConfig.useEnhancedFeatures = false;
      return await initializeStandardModules();
    }
  } else {
    return await initializeStandardModules();
  }
}

async function initializeStandardModules() {
  console.log("Initialisiere Standard-Module...");
  initLoginModule();
  console.log("Standard Login-Modul initialisiert");
  initAdminModule();
  console.log("Admin-Modul initialisiert");
  await initThemeModule();
  console.log("Themen-Modul initialisiert");
  return true;
}

function setupGlobalEventListeners() {
  logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    logoutBtn = newLogoutBtn;
    if (appConfig.useEnhancedFeatures && typeof performEnhancedLogout === 'function') {
      logoutBtn.addEventListener("click", performEnhancedLogout);
    } else {
      logoutBtn.addEventListener("click", performLogout);
    }
  }

  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      const tabId = tab.dataset.tab;
      tabs.forEach(function(t) { t.classList.remove("active"); });
      tabContents.forEach(function(c) { c.classList.remove("active"); });
      tab.classList.add("active");
      const tabContent = document.getElementById(`${tabId}-tab`);
      if (tabContent) tabContent.classList.add("active");
    });
  });

  if (appConfig.useEnhancedFeatures) {
    setupEnhancedEventListeners();
  }
}

function setupEnhancedEventListeners() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'F12' && e.ctrlKey) {
      e.preventDefault();
      toggleAdminDashboard();
    }
    if (e.ctrlKey && e.altKey && e.key === 'l') {
      e.preventDefault();
      if (typeof performEnhancedLogout === 'function') performEnhancedLogout();
      else performLogout();
    }
    if (e.key === 'Escape') closeAllModals();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) checkSystemStatus();
  });

  window.addEventListener('beforeunload', () => performCleanup());

  window.addEventListener('error', (event) => {
    console.error('Globaler Fehler:', event.error);
    if (appConfig.debugMode) showNotification('Ein Fehler ist aufgetreten. Siehe Konsole für Details.', 'error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unbehandelte Promise-Rejection:', event.reason);
    if (appConfig.debugMode) showNotification('Ein Promise-Fehler ist aufgetreten. Siehe Konsole für Details.', 'error');
  });
}

function toggleAdminDashboard() {
  const dashboard = document.getElementById("systemDashboard");
  if (dashboard) {
    dashboard.style.display = dashboard.style.display === "block" ? "none" : "block";
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal').forEach(modal => {
    if (modal.style.display === 'block' || modal.style.display === 'flex') {
      modal.style.display = 'none';
    }
  });
}

function checkSystemStatus() {
  if (appConfig.debugMode) console.log("System-Status wird überprüft...");
  if (typeof checkDatabaseHealth === 'function') {
    checkDatabaseHealth().then(health => {
      if (appConfig.debugMode) console.log("System-Gesundheit:", health);
    }).catch(error => {
      console.warn("System-Health-Check fehlgeschlagen:", error);
    });
  }
}

function performCleanup() {
  if (appConfig.debugMode) console.log("Cleanup wird durchgeführt...");
}

// Debug-Kommandos
if (appConfig.debugMode) {
  window.WBS_DEBUG = {
    toggleEnhancedFeatures: () => {
      appConfig.useEnhancedFeatures = !appConfig.useEnhancedFeatures;
      console.log("Enhanced Features:", appConfig.useEnhancedFeatures);
      location.reload();
    },
    getConfig: () => appConfig,
    checkHealth: checkSystemStatus,
    showDashboard: toggleAdminDashboard
  };
  console.log("Debug-Modus aktiv. Verwenden Sie WBS_DEBUG für Debug-Kommandos.");
}

console.log("Main.js geladen – Enhanced Features:", appConfig.useEnhancedFeatures);
