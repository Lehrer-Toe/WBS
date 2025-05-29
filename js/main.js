// js/main.js - REPARIERTE VERSION
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
let initializationComplete = false;

// Start
document.addEventListener("DOMContentLoaded", async function() {
  console.log("WBS Bewertungssystem wird initialisiert...");
  
  // Loader sofort anzeigen
  forceShowLoader();
  
  try {
    // Schritt 1: Firebase initialisieren
    console.log("Schritt 1: Firebase initialisieren...");
    const dbInitialized = await initDatabase();
    
    if (!dbInitialized) {
      throw new Error("Datenbank konnte nicht initialisiert werden");
    }
    console.log("✓ Firebase erfolgreich initialisiert");
    
    // Schritt 2: Datenbankstruktur prüfen
    console.log("Schritt 2: Datenbankstruktur prüfen...");
    await ensureCollections();
    await ensureDefaultAssessmentTemplate();
    console.log("✓ Datenbankstruktur ist bereit");
    
    // Schritt 3: Lehrer-Daten laden
    console.log("Schritt 3: Lehrer-Daten laden...");
    const teachersLoaded = await loadAllTeachers();
    
    if (!teachersLoaded) {
      console.warn("Lehrer konnten nicht geladen werden, verwende Fallback");
    }
    console.log("✓ Lehrer-Daten geladen");
    
    // Schritt 4: System-Einstellungen laden
    console.log("Schritt 4: System-Einstellungen laden...");
    await loadSystemSettings();
    console.log("✓ System-Einstellungen geladen");
    
    // Schritt 5: Bewertungsraster laden
    console.log("Schritt 5: Bewertungsraster laden...");
    await loadAssessmentTemplates();
    console.log("✓ Bewertungsraster geladen");
    
    // Schritt 6: Module initialisieren
    console.log("Schritt 6: Module initialisieren...");
    
    // Login-Modul zuerst
    initLoginModule();
    console.log("✓ Login-Modul initialisiert");
    
    // Admin-Modul
    initAdminModule();
    console.log("✓ Admin-Modul initialisiert");
    
    // Themen-Modul
    await initThemeModule();
    console.log("✓ Themen-Modul initialisiert");
    
    // Schritt 7: Event-Listener einrichten
    console.log("Schritt 7: Event-Listener einrichten...");
    setupGlobalEventListeners();
    console.log("✓ Event-Listener eingerichtet");
    
    // Schritt 8: Finalisierung
    console.log("Initialisierung erfolgreich abgeschlossen!");
    initializationComplete = true;
    
    // Sicherstellen dass Login-Bereich sichtbar ist
    ensureLoginSectionVisible();
    
  } catch (error) {
    console.error("FEHLER bei der Initialisierung:", error);
    showNotification("Fehler bei der Initialisierung: " + error.message, "error");
    
    // Zeige Fehler-Nachricht im Login-Bereich
    showInitializationError(error);
    
  } finally {
    // Loader immer ausblenden
    forceHideLoader();
    console.log("Loader final ausgeblendet");
  }
});

/**
 * Erzwingt das Anzeigen des Loaders
 */
function forceShowLoader() {
  const mainLoader = document.getElementById("mainLoader");
  if (mainLoader) {
    mainLoader.style.display = "flex";
    mainLoader.style.position = "fixed";
    mainLoader.style.top = "0";
    mainLoader.style.left = "0";
    mainLoader.style.width = "100%";
    mainLoader.style.height = "100%";
    mainLoader.style.zIndex = "9999";
    console.log("Loader erzwungen angezeigt");
  }
}

/**
 * Erzwingt das Ausblenden des Loaders
 */
function forceHideLoader() {
  const mainLoader = document.getElementById("mainLoader");
  if (mainLoader) {
    mainLoader.style.display = "none";
    console.log("Loader erzwungen ausgeblendet");
  }
  
  // Zusätzlich die normale hideLoader-Funktion aufrufen
  try {
    hideLoader();
  } catch (error) {
    console.warn("hideLoader() Fehler (ignoriert):", error);
  }
}

/**
 * Stellt sicher, dass der Login-Bereich sichtbar ist
 */
function ensureLoginSectionVisible() {
  const loginSection = document.getElementById("loginSection");
  const appSection = document.getElementById("appSection");
  
  if (loginSection) {
    loginSection.style.display = "block";
    console.log("Login-Bereich sichtbar gemacht");
  }
  
  if (appSection) {
    appSection.style.display = "none";
    console.log("App-Bereich ausgeblendet");
  }
}

/**
 * Zeigt einen Initialisierungsfehler an
 */
function showInitializationError(error) {
  const loginSection = document.getElementById("loginSection");
  if (!loginSection) return;
  
  // Erstelle Fehler-Nachricht
  const errorDiv = document.createElement("div");
  errorDiv.className = "initialization-error";
  errorDiv.innerHTML = `
    <div class="error-container">
      <h3>🚨 Initialisierungsfehler</h3>
      <p><strong>Die Anwendung konnte nicht vollständig geladen werden.</strong></p>
      <p>Fehler: ${error.message}</p>
      <div class="error-actions">
        <button onclick="location.reload()" class="btn-primary">
          🔄 Seite neu laden
        </button>
        <button onclick="window.debugLoginModule?.()" class="btn-secondary">
          🔧 Debug-Info
        </button>
      </div>
      <details class="error-details">
        <summary>Technische Details</summary>
        <pre>${error.stack || error.toString()}</pre>
      </details>
    </div>
  `;
  
  // Style hinzufügen
  const style = document.createElement("style");
  style.textContent = `
    .initialization-error {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      border: 2px solid #e74c3c;
      border-radius: 10px;
      padding: 20px;
      max-width: 500px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
    }
    .error-container h3 {
      color: #e74c3c;
      margin-top: 0;
    }
    .error-actions {
      margin: 15px 0;
      display: flex;
      gap: 10px;
    }
    .error-details {
      margin-top: 15px;
    }
    .error-details pre {
      background: #f8f9fa;
      padding: 10px;
      border-radius: 5px;
      overflow: auto;
      max-height: 200px;
      font-size: 12px;
    }
  `;
  
  document.head.appendChild(style);
  document.body.appendChild(errorDiv);
}

/**
 * Richtet globale Event-Listener ein
 */
function setupGlobalEventListeners() {
  // Logout-Button
  logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", performLogout);
    console.log("Logout-Button Event-Listener hinzugefügt");
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
        
        // Event für Tab-Wechsel auslösen
        document.dispatchEvent(new CustomEvent("tabChanged", { 
          detail: { tabId } 
        }));
      }
      
      console.log("Tab gewechselt zu:", tabId);
    });
  });
  
  console.log(`${tabs.length} Tab Event-Listener hinzugefügt`);
  
  // Global Error Handler
  window.addEventListener('error', function(e) {
    console.error('Global Error:', e.error);
    if (!initializationComplete) {
      showNotification("Ein unerwarteter Fehler ist aufgetreten.", "error");
    }
  });
  
  // Promise Rejection Handler
  window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled Promise Rejection:', e.reason);
    if (!initializationComplete) {
      showNotification("Ein Datenfehler ist aufgetreten.", "error");
    }
  });
}

/**
 * Debug-Funktion
 */
window.debugMainModule = function() {
  console.log("=== MAIN MODULE DEBUG ===");
  console.log("Initialization Complete:", initializationComplete);
  console.log("Login Section:", document.getElementById("loginSection"));
  console.log("App Section:", document.getElementById("appSection"));
  console.log("Teacher Grid:", document.getElementById("teacherGrid"));
  console.log("Main Loader:", document.getElementById("mainLoader"));
  console.log("Logout Button:", logoutBtn);
  console.log("========================");
};
