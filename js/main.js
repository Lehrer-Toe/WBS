// js/main.js - Korrigierte Version ohne Debug-Code
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
  
  // Stelle sicher, dass alle Sections initial versteckt sind (außer Login)
  const adminLoginSection = document.getElementById("adminLoginSection");
  const adminSection = document.getElementById("adminSection");
  const appSection = document.getElementById("appSection");
  
  if (adminLoginSection) adminLoginSection.style.display = "none";
  if (adminSection) adminSection.style.display = "none";
  if (appSection) appSection.style.display = "none";
  
  // Loader anzeigen
  showLoader();
  
  try {
    // 1. Firebase initialisieren
    console.log("Initialisiere Firebase...");
    const dbInitialized = await initDatabase();
    
    if (!dbInitialized) {
      throw new Error("Datenbank konnte nicht initialisiert werden");
    }
    
    // 2. Grundlegende Sammlungen und Strukturen sicherstellen
    await ensureCollections();
    await ensureDefaultAssessmentTemplate();
    
    // 3. Lehrer aus Firebase laden
    const teachersLoaded = await loadAllTeachers();
    
    // 4. System-Einstellungen laden
    await loadSystemSettings();
    
    // 5. Bewertungsraster laden
    await loadAssessmentTemplates();
    
    // 6. Lehrer-Grid für Anmeldung initialisieren
    initLoginModule();
    
    // 7. Admin-Modul initialisieren
    initAdminModule();
    
    // 8. Themen-Modul initialisieren
    await initThemeModule();
    
    // 9. Event-Listener einrichten
    setupGlobalEventListeners();
    
    console.log("Initialisierung abgeschlossen!");
    
  } catch (error) {
    console.error("Fehler bei der Initialisierung:", error);
    showNotification("Fehler bei der Initialisierung: " + error.message, "error");
  } finally {
    // Loader ausblenden
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
