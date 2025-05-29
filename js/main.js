// js/main.js - With ultimate loader solution and debugging output
import { 
  initDatabase, 
  ensureCollections, 
  ensureDefaultAssessmentTemplate, 
  checkDatabaseHealth
} from "./firebaseClient.js";
import { loadAllTeachers, loadSystemSettings } from "./adminService.js";
import { showLoader, hideLoader, showNotification, forceShowAppSections } from "./uiService.js";
import { initLoginModule, performLogout } from "./modules/loginModule.js";
import { initAdminModule } from "./modules/adminModule.js";
import { initThemeModule } from "./modules/themeModule.js";
import { loadAssessmentTemplates } from "./assessmentService.js";

// DOM-Elemente
let logoutBtn = null;

// Start
document.addEventListener("DOMContentLoaded", async function() {
  console.log("🚀 WBS Bewertungssystem wird initialisiert...");
  showLoader();
  
  try {
    // DEBUGGING: Force loader to be visible initially
    document.getElementById("mainLoader").style.display = "flex";
    console.log("🔄 Loader initial sichtbar gemacht");
    
    // 1. Firebase initialisieren
    console.log("🔥 Initialisiere Firebase...");
    const dbInitialized = await initDatabase();
    console.log("🔥 Firebase initialisiert:", dbInitialized);
    
    if (!dbInitialized) {
      throw new Error("Datenbank konnte nicht initialisiert werden");
    }
    
    // 2. Grundlegende Sammlungen und Strukturen sicherstellen
    console.log("📚 Stelle Collections sicher...");
    await ensureCollections();
    console.log("📚 Collections sind bereit");
    
    console.log("📋 Stelle Default Assessment Template sicher...");
    await ensureDefaultAssessmentTemplate();
    console.log("📋 Default Assessment Template ist bereit");
    
    // 3. Lehrer aus Firebase laden
    console.log("👥 Lade Lehrer-Daten...");
    const teachersLoaded = await loadAllTeachers();
    console.log("👥 Lehrer geladen:", teachersLoaded);
    
    // 4. System-Einstellungen laden
    console.log("⚙️ Lade System-Einstellungen...");
    await loadSystemSettings();
    console.log("⚙️ System-Einstellungen geladen");
    
    // 5. Bewertungsraster laden
    console.log("📊 Lade Bewertungsraster...");
    await loadAssessmentTemplates();
    console.log("📊 Bewertungsraster geladen");
    
    // 6. Lehrer-Grid für Anmeldung initialisieren
    console.log("🔐 Initialisiere Login-Modul...");
    initLoginModule();
    console.log("🔐 Login-Modul initialisiert");
    
    // 7. Admin-Modul initialisieren
    console.log("👑 Initialisiere Admin-Modul...");
    initAdminModule();
    console.log("👑 Admin-Modul initialisiert");
    
    // 8. Themen-Modul initialisieren
    console.log("📝 Initialisiere Themen-Modul...");
    await initThemeModule();
    console.log("📝 Themen-Modul initialisiert");
    
    // 9. Event-Listener einrichten
    console.log("🎧 Richte Event-Listener ein...");
    setupGlobalEventListeners();
    console.log("🎧 Event-Listener eingerichtet");
    
    console.log("✅ Initialisierung erfolgreich abgeschlossen!");
    
    // ULTIMATE LOADER HIDE SEQUENCE
    console.log("🚫 Starte Ultimate Loader Hide Sequence...");
    hideLoader();
    forceShowAppSections();
    console.log("🚫 Ultimate Loader Hide Sequence abgeschlossen!");
    
  } catch (error) {
    console.error("❌ Fehler bei der Initialisierung:", error);
    showNotification("Fehler bei der Initialisierung: " + error.message, "error");
    
    // ULTIMATE LOADER HIDE - Auch bei Fehlern
    console.log("🚫 Verstecke Loader nach Fehler...");
    hideLoader();
    forceShowAppSections();
    console.log("🚫 Loader nach Fehler ausgeblendet");
    
  } finally {
    // ULTIMATE LOADER HIDE - Final Fallback
    console.log("🚫 Final Loader Hide (Finally Block)...");
    hideLoader();
    forceShowAppSections();
    
    // DEBUGGING: Triple-check with direct DOM manipulation
    setTimeout(() => {
      console.log("🔍 Triple-Check: Direkter DOM-Zugriff...");
      const mainLoader = document.getElementById("mainLoader");
      if (mainLoader) {
        mainLoader.style.display = "none";
        mainLoader.style.visibility = "hidden";
        mainLoader.style.opacity = "0";
        mainLoader.style.zIndex = "-9999";
        console.log("🔍 Triple-Check: Loader direkt manipuliert");
      }
      
      // Sicherstelle, dass Login-Bereich sichtbar ist
      const loginSection = document.getElementById("loginSection");
      if (loginSection) {
        loginSection.style.display = "block";
        loginSection.style.visibility = "visible";
        loginSection.style.opacity = "1";
        console.log("🔍 Triple-Check: Login-Bereich sichtbar gemacht");
      }
      
      console.log("🏁 FINALE: App-Initialisierung vollständig abgeschlossen!");
    }, 100);
  }
});

/**
 * Richtet globale Event-Listener ein
 */
function setupGlobalEventListeners() {
  console.log("🎧 Richte globale Event-Listener ein...");
  
  // Logout-Button
  logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", performLogout);
    console.log("🎧 Logout-Button Event-Listener hinzugefügt");
  }
  
  // Tab-Wechsel
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  
  console.log(`🎧 Gefundene Tabs: ${tabs.length}, Tab-Contents: ${tabContents.length}`);
  
  tabs.forEach(function(tab, index) {
    tab.addEventListener("click", function() {
      const tabId = tab.dataset.tab;
      console.log(`🎧 Tab-Wechsel zu: ${tabId}`);
      
      // Tabs deaktivieren
      tabs.forEach(function(t) { t.classList.remove("active"); });
      tabContents.forEach(function(c) { c.classList.remove("active"); });
      
      // Ausgewählten Tab aktivieren
      tab.classList.add("active");
      const tabContent = document.getElementById(`${tabId}-tab`);
      if (tabContent) {
        tabContent.classList.add("active");
        console.log(`🎧 Tab-Content aktiviert: ${tabId}-tab`);
      } else {
        console.warn(`🎧 Tab-Content nicht gefunden: ${tabId}-tab`);
      }
      
      // Custom Event für Tab-Wechsel
      document.dispatchEvent(new CustomEvent("tabChanged", { 
        detail: { tabId, tabElement: tab } 
      }));
    });
    
    console.log(`🎧 Event-Listener für Tab ${index + 1} hinzugefügt: ${tab.dataset.tab}`);
  });
  
  // Globaler Fehler-Handler für unbehandelte Versprechen
  window.addEventListener('unhandledrejection', function(event) {
    console.error('🚨 Unbehandeltes Promise-Rejection:', event.reason);
    showNotification('Ein unerwarteter Fehler ist aufgetreten.', 'error');
    
    // Verhindere, dass der Fehler die App zum Absturz bringt
    event.preventDefault();
  });
  
  // Globaler Fehler-Handler
  window.addEventListener('error', function(event) {
    console.error('🚨 Globaler Fehler:', event.error);
    showNotification('Ein JavaScript-Fehler ist aufgetreten.', 'error');
  });
  
  // Performance-Überwachung (optional)
  if ('performance' in window) {
    window.addEventListener('load', function() {
      setTimeout(() => {
        const perfData = performance.timing;
        const loadTime = perfData.loadEventEnd - perfData.navigationStart;
        console.log(`⚡ App-Ladezeit: ${loadTime}ms`);
        
        if (loadTime > 5000) {
          console.warn(`⚠️ Langsame Ladezeit erkannt: ${loadTime}ms`);
        }
      }, 0);
    });
  }
  
  // Online/Offline Status-Überwachung
  window.addEventListener('online', function() {
    console.log('🌐 App ist wieder online');
    showNotification('Verbindung wiederhergestellt', 'success');
  });
  
  window.addEventListener('offline', function() {
    console.log('📵 App ist offline');
    showNotification('Keine Internetverbindung', 'warning');
  });
  
  // Tastatur-Shortcuts (optional)
  document.addEventListener('keydown', function(event) {
    // Escape-Taste schließt Modals
    if (event.key === 'Escape') {
      const openModals = document.querySelectorAll('.modal[style*="flex"]');
      openModals.forEach(modal => {
        modal.style.display = 'none';
      });
    }
    
    // Ctrl+Alt+L für Logout (nur wenn eingeloggt)
    if (event.ctrlKey && event.altKey && event.key === 'l') {
      const appSection = document.getElementById('appSection');
      const adminSection = document.getElementById('adminSection');
      
      if ((appSection && appSection.style.display !== 'none') || 
          (adminSection && adminSection.style.display !== 'none')) {
        event.preventDefault();
        if (confirm('Möchten Sie sich abmelden?')) {
          performLogout();
        }
      }
    }
  });
  
  console.log("🎧 Alle globalen Event-Listener erfolgreich eingerichtet");
}

/**
 * Debug-Funktionen für Entwicklung
 */
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  // Debug-Funktionen nur in Entwicklungsumgebung
  window.debugApp = {
    showLoader: () => {
      console.log("🔧 Debug: Zeige Loader");
      showLoader();
    },
    hideLoader: () => {
      console.log("🔧 Debug: Verstecke Loader");
      hideLoader();
      forceShowAppSections();
    },
    checkLoaderStatus: () => {
      const loader = document.getElementById("mainLoader");
      if (loader) {
        const styles = window.getComputedStyle(loader);
        console.log("🔧 Debug: Loader Status:", {
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          zIndex: styles.zIndex
        });
      } else {
        console.log("🔧 Debug: Loader-Element nicht gefunden");
      }
    },
    resetApp: () => {
      console.log("🔧 Debug: App-Reset");
      window.location.reload();
    }
  };
  
  console.log("🔧 Debug-Funktionen verfügbar: window.debugApp");
  console.log("   - debugApp.showLoader()");
  console.log("   - debugApp.hideLoader()"); 
  console.log("   - debugApp.checkLoaderStatus()");
  console.log("   - debugApp.resetApp()");
}
