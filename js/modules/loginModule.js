// js/modules/loginModule.js - Korrigierte Version
import { showLoader, hideLoader, showNotification, initTeacherGrid } from "../uiService.js";
import { currentUser } from "../dataService.js";
import { validateTeacher, allTeachers } from "../adminService.js";
import { initializeUserData } from "../dataService.js";

/**
 * Referenz auf die DOM-Elemente
 */
let elements = {
  loginSection: null,
  appSection: null,
  teacherGrid: null,
  passwordModal: null,
  passwordInput: null,
  loginPrompt: null,
  confirmLoginBtn: null,
  cancelLoginBtn: null,
  closePasswordModalBtn: null,
  teacherAvatar: null,
  teacherName: null,
  mainLoader: null
};

/**
 * Initialisiert das Login-Modul
 */
export function initLoginModule() {
  console.log("Initialisiere Login-Modul...");
  
  // DOM-Elemente abrufen
  elements.loginSection = document.getElementById("loginSection");
  elements.appSection = document.getElementById("appSection");
  elements.teacherGrid = document.getElementById("teacherGrid");
  elements.passwordModal = document.getElementById("passwordModal");
  elements.passwordInput = document.getElementById("passwordInput");
  elements.loginPrompt = document.getElementById("loginPrompt");
  elements.confirmLoginBtn = document.getElementById("confirmLogin");
  elements.cancelLoginBtn = document.getElementById("cancelLogin");
  elements.closePasswordModalBtn = document.getElementById("closePasswordModal");
  elements.teacherAvatar = document.getElementById("teacherAvatar");
  elements.teacherName = document.getElementById("teacherName");
  elements.mainLoader = document.getElementById("mainLoader");

  // Prüfe, ob kritische Elemente vorhanden sind
  if (!elements.loginSection || !elements.appSection) {
    console.error("Kritische DOM-Elemente nicht gefunden!");
    return;
  }

  console.log("DOM-Elemente erfolgreich geladen:", {
    loginSection: !!elements.loginSection,
    appSection: !!elements.appSection,
    teacherGrid: !!elements.teacherGrid,
    mainLoader: !!elements.mainLoader
  });

  // Event-Listener hinzufügen
  setupEventListeners();

  // Lehrer-Grid initialisieren
  if (elements.teacherGrid) {
    initTeacherGrid(elements.teacherGrid, showPasswordModal, allTeachers);
  }
  
  console.log("Login-Modul erfolgreich initialisiert");
}

/**
 * Richtet die Event-Listener ein
 */
function setupEventListeners() {
  if (elements.closePasswordModalBtn) {
    elements.closePasswordModalBtn.addEventListener("click", () => {
      elements.passwordModal.style.display = "none";
    });
  }

  if (elements.cancelLoginBtn) {
    elements.cancelLoginBtn.addEventListener("click", () => {
      elements.passwordModal.style.display = "none";
    });
  }

  if (elements.confirmLoginBtn) {
    elements.confirmLoginBtn.addEventListener("click", performLogin);
  }

  if (elements.passwordInput) {
    elements.passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performLogin();
      }
    });
  }
}

/**
 * Zeigt den Passwort-Dialog für einen Lehrer
 */
export function showPasswordModal(teacher) {
  console.log("Zeige Passwort-Modal für:", teacher.name);
  
  if (elements.loginPrompt) {
    elements.loginPrompt.textContent = `Bitte das Passwort für ${teacher.name} eingeben:`;
  }
  
  if (elements.passwordInput) {
    elements.passwordInput.value = "";
  }
  
  if (elements.passwordModal) {
    elements.passwordModal.style.display = "flex";
  }
  
  if (elements.passwordInput) {
    elements.passwordInput.focus();
  }
  
  // Speichere temporär Lehrer-Daten
  currentUser.name = teacher.name;
  currentUser.code = teacher.code;
  currentUser.password = teacher.password;
  currentUser.permissions = teacher.permissions || {};
  
  console.log("Passwort-Modal angezeigt für:", teacher.code);
}

/**
 * Führt den Login-Prozess durch - KORRIGIERTE VERSION
 */
async function performLogin() {
  console.log("Login-Prozess startet für:", currentUser.code);
  
  const enteredPassword = elements.passwordInput ? elements.passwordInput.value : "";
  
  // Validiere das Passwort
  if (enteredPassword !== currentUser.password) {
    console.log("Falsches Passwort eingegeben");
    showNotification("Falsches Passwort!", "error");
    return;
  }
  
  console.log("Passwort korrekt, starte Anmeldung...");
  
  // Schließe den Modal SOFORT
  if (elements.passwordModal) {
    elements.passwordModal.style.display = "none";
  }
  
  // Zeige Ladebildschirm
  console.log("Zeige Loader...");
  showLoader();
  
  // Kleine Verzögerung, um sicherzustellen, dass der Loader angezeigt wird
  await new Promise(resolve => setTimeout(resolve, 100));
  
  try {
    console.log("Validiere Lehrer...");
    // Überprüfe den Lehrer gegen die Datenbank
    const validTeacher = validateTeacher(currentUser.code, enteredPassword);
    
    if (!validTeacher) {
      throw new Error("Ungültiger Benutzer");
    }
    
    console.log("Lehrer validiert, lade Benutzerdaten...");
    // Lade Benutzerdaten (Themen, Bewertungsraster)
    const dataLoaded = await initializeUserData();
    
    if (!dataLoaded) {
      console.warn("Benutzerdaten konnten nicht vollständig geladen werden, fahre trotzdem fort");
    }
    
    console.log("Wechsle zur App-Oberfläche...");
    
    // KRITISCH: Verstecke Loader BEVOR UI gewechselt wird
    console.log("Verstecke Loader...");
    hideLoader();
    
    // Zusätzliche Sicherheit: Loader manuell ausblenden
    if (elements.mainLoader) {
      elements.mainLoader.style.display = "none";
      console.log("Loader manuell ausgeblendet");
    }
    
    // Kleine Verzögerung für UI-Transition
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Zeige die App-Oberfläche
    console.log("Verstecke Login-Sektion...");
    if (elements.loginSection) {
      elements.loginSection.style.display = "none";
      console.log("Login-Sektion versteckt");
    }
    
    console.log("Zeige App-Sektion...");
    if (elements.appSection) {
      elements.appSection.style.display = "block";
      console.log("App-Sektion angezeigt");
    }
    
    // Aktualisiere die Benutzeranzeige
    if (elements.teacherAvatar) {
      elements.teacherAvatar.textContent = currentUser.code.charAt(0);
    }
    if (elements.teacherName) {
      elements.teacherName.textContent = currentUser.name;
    }
    
    console.log("UI erfolgreich gewechselt");
    
    // Trigger ein benutzerdefiniertes Event für den erfolgreichen Login
    const event = new CustomEvent("userLoggedIn", { 
      detail: { teacher: currentUser } 
    });
    document.dispatchEvent(event);
    
    console.log("userLoggedIn Event ausgelöst");
    
    showNotification(`Willkommen, ${currentUser.name}!`);
    
    console.log("Login erfolgreich abgeschlossen für:", currentUser.name);
    
  } catch (error) {
    console.error("Login-Fehler:", error);
    showNotification("Fehler bei der Anmeldung: " + error.message, "error");
    
    // Setze den aktuellen Benutzer zurück
    resetCurrentUser();
    
  } finally {
    console.log("Login-Prozess abgeschlossen, verstecke Loader final...");
    
    // WICHTIG: Stelle sicher, dass der Loader in JEDEM Fall ausgeblendet wird
    hideLoader();
    
    // Zusätzliche Sicherheit: Loader manuell ausblenden
    if (elements.mainLoader) {
      elements.mainLoader.style.display = "none";
      elements.mainLoader.style.visibility = "hidden";
      console.log("Loader final und manuell ausgeblendet");
    }
    
    // Entferne alle möglichen Loader-Klassen
    document.body.classList.remove("loading");
    
    console.log("Loader-Cleanup abgeschlossen");
  }
}

/**
 * Setzt den aktuellen Benutzer zurück
 */
function resetCurrentUser() {
  currentUser.name = null;
  currentUser.code = null;
  currentUser.password = null;
  currentUser.permissions = {};
  console.log("Aktueller Benutzer zurückgesetzt");
}

/**
 * Führt den Logout-Prozess durch
 */
export function performLogout() {
  console.log("Logout-Prozess startet...");
  
  // Setze den aktuellen Benutzer zurück
  resetCurrentUser();
  
  // Verstecke Loader (falls er noch sichtbar ist)
  hideLoader();
  if (elements.mainLoader) {
    elements.mainLoader.style.display = "none";
    elements.mainLoader.style.visibility = "hidden";
  }
  
  // Zeige die Login-Oberfläche
  if (elements.loginSection) {
    elements.loginSection.style.display = "block";
    console.log("Login-Sektion angezeigt");
  }
  
  if (elements.appSection) {
    elements.appSection.style.display = "none";
    console.log("App-Sektion versteckt");
  }
  
  // Trigger ein benutzerdefiniertes Event für den Logout
  document.dispatchEvent(new Event("userLoggedOut"));
  
  showNotification("Abmeldung erfolgreich.");
  
  console.log("Logout erfolgreich abgeschlossen");
}
