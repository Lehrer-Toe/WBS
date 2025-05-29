// js/main.js - Robuste Version mit besserer Fehlerbehandlung
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

// DOM-Elemente
let logoutBtn = null;
let initializationTimeout = null;

// Maximale Zeit für die Initialisierung (30 Sekunden)
const INIT_TIMEOUT = 30000;

// Start
document.addEventListener("DOMContentLoaded", async function() {
  console.log("WBS Bewertungssystem wird initialisiert...");
  
  // Stelle sicher, dass alle Sections initial versteckt sind (außer Login)
  ensureCorrectVisibility();
  
  // Loader anzeigen
  showLoader();
  
  // Timeout für die Initialisierung setzen
  initializationTimeout = setTimeout(() => {
    console.error("Initialisierung dauert zu lange!");
    handleInitializationError(new Error("Initialisierung Timeout - Bitte laden Sie die Seite neu"));
  }, INIT_TIMEOUT);
  
  try {
    // Initialisierung mit Fehlerbehandlung für jeden Schritt
    await performInitialization();
    
    // Timeout löschen, da Initialisierung erfolgreich
    clearTimeout(initializationTimeout);
    
    console.log("Initialisierung erfolgreich abgeschlossen!");
    
  } catch (error) {
    console.error("Fehler bei der Initialisierung:", error);
    handleInitializationError(error);
  } finally {
    // Timeout löschen falls noch aktiv
    if (initializationTimeout) {
      clearTimeout(initializationTimeout);
    }
    
    // Loader in jedem Fall ausblenden
    hideLoader();
    
    // Sicherstellen, dass die Login-Seite sichtbar ist
    const loginSection = document.getElementById("loginSection");
    if (loginSection) {
      loginSection.style.display = "block";
    }
  }
});

/**
 * Führt die eigentliche Initialisierung durch
 */
async function performInitialization() {
  // 1. Firebase initialisieren mit Retry
  console.log("Schritt 1: Firebase initialisieren...");
  const dbInitialized = await initDatabaseWithRetry();
  
  if (!dbInitialized) {
    throw new Error("Datenbank konnte nicht initialisiert werden. Bitte prüfen Sie Ihre Internetverbindung.");
  }
  
  // 2. Grundlegende Sammlungen und Strukturen sicherstellen
  console.log("Schritt 2: Datenbankstruktur prüfen...");
  try {
    await Promise.race([
      ensureCollections(),
      timeout(10000, "Collections-Prüfung")
    ]);
    
    await Promise.race([
      ensureDefaultAssessmentTemplate(),
      timeout(10000, "Assessment-Template-Prüfung")
    ]);
  } catch (error) {
    console.warn("Warnung bei Datenbankstruktur:", error);
    // Nicht kritisch, fortfahren
  }
  
  // 3. Lehrer laden (mit Fallback)
  console.log("Schritt 3: Lehrer-Daten laden...");
  try {
    await Promise.race([
      loadAllTeachers(),
      timeout(10000, "Lehrer laden")
    ]);
  } catch (error) {
    console.warn("Warnung beim Laden der Lehrer:", error);
    // Fallback auf Default-Lehrer wird automatisch verwendet
  }
  
  // 4. System-Einstellungen laden (optional)
  console.log("Schritt 4: System-Einstellungen laden...");
  try {
    await Promise.race([
      loadSystemSettings(),
      timeout(5000, "System-Einstellungen")
    ]);
  } catch (error) {
    console.warn("Warnung beim Laden der System-Einstellungen:", error);
    // Nicht kritisch, fortfahren
  }
  
  // 5. Bewertungsraster laden (optional)
  console.log("Schritt 5: Bewertungsraster laden...");
  try {
    await Promise.race([
      loadAssessmentTemplates(),
      timeout(5000, "Bewertungsraster")
    ]);
  } catch (error) {
    console.warn("Warnung beim Laden der Bewertungsraster:", error);
    // Nicht kritisch, fortfahren
  }
  
  // 6. Module initialisieren (diese sollten immer funktionieren)
  console.log("Schritt 6: Module initialisieren...");
  
  // Login-Modul
  try {
    initLoginModule();
  } catch (error) {
    console.error("Fehler beim Login-Modul:", error);
    throw new Error("Login-Modul konnte nicht initialisiert werden");
  }
  
  // Admin-Modul
  try {
    initAdminModule();
  } catch (error) {
    console.warn("Warnung beim Admin-Modul:", error);
    // Nicht kritisch, fortfahren
  }
  
  // Themen-Modul
  try {
    await initThemeModule();
  } catch (error) {
    console.warn("Warnung beim Themen-Modul:", error);
    // Nicht kritisch, fortfahren
  }
  
  // 7. Event-Listener einrichten
  console.log("Schritt 7: Event-Listener einrichten...");
  setupGlobalEventListeners();
}

/**
 * Initialisiert die Datenbank mit Retry-Mechanismus
 */
async function initDatabaseWithRetry(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Datenbankverbindung Versuch ${i + 1}/${retries}...`);
      
      const result = await Promise.race([
        initDatabase(),
        timeout(10000, "Datenbankverbindung")
      ]);
      
      if (result) {
        return true;
      }
    } catch (error) {
      console.warn(`Versuch ${i + 1} fehlgeschlagen:`, error);
      
      if (i < retries - 1) {
        // Warte kurz vor dem nächsten Versuch
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  return false;
}

/**
 * Timeout-Promise für Race Conditions
 */
function timeout(ms, operation = "Operation") {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`${operation} Timeout nach ${ms}ms`)), ms);
  });
}

/**
 * Behandelt Initialisierungsfehler
 */
function handleInitializationError(error) {
  console.error("Initialisierungsfehler:", error);
  
  // Loader ausblenden
  hideLoader();
  
  // Login-Section anzeigen
  const loginSection = document.getElementById("loginSection");
  if (loginSection) {
    loginSection.style.display = "block";
  }
  
  // Benutzerfreundliche Fehlermeldung
  let message = "Die Anwendung konnte nicht vollständig geladen werden. ";
  
  if (error.message.includes("Timeout") || error.message.includes("timeout")) {
    message += "Die Verbindung ist zu langsam. Bitte laden Sie die Seite neu.";
  } else if (error.message.includes("Datenbank") || error.message.includes("Firebase")) {
    message += "Die Datenbank ist nicht erreichbar. Bitte prüfen Sie Ihre Internetverbindung.";
  } else if (error.message.includes("Login-Modul")) {
    message += "Ein kritischer Fehler ist aufgetreten. Bitte kontaktieren Sie den Administrator.";
  } else {
    message += "Einige Funktionen sind möglicherweise eingeschränkt.";
  }
  
  // Warnung anzeigen, aber App nicht blockieren
  showNotification(message, "warning");
  
  // Zeige einen Reload-Button
  createReloadButton();
}

/**
 * Erstellt einen Reload-Button bei Fehlern
 */
function createReloadButton() {
  // Prüfe ob bereits ein Reload-Button existiert
  if (document.getElementById("reloadButton")) return;
  
  const container = document.querySelector(".container");
  if (!container) return;
  
  const reloadDiv = document.createElement("div");
  reloadDiv.id = "reloadButton";
  reloadDiv.style.cssText = `
    text-align: center;
    padding: 20px;
    background-color: #fff3cd;
    border: 1px solid #ffeaa7;
    border-radius: 8px;
    margin: 20px auto;
    max-width: 500px;
  `;
  
  reloadDiv.innerHTML = `
    <p style="color: #856404; margin-bottom: 15px;">
      Die Anwendung konnte nicht vollständig geladen werden.
    </p>
    <button onclick="window.location.reload()" style="
      background-color: #ffc107;
      color: #212529;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    ">
      Seite neu laden
    </button>
  `;
  
  container.insertBefore(reloadDiv, container.firstChild);
}

/**
 * Stellt sicher, dass die richtigen Sections sichtbar sind
 */
function ensureCorrectVisibility() {
  const sections = {
    login: document.getElementById("loginSection"),
    adminLogin: document.getElementById("adminLoginSection"),
    admin: document.getElementById("adminSection"),
    app: document.getElementById("appSection")
  };
  
  // Alle außer Login verstecken
  if (sections.adminLogin) sections.adminLogin.style.display = "none";
  if (sections.admin) sections.admin.style.display = "none";
  if (sections.app) sections.app.style.display = "none";
  
  // Login-Section sichtbar machen
  if (sections.login) sections.login.style.display = "block";
}

/**
 * Richtet globale Event-Listener ein
 */
function setupGlobalEventListeners() {
  // Logout-Button
  logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", performLogout);
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
  
  // Netzwerk-Status überwachen
  window.addEventListener('online', () => {
    showNotification('Internetverbindung wiederhergestellt', 'success');
  });
  
  window.addEventListener('offline', () => {
    showNotification('Keine Internetverbindung', 'warning');
  });
}
