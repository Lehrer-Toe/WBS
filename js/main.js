// js/main.js - Korrigierte nicht-blockierende Version
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

// Start - KORRIGIERTE VERSION
document.addEventListener("DOMContentLoaded", async function() {
  console.log("WBS Bewertungssystem wird initialisiert...");
  
  // Zeige Loader sofort
  showLoader();
  
  try {
    console.log("=== INITIALISIERUNG GESTARTET ===");
    
    // 1. Firebase initialisieren (sollte jetzt schnell sein)
    console.log("1. Initialisiere Firebase...");
    const dbInitialized = await initDatabase();
    console.log("1. Firebase initialisiert:", dbInitialized);
    
    if (!dbInitialized) {
      console.warn("Firebase konnte nicht initialisiert werden, fahre im Offline-Modus fort");
    }
    
    // 2. Grundlegende Strukturen sicherstellen (nicht-blockierend)
    console.log("2. Stelle Collections sicher (nicht-blockierend)...");
    ensureCollections().catch(error => {
      console.warn("Collections konnten nicht sichergestellt werden:", error);
    });
    
    // 3. Lehrer laden (essentiell für Login)
    console.log("3. Lade Lehrer-Daten...");
    const teachersLoaded = await loadAllTeachers();
    console.log("3. Lehrer geladen:", teachersLoaded);
    
    // 4. Login-Modul sofort initialisieren (kritisch für UI)
    console.log("4. Initialisiere Login-Modul...");
    initLoginModule();
    console.log("4. Login-Modul initialisiert");
    
    // 5. Admin-Modul initialisieren
    console.log("5. Initialisiere Admin-Modul...");
    initAdminModule();
    console.log("5. Admin-Modul initialisiert");
    
    // 6. Event-Listener einrichten (kritisch für UI)
    console.log("6. Richte Event-Listener ein...");
    setupGlobalEventListeners();
    console.log("6. Event-Listener eingerichtet");
    
    // VERSTECKE LOADER JETZT - UI ist funktionsfähig
    console.log("=== UI IST BEREIT - VERSTECKE LOADER ===");
    hideLoader();
    forceShowAppSections(); // NEU: Erzwingt Sichtbarkeit der App-Bereiche
    
    // Stelle sicher, dass der Loader wirklich weg ist
    const mainLoader = document.getElementById("mainLoader");
    if (mainLoader) {
      mainLoader.style.display = "none";
      mainLoader.style.visibility = "hidden";
      console.log("Loader manuell ausgeblendet");
    }
    
    console.log("=== GRUNDINITIALISIERUNG ABGESCHLOSSEN ===");
    
    // REST IM HINTERGRUND LADEN (nicht-blockierend)
    console.log("Lade restliche Komponenten im Hintergrund...");
    
    // System-Einstellungen im Hintergrund laden
    loadSystemSettings().then(() => {
      console.log("System-Einstellungen im Hintergrund geladen");
    }).catch(error => {
      console.warn("System-Einstellungen konnten nicht geladen werden:", error);
    });
    
    // Bewertungsraster im Hintergrund laden
    loadAssessmentTemplates().then(() => {
      console.log("Bewertungsraster im Hintergrund geladen");
    }).catch(error => {
      console.warn("Bewertungsraster konnten nicht geladen werden:", error);
    });
    
    // Themen-Modul im Hintergrund initialisieren
    initThemeModule().then(() => {
      console.log("Themen-Modul im Hintergrund initialisiert");
    }).catch(error => {
      console.warn("Themen-Modul konnte nicht initialisiert werden:", error);
    });
    
    console.log("=== HINTERGRUND-INITIALISIERUNG GESTARTET ===");
    console.log("Benutzer kann sich jetzt anmelden!");
    
  } catch (error) {
    console.error("Kritischer Fehler bei der Initialisierung:", error);
    
    // Verstecke Loader auch bei Fehler
    hideLoader();
    const mainLoader = document.getElementById("mainLoader");
    if (mainLoader) {
      mainLoader.style.display = "none";
      mainLoader.style.visibility = "hidden";
    }
    
    // Zeige Fehlermeldung
    showNotification("Fehler bei der Initialisierung: " + error.message, "error");
    
    // Versuche trotzdem das Login-Modul zu initialisieren
    try {
      console.log("Versuche Notfall-Initialisierung...");
      initLoginModule();
      setupGlobalEventListeners();
      console.log("Notfall-Initialisierung erfolgreich");
    } catch (fallbackError) {
      console.error("Auch Notfall-Initialisierung fehlgeschlagen:", fallbackError);
      
      // Zeige kritische Fehlermeldung
      document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; color: red;">
          <h1>Kritischer Fehler</h1>
          <p>Die Anwendung konnte nicht initialisiert werden.</p>
          <p>Bitte laden Sie die Seite neu oder kontaktieren Sie den Administrator.</p>
          <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 20px;">
            Seite neu laden
          </button>
        </div>
      `;
    }
  }
});

// Richtet globale Event-Listener ein
function setupGlobalEventListeners() {
  console.log("Richte globale Event-Listener ein...");
  
  // Logout-Button
  logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", performLogout);
    console.log("Logout-Button Event-Listener hinzugefügt");
  } else {
    console.warn("Logout-Button nicht gefunden");
  }
  
  // Tab-Wechsel
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  
  console.log(`Gefunden: ${tabs.length} Tabs, ${tabContents.length} Tab-Contents`);
  
  tabs.forEach(function(tab, index) {
    tab.addEventListener("click", function() {
      const tabId = tab.dataset.tab;
      console.log(`Tab gewechselt zu: ${tabId}`);
      
      // Tabs deaktivieren
      tabs.forEach(function(t) { t.classList.remove("active"); });
      tabContents.forEach(function(c) { c.classList.remove("active"); });
      
      // Ausgewählten Tab aktivieren
      tab.classList.add("active");
      const tabContent = document.getElementById(`${tabId}-tab`);
      if (tabContent) {
        tabContent.classList.add("active");
        console.log(`Tab-Content aktiviert: ${tabId}-tab`);
      } else {
        console.warn(`Tab-Content nicht gefunden: ${tabId}-tab`);
      }
      
      // Event für Tab-Wechsel auslösen
      document.dispatchEvent(new CustomEvent("tabChanged", { 
        detail: { tabId: tabId } 
      }));
    });
  });
  
  console.log("Globale Event-Listener erfolgreich eingerichtet");
}
