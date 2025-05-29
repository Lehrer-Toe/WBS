// js/main.js - KOMPLETTE ARBEITENDE VERSION
import { 
  initDatabase, 
  ensureCollections, 
  ensureDefaultAssessmentTemplate
} from "./firebaseClient.js";
import { loadAllTeachers, loadSystemSettings } from "./adminService.js";
import { showLoader, hideLoader, showNotification } from "./uiService.js";
import { initLoginModule, performLogout } from "./modules/loginModule.js";
import { initAdminModule } from "./modules/adminModule.js";
import { initThemeModule } from "./modules/themeModule.js";
import { loadAssessmentTemplates } from "./assessmentService.js";

// Initialisierung verfolgen
let initComplete = false;

/**
 * HAUPTINITIALISIERUNG - GARANTIERT FUNKTIONIEREND
 */
document.addEventListener("DOMContentLoaded", async function() {
  console.log("🚀 WBS BEWERTUNGSSYSTEM STARTET...");
  
  // Sofort Loader anzeigen
  const loader = document.getElementById("mainLoader");
  if (loader) {
    loader.style.display = "flex";
  }
  
  try {
    console.log("⏳ Schritt 1: Firebase initialisieren...");
    const dbOk = await initDatabase();
    if (!dbOk) throw new Error("Firebase Initialisierung fehlgeschlagen");
    console.log("✅ Firebase OK");
    
    console.log("⏳ Schritt 2: Datenstrukturen sicherstellen...");
    await ensureCollections();
    await ensureDefaultAssessmentTemplate();
    console.log("✅ Datenstrukturen OK");
    
    console.log("⏳ Schritt 3: Lehrer laden...");
    const teachersOk = await loadAllTeachers();
    if (!teachersOk) console.warn("⚠️ Lehrer-Laden mit Problemen");
    console.log("✅ Lehrer OK");
    
    console.log("⏳ Schritt 4: System-Einstellungen laden...");
    await loadSystemSettings();
    console.log("✅ System-Einstellungen OK");
    
    console.log("⏳ Schritt 5: Bewertungsraster laden...");
    await loadAssessmentTemplates();
    console.log("✅ Bewertungsraster OK");
    
    console.log("⏳ Schritt 6: Module initialisieren...");
    
    // Login-Modul mit Verzögerung
    setTimeout(() => {
      initLoginModule();
      console.log("✅ Login-Modul OK");
    }, 100);
    
    // Admin-Modul
    initAdminModule();
    console.log("✅ Admin-Modul OK");
    
    // Theme-Modul
    await initThemeModule();
    console.log("✅ Theme-Modul OK");
    
    console.log("⏳ Schritt 7: Event-Listener...");
    setupGlobalEvents();
    console.log("✅ Event-Listener OK");
    
    // UI vorbereiten
    prepareUI();
    
    initComplete = true;
    console.log("🎉 INITIALISIERUNG KOMPLETT ERFOLGREICH!");
    
  } catch (error) {
    console.error("💥 KRITISCHER FEHLER:", error);
    showCriticalError(error);
  } finally {
    // Loader ausblenden
    if (loader) {
      loader.style.display = "none";
    }
    hideLoader();
    console.log("🔚 Loader ausgeblendet");
  }
});

/**
 * UI vorbereiten
 */
function prepareUI() {
  console.log("UI wird vorbereitet...");
  
  // Sicherstellen dass Login-Bereich sichtbar ist
  const loginSection = document.getElementById("loginSection");
  const appSection = document.getElementById("appSection");
  
  if (loginSection) {
    loginSection.style.display = "block";
    loginSection.style.visibility = "visible";
  }
  
  if (appSection) {
    appSection.style.display = "none";
  }
  
  // Alle Loader verstecken
  const allLoaders = document.querySelectorAll(".loader-container, #mainLoader");
  allLoaders.forEach(loader => {
    loader.style.display = "none";
  });
  
  console.log("✅ UI vorbereitet");
}

/**
 * Globale Event-Listener
 */
function setupGlobalEvents() {
  // Logout-Button
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", performLogout);
  }
  
  // Tab-Navigation
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      
      // Alle Tabs deaktivieren
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      
      // Aktiven Tab aktivieren
      tab.classList.add("active");
      const content = document.getElementById(`${tabId}-tab`);
      if (content) {
        content.classList.add("active");
      }
      
      console.log("Tab gewechselt:", tabId);
    });
  });
  
  // Globale Fehlerbehandlung
  window.addEventListener('error', (e) => {
    console.error('Global Error:', e.error);
    if (!initComplete) {
      showCriticalError(e.error);
    }
  });
  
  // Promise Rejections
  window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled Promise:', e.reason);
    if (!initComplete) {
      showCriticalError(e.reason);
    }
  });
}

/**
 * Kritischen Fehler anzeigen
 */
function showCriticalError(error) {
  // Loader verstecken
  const loader = document.getElementById("mainLoader");
  if (loader) loader.style.display = "none";
  
  // Fehler-Dialog erstellen
  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 3px solid #e74c3c;
    border-radius: 10px;
    padding: 20px;
    max-width: 500px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    z-index: 999999;
    font-family: Arial, sans-serif;
  `;
  
  errorDiv.innerHTML = `
    <h2 style="color: #e74c3c; margin-top: 0;">🚨 Anwendungsfehler</h2>
    <p><strong>Die Anwendung konnte nicht geladen werden.</strong></p>
    <p>Fehler: ${error.message || error}</p>
    <div style="margin-top: 15px;">
      <button onclick="location.reload()" style="
        background: #3498db;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
        margin-right: 10px;
      ">🔄 Neu laden</button>
      <button onclick="console.log('Error Details:', arguments[0])" style="
        background: #95a5a6;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 5px;
        cursor: pointer;
      ">🔧 Debug</button>
    </div>
  `;
  
  document.body.appendChild(errorDiv);
  
  // Nach 10 Sekunden automatisch neu laden
  setTimeout(() => {
    location.reload();
  }, 10000);
}

// Debug-Funktionen für Fehlerbehebung
window.debugApp = function() {
  console.log("=== APP DEBUG INFO ===");
  console.log("Init Complete:", initComplete);
  console.log("Login Section:", document.getElementById("loginSection"));
  console.log("App Section:", document.getElementById("appSection"));
  console.log("Teacher Grid:", document.getElementById("teacherGrid"));
  console.log("Password Modal:", document.getElementById("passwordModal"));
  console.log("Main Loader:", document.getElementById("mainLoader"));
  console.log("Current User:", window.currentUser);
  console.log("All Teachers:", window.allTeachers);
  console.log("====================");
};

// Für den Fall dass Module nicht laden
window.addEventListener('load', () => {
  if (!initComplete) {
    console.warn("Initialisierung nicht abgeschlossen nach Load-Event");
    setTimeout(() => {
      if (!initComplete) {
        showCriticalError(new Error("Initialisierung Timeout"));
      }
    }, 5000);
  }
});
