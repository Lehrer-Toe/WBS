// js/main.js - REPARIERTE VERSION MIT ORDNUNGSGEMÄSSER LOADER-VERWALTUNG
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

// Globale Variablen
let initComplete = false;
let loaderElement = null;

/**
 * HAUPTINITIALISIERUNG - MIT ORDNUNGSGEMÄSSER LOADER-VERWALTUNG
 */
document.addEventListener("DOMContentLoaded", async function() {
  console.log("🚀 WBS BEWERTUNGSSYSTEM STARTET...");
  
  // Loader-Element referenzieren
  loaderElement = document.getElementById("mainLoader");
  
  // Loader sofort anzeigen
  showMainLoader();
  
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
    
    // Login-Modul (E-Mail-basiert)
    initLoginModule();
    console.log("✅ E-Mail-Login-Modul OK");
    
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
    prepareLoginUI();
    
    // Initialisierung als abgeschlossen markieren
    initComplete = true;
    console.log("🎉 INITIALISIERUNG KOMPLETT ERFOLGREICH!");
    
  } catch (error) {
    console.error("💥 KRITISCHER INITIALISIERUNGSFEHLER:", error);
    showCriticalError(error);
  } finally {
    // Loader IMMER ausblenden
    hideMainLoader();
    console.log("🔚 Hauptloader endgültig ausgeblendet");
  }
});

/**
 * Zeigt den Hauptloader an
 */
function showMainLoader() {
  if (loaderElement) {
    loaderElement.style.display = "flex";
    loaderElement.style.position = "fixed";
    loaderElement.style.top = "0";
    loaderElement.style.left = "0";
    loaderElement.style.width = "100%";
    loaderElement.style.height = "100%";
    loaderElement.style.zIndex = "9999";
    loaderElement.style.backgroundColor = "rgba(255,255,255,0.9)";
  }
  console.log("📍 Hauptloader angezeigt");
}

/**
 * Versteckt den Hauptloader GARANTIERT
 */
function hideMainLoader() {
  // Alle möglichen Loader verstecken
  const allLoaders = [
    document.getElementById("mainLoader"),
    ...document.querySelectorAll(".loader-container"),
    ...document.querySelectorAll(".loader")
  ];
  
  allLoaders.forEach(loader => {
    if (loader) {
      loader.style.display = "none";
      loader.style.visibility = "hidden";
    }
  });
  
  // Zusätzlich über uiService
  try {
    hideLoader();
  } catch (e) {
    console.warn("hideLoader() Fehler (ignoriert):", e);
  }
  
  console.log("🔒 ALLE Loader ausgeblendet");
}

/**
 * Bereitet die Login-UI vor
 */
function prepareLoginUI() {
  console.log("🎨 Bereite Login-UI vor...");
  
  // Login-Bereich sichtbar machen
  const loginSection = document.getElementById("loginSection");
  if (loginSection) {
    loginSection.style.display = "block";
    loginSection.style.visibility = "visible";
  }
  
  // App-Bereich verstecken
  const appSection = document.getElementById("appSection");
  if (appSection) {
    appSection.style.display = "none";
  }
  
  // Alle Loader verstecken
  hideMainLoader();
  
  console.log("✅ Login-UI vorbereitet");
}

/**
 * Setup globale Event-Listener
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
      
      console.log("📑 Tab gewechselt:", tabId);
    });
  });
  
  // Login-Erfolg Event
  document.addEventListener("userLoggedIn", () => {
    console.log("👤 Benutzer erfolgreich angemeldet - verstecke alle Loader");
    hideMainLoader();
  });
  
  // Globale Fehlerbehandlung
  window.addEventListener('error', (e) => {
    console.error('🚨 Global Error:', e.error);
    if (!initComplete) {
      showCriticalError(e.error);
    }
  });
  
  window.addEventListener('unhandledrejection', (e) => {
    console.error('🚨 Unhandled Promise:', e.reason);
    if (!initComplete) {
      showCriticalError(e.reason);
    }
  });
}

/**
 * Zeigt kritischen Fehler an
 */
function showCriticalError(error) {
  // Loader verstecken
  hideMainLoader();
  
  // Fehler-Dialog erstellen
  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 3px solid #e74c3c;
    border-radius: 15px;
    padding: 30px;
    max-width: 500px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 999999;
    font-family: Arial, sans-serif;
    text-align: center;
  `;
  
  errorDiv.innerHTML = `
    <h2 style="color: #e74c3c; margin-top: 0;">🚨 Anwendungsfehler</h2>
    <p style="margin: 15px 0;"><strong>Die Anwendung konnte nicht vollständig geladen werden.</strong></p>
    <p style="margin: 15px 0; color: #666;">Fehler: ${error.message || error}</p>
    <div style="margin-top: 25px;">
      <button onclick="location.reload()" style="
        background: #3498db;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        margin-right: 10px;
        font-size: 14px;
        font-weight: 600;
      ">🔄 Seite neu laden</button>
      <button onclick="console.log('Fehlerdetails:', arguments[0])" style="
        background: #95a5a6;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
      ">🔧 Debug-Info</button>
    </div>
    <div style="margin-top: 15px; font-size: 12px; color: #999;">
      Automatischer Neustart in <span id="countdown">10</span> Sekunden...
    </div>
  `;
  
  document.body.appendChild(errorDiv);
  
  // Countdown für automatischen Neustart
  let countdown = 10;
  const countdownElement = errorDiv.querySelector('#countdown');
  const countdownInterval = setInterval(() => {
    countdown--;
    if (countdownElement) countdownElement.textContent = countdown;
    if (countdown <= 0) {
      clearInterval(countdownInterval);
      location.reload();
    }
  }, 1000);
}

// Debug-Funktionen
window.debugApp = function() {
  console.log("=== 🔧 APP DEBUG INFO ===");
  console.log("Init Complete:", initComplete);
  console.log("Login Section:", !!document.getElementById("loginSection"));
  console.log("App Section:", !!document.getElementById("appSection"));
  console.log("Main Loader:", !!document.getElementById("mainLoader"));
  console.log("Email Login Form:", !!document.getElementById("emailLoginForm"));
  console.log("Current User:", window.currentUser || "Nicht verfügbar");
  console.log("All Teachers:", window.allTeachers ? window.allTeachers.length : "Nicht verfügbar");
  console.log("========================");
};

// Notfall-Loader-Versteckung nach dem Laden
window.addEventListener('load', () => {
  // Nach 2 Sekunden alle Loader verstecken
  setTimeout(() => {
    hideMainLoader();
    console.log("🔧 Notfall-Loader-Versteckung ausgeführt");
  }, 2000);
  
  // Warnung bei unvollständiger Initialisierung
  if (!initComplete) {
    setTimeout(() => {
      if (!initComplete) {
        console.warn("⚠️ Initialisierung noch nicht abgeschlossen nach Load-Event");
        showCriticalError(new Error("Initialisierung Timeout - Seite wird neu geladen"));
      }
    }, 5000);
  }
});
