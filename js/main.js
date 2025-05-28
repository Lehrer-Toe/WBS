// js/main.js - Korrigierte Version ohne Duplikate
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

// NEUE ERWEITERTE IMPORTS (Umbenennung um Konflikte zu vermeiden)
import { 
  initNewLoginModule as initEnhancedLogin, 
  performEnhancedLogout as performEnhancedLogout 
} from "./modules/newLoginModule.js";
import { initNewAdminModule as initEnhancedAdmin } from "./modules/newAdminModule.js";

// DOM-Elemente
let logoutBtn = null;

// Erweiterte Konfiguration
const appConfig = {
  useEnhancedFeatures: true, // Setzen Sie auf false, um erweiterte Features zu deaktivieren
  debugMode: false
};

// Start
document.addEventListener("DOMContentLoaded", async function() {
  console.log("WBS Bewertungssystem wird initialisiert...");
  showLoader();
  
  try {
    // 1. Firebase initialisieren
    console.log("Initialisiere Firebase...");
    const dbInitialized = await initDatabase();
    console.log("Firebase initialisiert:", dbInitialized);
    
    if (!dbInitialized) {
      throw new Error("Datenbank konnte nicht initialisiert werden");
    }
    
    // 2. Grundlegende Sammlungen und Strukturen sicherstellen
    console.log("Stelle Collections sicher...");
    await ensureCollections();
    console.log("Collections sind bereit");
    
    console.log("Stelle Default Assessment Template sicher...");
    await ensureDefaultAssessmentTemplate();
    console.log("Default Assessment Template ist bereit");
    
    // 3. Lehrer aus Firebase laden
    console.log("Lade Lehrer-Daten...");
    const teachersLoaded = await loadAllTeachers();
    console.log("Lehrer geladen:", teachersLoaded);
    
    // 4. System-Einstellungen laden
    console.log("Lade System-Einstellungen...");
    await loadSystemSettings();
    console.log("System-Einstellungen geladen");
    
    // 5. Bewertungsraster laden
    console.log("Lade Bewertungsraster...");
    await loadAssessmentTemplates();
    console.log("Bewertungsraster geladen");
    
    // 6. Module initialisieren (mit Fallback-Logik)
    console.log("Initialisiere Module...");
    await initializeModules();
    console.log("Module initialisiert");
    
    // 7. Event-Listener einrichten
    console.log("Richte Event-Listener ein...");
    setupGlobalEventListeners();
    console.log("Event-Listener eingerichtet");
    
    console.log("Initialisierung abgeschlossen!");
    
  } catch (error) {
    console.error("Fehler bei der Initialisierung:", error);
    showNotification("Fehler bei der Initialisierung: " + error.message, "error");
    
    // Fallback auf Standard-Module
    try {
      console.log("Versuche Fallback-Initialisierung...");
      await initializeStandardModules();
    } catch (fallbackError) {
      console.error("Auch Fallback-Initialisierung fehlgeschlagen:", fallbackError);
    }
  } finally {
    hideLoader();
  }
});

/**
 * Initialisiert Module mit erweiterten Features (falls aktiviert)
 */
async function initializeModules() {
  if (appConfig.useEnhancedFeatures) {
    try {
      console.log("Initialisiere erweiterte Module...");
      
      // Erweiterte Module initialisieren
      initEnhancedLogin();
      initEnhancedAdmin();
      
      // Standard-Module für Kompatibilität
      initAdminModule();
      await initThemeModule();
      
      console.log("Erweiterte Module erfolgreich initialisiert");
      return true;
    } catch (error) {
      console.warn("Erweiterte Module konnten nicht initialisiert werden:", error);
      console.log("Falle zurück auf Standard-Module...");
      
      // Fallback auf Standard-Module
      appConfig.useEnhancedFeatures = false;
      return await initializeStandardModules();
    }
  } else {
    return await initializeStandardModules();
  }
}

/**
 * Initialisiert Standard-Module (Fallback)
 */
async function initializeStandardModules() {
  console.log("Initialisiere Standard-Module...");
  
  // Standard Login-Modul
  initLoginModule();
  console.log("Standard Login-Modul initialisiert");
  
  // Admin-Modul
  initAdminModule();
  console.log("Admin-Modul initialisiert");
  
  // Themen-Modul
  await initThemeModule();
  console.log("Themen-Modul initialisiert");
  
  return true;
}

/**
 * Richtet globale Event-Listener ein
 */
function setupGlobalEventListeners() {
  // Logout-Button mit erweiterten Features (falls verfügbar)
  logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    // Entferne möglicherweise vorhandene Event-Listener
    const newLogoutBtn = logoutBtn.cloneNode(true);
    logoutBtn.parentNode.replaceChild(newLogoutBtn, logoutBtn);
    logoutBtn = newLogoutBtn;
    
    // Füge entsprechenden Event-Listener hinzu
    if (appConfig.useEnhancedFeatures && typeof performEnhancedLogout === 'function') {
      logoutBtn.addEventListener("click", performEnhancedLogout);
    } else {
      logoutBtn.addEventListener("click", performLogout);
    }
  }
  
  // Tab-Wechsel
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  
  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      const tabId = tab.dataset.tab;
      
      // Tabs deaktivieren
      tabs.forEach(function(t) { t.classList.remove("active"); });
      tabContents.forEach(function(c) { c.classList.remove("active"); });
      
      // Ausgewählten Tab aktivieren
      tab.classList.add("active");
      const tabContent = document.getElementById(`${tabId}-tab`);
      if (tabContent) {
        tabContent.classList.add("active");
      }
    });
  });
  
  // Erweiterte Event-Listener (nur wenn Enhanced Features aktiv sind)
  if (appConfig.useEnhancedFeatures) {
    setupEnhancedEventListeners();
  }
}

/**
 * Richtet erweiterte Event-Listener ein
 */
function setupEnhancedEventListeners() {
  // Keyboard-Shortcuts
  document.addEventListener('keydown', (e) => {
    // F12 für Admin-Dashboard (Strg+F12)
    if (e.key === 'F12' && e.ctrlKey) {
      e.preventDefault();
      toggleAdminDashboard();
    }
    
    // Strg+Alt+L für schnelles Logout
    if (e.ctrlKey && e.altKey && e.key === 'l') {
      e.preventDefault();
      if (typeof performEnhancedLogout === 'function') {
        performEnhancedLogout();
      } else {
        performLogout();
      }
    }
    
    // Escape für Modal schließen
    if (e.key === 'Escape') {
      closeAllModals();
    }
  });
  
  // System-Status-Überwachung
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Seite wieder sichtbar - prüfe System-Status
      checkSystemStatus();
    }
  });
  
  // Cleanup vor dem Schließen
  window.addEventListener('beforeunload', (e) => {
    performCleanup();
  });
  
  // Erweiterte Fehlerbehandlung
  window.addEventListener('error', (event) => {
    console.error('Globaler Fehler:', event.error);
    if (appConfig.debugMode) {
      showNotification('Ein Fehler ist aufgetreten. Siehe Konsole für Details.', 'error');
    }
  });
  
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unbehandelte Promise-Rejection:', event.reason);
    if (appConfig.debugMode) {
      showNotification('Ein Promise-Fehler ist aufgetreten. Siehe Konsole für Details.', 'error');
    }
  });
}

/**
 * Hilfsfunktionen für erweiterte Features
 */
function toggleAdminDashboard() {
  const dashboard = document.getElementById("systemDashboard");
  if (dashboard) {
    if (dashboard.style.display === "none" || !dashboard.style.display) {
      dashboard.style.display = "block";
      console.log("Admin-Dashboard geöffnet");
    } else {
      dashboard.style.display = "none";
      console.log("Admin-Dashboard geschlossen");
    }
  } else {
    console.log("Admin-Dashboard nicht verfügbar");
  }
}

function closeAllModals() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    if (modal.style.display === 'flex' || modal.style.display === 'block') {
      modal.style.display = 'none';
    }
  });
}

function checkSystemStatus() {
  if (appConfig.debugMode) {
    console.log("System-Status wird überprüft...");
  }
  
  // Hier könnte System-Health-Checking implementiert werden
  if (typeof checkDatabaseHealth === 'function') {
    checkDatabaseHealth().then(health => {
      if (appConfig.debugMode) {
        console.log("System-Gesundheit:", health);
      }
    }).catch(error => {
      console.warn("System-Health-Check fehlgeschlagen:", error);
    });
  }
}

function performCleanup() {
  if (appConfig.debugMode) {
    console.log("Cleanup wird durchgeführt...");
  }
  
  // Cleanup-Logik hier implementieren
  // z.B. offene Verbindungen schließen, Timer stoppen, etc.
}

// Debug-Konsole-Befehle (nur im Debug-Modus)
if (appConfig.debugMode) {
  window.WBS_DEBUG = {
    toggleEnhancedFeatures: () => {
      appConfig.useEnhancedFeatures = !appConfig.useEnhancedFeatures;
      console.log("Enhanced Features:", appConfig.useEnhancedFeatures ? "aktiviert" : "deaktiviert");
      location.reload();
    },
    getConfig: () => appConfig,
    checkHealth: checkSystemStatus,
    showDashboard: toggleAdminDashboard
  };
  
  console.log("Debug-Modus aktiv. Verwenden Sie WBS_DEBUG für Debug-Befehle.");
}

console.log("Main.js geladen - Enhanced Features:", appConfig.useEnhancedFeatures);
