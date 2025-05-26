// js/main.js - With debugging output
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

// Start
document.addEventListener("DOMContentLoaded", async function() {
  console.log("WBS Bewertungssystem wird initialisiert...");
  showLoader();
  
  try {
    // DEBUGGING: Force loader to be visible
    document.getElementById("mainLoader").style.display = "flex";
    console.log("Loader sollte sichtbar sein");
    
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
    
    // 6. Lehrer-Grid für Anmeldung initialisieren
    console.log("Initialisiere Login-Modul...");
    initLoginModule();
    console.log("Login-Modul initialisiert");
    
    // 7. Admin-Modul initialisieren
    console.log("Initialisiere Admin-Modul...");
    initAdminModule();
    console.log("Admin-Modul initialisiert");
    
    // 8. Themen-Modul initialisieren
    console.log("Initialisiere Themen-Modul...");
    await initThemeModule();
    console.log("Themen-Modul initialisiert");
    
    // 9. Event-Listener einrichten
    console.log("Richte Event-Listener ein...");
    setupGlobalEventListeners();
    console.log("Event-Listener eingerichtet");
    
    console.log("Initialisierung abgeschlossen!");
    
    // DEBUGGING: Try to force hide the loader
    document.getElementById("mainLoader").style.display = "none";
    console.log("Loader sollte jetzt ausgeblendet sein");
    
  } catch (error) {
    console.error("Fehler bei der Initialisierung:", error);
    showNotification("Fehler bei der Initialisierung: " + error.message, "error");
    
    // DEBUGGING: Make sure loader is hidden even on error
    document.getElementById("mainLoader").style.display = "none";
    console.log("Loader nach Fehler ausgeblendet");
  } finally {
    // DEBUGGING: Double-check that the loader is hidden
    hideLoader();
    document.getElementById("mainLoader").style.display = "none";
    console.log("Loader final ausgeblendet (finally block)");
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
    });
  });
}
