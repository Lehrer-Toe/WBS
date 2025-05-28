// js/main.js - Aktualisierte Version mit neuem Auth-System
import { 
  initDatabase, 
  ensureCollections, 
  ensureDefaultAssessmentTemplate, 
  checkDatabaseHealth
} from "./firebaseClient.js";
import { showLoader, hideLoader, showNotification } from "./uiService.js";
import { initNewLoginModule } from "./modules/newLoginModule.js";
import { initNewAdminModule } from "./modules/newAdminModule.js";
import { initIdeasModule } from "./modules/ideasModule.js";
import { initUpdatedThemeModule } from "./modules/updatedThemeModule.js";
import { loadAssessmentTemplates } from "./assessmentService.js";
import { currentUser } from "./authService.js";

// DOM-Elemente
let logoutBtn = null;

// Event-Listener für Tab-Wechsel
let currentActiveTab = 'ideas';

// Start
document.addEventListener("DOMContentLoaded", async function() {
  console.log("WBS Bewertungssystem wird initialisiert (neue Version)...");
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
    
    // 3. Bewertungsraster laden
    console.log("Lade Bewertungsraster...");
    await loadAssessmentTemplates();
    console.log("Bewertungsraster geladen");
    
    // 4. Neues Login-Modul initialisieren
    console.log("Initialisiere neues Login-Modul...");
    initNewLoginModule();
    console.log("Login-Modul initialisiert");
    
    // 5. Neues Admin-Modul initialisieren
    console.log("Initialisiere neues Admin-Modul...");
    initNewAdminModule();
    console.log("Admin-Modul initialisiert");
    
    // 6. Event-Listener einrichten
    console.log("Richte Event-Listener ein...");
    setupGlobalEventListeners();
    console.log("Event-Listener eingerichtet");
    
    // 7. Event-Listener für erfolgreichen Login
    document.addEventListener('userLoggedIn', handleUserLoggedIn);
    document.addEventListener('userLoggedOut', handleUserLoggedOut);
    
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

/**
 * Behandelt erfolgreichen Login
 */
async function handleUserLoggedIn(event) {
  const user = event.detail;
  console.log("Benutzer angemeldet:", user);
  
  try {
    showLoader();
    
    // Initialisiere benutzerspezifische Module
    console.log("Initialisiere Ideen-Modul...");
    await initIdeasModule();
    console.log("Ideen-Modul initialisiert");
    
    console.log("Initialisiere Themen-Modul...");
    await initUpdatedThemeModule();
    console.log("Themen-Modul initialisiert");
    
    // Setze ersten Tab als aktiv
    setActiveTab('ideas');
    
  } catch (error) {
    console.error("Fehler beim Initialisieren der Benutzer-Module:", error);
    showNotification("Fehler beim Laden der Module: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

/**
 * Behandelt Abmeldung
 */
function handleUserLoggedOut() {
  console.log("Benutzer abgemeldet");
  
  // Reset der Module
  currentActiveTab = 'ideas';
  
  // Clear module content
  const modules = ['ideas-tab', 'themes-tab', 'assessment-tab', 'overview-tab', 'templates-tab'];
  modules.forEach(moduleId => {
    const moduleElement = document.getElementById(moduleId);
    if (moduleElement) {
      // Reset to loading state
      moduleElement.innerHTML = `
        <div class="loading-container">
          <span class="loader"></span>
          <p>Wird geladen...</p>
        </div>
      `;
    }
  });
}

/**
 * Richtet globale Event-Listener ein
 */
function setupGlobalEventListeners() {
  // Logout-Button (wird vom Login-Modul behandelt)
  
  // Tab-Wechsel
  const tabs = document.querySelectorAll(".tab");
  
  tabs.forEach(function(tab) {
    tab.addEventListener("click", function() {
      // Nur verarbeiten, wenn Benutzer angemeldet ist
      if (!currentUser.isLoggedIn) {
        return;
      }
      
      const tabId = tab.dataset.tab;
      setActiveTab(tabId);
    });
  });
}

/**
 * Setzt einen Tab als aktiv
 */
function setActiveTab(tabId) {
  currentActiveTab = tabId;
  
  // Alle Tabs deaktivieren
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  
  tabs.forEach(function(t) { 
    t.classList.remove("active"); 
  });
  
  tabContents.forEach(function(c) { 
    c.classList.remove("active"); 
  });
  
  // Ausgewählten Tab aktivieren
  const activeTab = document.querySelector(`.tab[data-tab="${tabId}"]`);
  const activeTabContent = document.getElementById(`${tabId}-tab`);
  
  if (activeTab) {
    activeTab.classList.add("active");
  }
  
  if (activeTabContent) {
    activeTabContent.classList.add("active");
  }
  
  // Tab-spezifische Initialisierung
  initializeTabContent(tabId);
  
  console.log("Tab gewechselt zu:", tabId);
}

/**
 * Initialisiert Tab-spezifischen Inhalt
 */
async function initializeTabContent(tabId) {
  try {
    switch (tabId) {
      case 'ideas':
        // Ideen-Modul ist bereits initialisiert
        break;
        
      case 'themes':
        // Themen-Tab aktualisieren
        const themeModule = await import('./modules/updatedThemeModule.js');
        if (themeModule.updateThemesTab) {
          themeModule.updateThemesTab();
        }
        break;
        
      case 'assessment':
        // Assessment-Tab aktualisieren
        const assessmentModule = await import('./modules/updatedThemeModule.js');
        if (assessmentModule.updateAssessmentTab) {
          assessmentModule.updateAssessmentTab();
        }
        break;
        
      case 'overview':
        // Übersicht-Tab aktualisieren
        const overviewModule = await import('./modules/updatedThemeModule.js');
        if (overviewModule.updateOverviewTab) {
          overviewModule.updateOverviewTab();
        }
        break;
        
      case 'templates':
        // Templates-Tab aktualisieren
        const templatesModule = await import('./modules/updatedThemeModule.js');
        if (templatesModule.updateTemplatesTab) {
          templatesModule.updateTemplatesTab();
        }
        break;
    }
  } catch (error) {
    console.error(`Fehler beim Initialisieren von Tab ${tabId}:`, error);
  }
}

/**
 * Globale Hilfsfunktion für automatischen Sprung zur Bewertung
 */
window.jumpToAssessment = function(studentId, themeId) {
  // Wechsle zum Assessment-Tab
  setActiveTab('assessment');
  
  // Warte kurz, dann wähle den Schüler aus
  setTimeout(() => {
    const studentItem = document.querySelector(`.student-item[data-student-id="${studentId}"]`);
    if (studentItem) {
      studentItem.click();
      studentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 300);
};

/**
 * Exportiere Funktionen für andere Module
 */
window.setActiveTab = setActiveTab;
window.getCurrentActiveTab = () => currentActiveTab;

// TEMPORÄR: Ersten Admin erstellen - NACH SETUP ENTFERNEN!
const createFirstAdmin = async () => {
  try {
    const adminEmail = "tilama@mail.de";
    const adminPassword = "sohran17";
    
    const userCredential = await auth.createUserWithEmailAndPassword(adminEmail, adminPassword);
    const user = userCredential.user;
    
    await db.collection("users").doc(user.uid).set({
      email: adminEmail,
      name: "Administrator",
      role: "admin",
      isActive: true,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      permissions: {}
    });
    
    console.log("Erster Admin erstellt:", adminEmail);
    alert("Erster Admin erstellt. Bitte entfernen Sie diesen Code aus main.js!");
  } catch (error) {
    console.error("Fehler beim Erstellen des Admins:", error);
  }
};

// Uncomment this line to create first admin:
// createFirstAdmin();
