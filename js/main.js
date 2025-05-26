// js/main.js - Fixed version without the problematic import
import { 
  initDatabase, 
  ensureCollections, 
  ensureDefaultAssessmentTemplate, 
  checkDatabaseHealth,
  cleanupOrphanedData
} from "./firebaseClient.js";
import { loadAllTeachers, loadSystemSettings } from "./adminService.js";
import { showLoader, hideLoader, showNotification } from "./uiService.js";
import { initLoginModule, performLogout } from "./modules/loginModule.js";
import { initAdminModule } from "./modules/adminModule.js";
import { initThemeModule } from "./modules/themeModule.js";
import { loadAssessmentTemplates } from "./assessmentService.js";
// Removed the problematic import: import { updateThemeStatuses } from "./themeService.js";

// DOM-Elemente
let logoutBtn = null;

// Start
document.addEventListener("DOMContentLoaded", async function() {
  console.log("WBS Bewertungssystem wird initialisiert...");
  showLoader();
  
  try {
    // 1. Firebase initialisieren
    const dbInitialized = await initDatabase();
    if (!dbInitialized) {
      throw new Error("Datenbank konnte nicht initialisiert werden");
    }
    
    // 2. Datenbank-Gesundheits-Check durchführen
    const dbHealth = await checkDatabaseHealth();
    console.log("Datenbank-Status:", dbHealth.status);
    
    if (dbHealth.status === "warning" || dbHealth.status === "error") {
      console.warn("Datenbank-Probleme gefunden:", dbHealth.issues);
      // Zeige Warnung, aber breche nicht ab
      showNotification("Einige Datenbankprobleme wurden erkannt. Die Anwendung könnte eingeschränkt funktionieren.", "warning");
    }
    
    // 3. Grundlegende Sammlungen und Strukturen sicherstellen
    await ensureCollections();
    await ensureDefaultAssessmentTemplate();
    
    // 4. Verwaiste Daten bereinigen
    const cleanupResult = await cleanupOrphanedData();
    if (cleanupResult.cleaned > 0) {
      console.log(`${cleanupResult.cleaned} verwaiste Datensätze wurden bereinigt`);
    }
    
    // 5. Lehrer aus Firebase laden
    console.log("Lade Lehrer-Daten...");
    await loadAllTeachers();
    
    // 6. System-Einstellungen laden
    console.log("Lade System-Einstellungen...");
    await loadSystemSettings();
    
    // 7. Bewertungsraster laden
    console.log("Lade Bewertungsraster...");
    await loadAssessmentTemplates();
    
    // 8. Lehrer-Grid für Anmeldung initialisieren
    initLoginModule();
    
    // 9. Admin-Modul initialisieren
    initAdminModule();
    
    // 10. Themen-Modul initialisieren
    await initThemeModule();
    
    // 11. Event-Listener einrichten
    setupGlobalEventListeners();
    
    console.log("Initialisierung abgeschlossen!");
  } catch (error) {
    console.error("Fehler bei der Initialisierung:", error);
    showNotification("Fehler bei der Initialisierung: " + error.message, "error");
  } finally {
    hideLoader();
  }
});

// Richtet globale Event-Listener ein
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
      
      // Event auslösen für Tab-Wechsel
      document.dispatchEvent(new CustomEvent("tabChanged", { 
        detail: { tabId: tabId }
      }));
    });
  });
  
  // Theme-Status-Update - Removed the reference to updateThemeStatuses
  setInterval(function() {
    // Comment out or remove: updateThemeStatuses();
    document.dispatchEvent(new Event("themeStatusesUpdated"));
  }, 5 * 60 * 1000); // Alle 5 Minuten
  
  // Event-Listener für Systemaktualisierungen
  document.addEventListener("systemSettingsUpdated", function(event) {
    console.log("Systemeinstellungen wurden aktualisiert:", event.detail);
  });
  
  // Event-Listener für Lehrer-Updates
  document.addEventListener("teachersUpdated", function(event) {
    console.log("Lehrer-Daten wurden aktualisiert");
  });
}
