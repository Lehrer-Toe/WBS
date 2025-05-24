// js/main.js
import { initDatabase, ensureCollections, ensureDefaultAssessmentTemplate } from "./firebaseClient.js";
import { loadAllTeachers } from "./adminService.js";
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
    // 1. Firebase initialisieren
    await initDatabase();
    await ensureCollections();
    await ensureDefaultAssessmentTemplate();
    
    // 2. Lehrer aus Firebase laden
    console.log("Lade Lehrer-Daten...");
    await loadAllTeachers();
    
    // 3. Bewertungsraster laden
    console.log("Lade Bewertungsraster...");
    await loadAssessmentTemplates();
    
    // 4. Lehrer-Grid für Anmeldung initialisieren
    initLoginModule();
    
    // 5. Admin-Modul initialisieren
    initAdminModule();
    
    // 6. Themen-Modul initialisieren
    await initThemeModule();
    
    // 7. Event-Listener einrichten
    setupGlobalEventListeners();
    
    console.log("Initialisierung abgeschlossen!");
  } catch (error) {
    console.error("Fehler bei der Initialisierung:", error);
    showNotification("Fehler bei der Initialisierung. Bitte Seite neu laden.", "error");
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
    });
  });
}
