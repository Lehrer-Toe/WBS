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
  teacherName: null
};

/**
 * Initialisiert das Login-Modul
 */
export function initLoginModule() {
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

  // Event-Listener hinzufügen
  setupEventListeners();

  // Lehrer-Grid initialisieren
  initTeacherGrid(elements.teacherGrid, showPasswordModal, allTeachers);
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
  elements.loginPrompt.textContent = `Bitte das Passwort für ${teacher.name} eingeben:`;
  elements.passwordInput.value = "";
  elements.passwordModal.style.display = "flex";
  elements.passwordInput.focus();
  
  // Speichere temporär Lehrer-Daten
  currentUser.name = teacher.name;
  currentUser.code = teacher.code;
  currentUser.password = teacher.password;
  currentUser.permissions = teacher.permissions || {};
}

/**
 * Führt den Login-Prozess durch
 */
async function performLogin() {
  const enteredPassword = elements.passwordInput.value;
  
  // Validiere das Passwort
  if (enteredPassword !== currentUser.password) {
    showNotification("Falsches Passwort!", "error");
    return;
  }
  
  // Schließe den Modal
  elements.passwordModal.style.display = "none";
  
  // Zeige Ladebildschirm
  showLoader();
  
  try {
    // Überprüfe den Lehrer gegen die Datenbank
    const validTeacher = validateTeacher(currentUser.code, enteredPassword);
    
    if (!validTeacher) {
      throw new Error("Ungültiger Benutzer");
    }
    
    // Lade Benutzerdaten (Themen, Bewertungsraster)
    await initializeUserData();
    
    // Zeige die App-Oberfläche
    elements.loginSection.style.display = "none";
    elements.appSection.style.display = "block";
    
    // Aktualisiere die Benutzeranzeige
    elements.teacherAvatar.textContent = currentUser.code.charAt(0);
    elements.teacherName.textContent = currentUser.name;
    
    // Trigger ein benutzerdefiniertes Event für den erfolgreichen Login
    const event = new CustomEvent("userLoggedIn", { 
      detail: { teacher: currentUser } 
    });
    document.dispatchEvent(event);
    
    showNotification(`Willkommen, ${currentUser.name}!`);
  } catch (error) {
    console.error("Login-Fehler:", error);
    showNotification("Fehler bei der Anmeldung. Bitte versuchen Sie es erneut.", "error");
    
    // Setze den aktuellen Benutzer zurück
    currentUser.name = null;
    currentUser.code = null;
    currentUser.password = null;
    currentUser.permissions = {};
  } finally {
    hideLoader();
  }
}

/**
 * Führt den Logout-Prozess durch
 */
export function performLogout() {
  // Setze den aktuellen Benutzer zurück
  currentUser.name = null;
  currentUser.code = null;
  currentUser.password = null;
  currentUser.permissions = {};
  
  // Zeige die Login-Oberfläche
  elements.loginSection.style.display = "block";
  elements.appSection.style.display = "none";
  
  // Trigger ein benutzerdefiniertes Event für den Logout
  document.dispatchEvent(new Event("userLoggedOut"));
  
  showNotification("Abmeldung erfolgreich.");
}
