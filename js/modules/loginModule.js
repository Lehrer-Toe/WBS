// js/modules/loginModule.js
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
  console.log("Login-Modul wird initialisiert...");
  
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

  // Element-Validierung
  if (!elements.loginSection) {
    console.error("Login-Sektion nicht gefunden!");
  }
  if (!elements.appSection) {
    console.error("App-Sektion nicht gefunden!");
  }

  // Event-Listener hinzufügen
  setupEventListeners();

  // Lehrer-Grid initialisieren
  if (elements.teacherGrid) {
    initTeacherGrid(elements.teacherGrid, showPasswordModal, allTeachers);
    console.log("Lehrer-Grid initialisiert");
  } else {
    console.error("Lehrer-Grid nicht gefunden!");
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
  if (!elements.loginPrompt || !elements.passwordModal || !elements.passwordInput) {
    console.error("Password Modal Elemente nicht gefunden!");
    return;
  }
  
  elements.loginPrompt.textContent = `Bitte das Passwort für ${teacher.name} eingeben:`;
  elements.passwordInput.value = "";
  elements.passwordModal.style.display = "flex";
  elements.passwordInput.focus();
  
  // Speichere temporär Lehrer-Daten
  currentUser.name = teacher.name;
  currentUser.code = teacher.code;
  currentUser.password = teacher.password;
  currentUser.permissions = teacher.permissions || {};
  
  console.log(`Password Modal für ${teacher.name} angezeigt`);
}

/**
 * Führt den Login-Prozess durch
 */
async function performLogin() {
  console.log("Login-Prozess wird gestartet...");
  
  if (!elements.passwordInput) {
    console.error("Password Input nicht gefunden!");
    return;
  }
  
  const enteredPassword = elements.passwordInput.value;
  
  // Validiere das Passwort
  if (enteredPassword !== currentUser.password) {
    showNotification("Falsches Passwort!", "error");
    return;
  }
  
  // Schließe den Modal
  if (elements.passwordModal) {
    elements.passwordModal.style.display = "none";
  }
  
  // Zeige Ladebildschirm
  showLoader();
  console.log("Ladebildschirm angezeigt");
  
  try {
    // Überprüfe den Lehrer gegen die Datenbank
    console.log(`Validiere Lehrer: ${currentUser.code}`);
    const validTeacher = validateTeacher(currentUser.code, enteredPassword);
    
    if (!validTeacher) {
      throw new Error("Ungültiger Benutzer");
    }
    
    // Lade Benutzerdaten (Themen, Bewertungsraster)
    console.log("Initialisiere Benutzerdaten...");
    await initializeUserData();
    console.log("Benutzerdaten erfolgreich initialisiert");
    
    // Zeige die App-Oberfläche
    console.log("Wechsle zur App-Oberfläche");
    if (elements.loginSection && elements.appSection) {
      elements.loginSection.style.display = "none";
      elements.appSection.style.display = "block";
      
      // Kurze Verzögerung, um sicherzustellen, dass der DOM aktualisiert wird
      setTimeout(() => {
        // Überprüfe, ob die App-Sektion wirklich angezeigt wird
        const appDisplayStyle = window.getComputedStyle(elements.appSection).display;
        console.log(`App-Sektion Display-Style: ${appDisplayStyle}`);
        
        if (appDisplayStyle === "none") {
          console.warn("App-Sektion ist immer noch versteckt! Setze Display erneut...");
          elements.appSection.style.display = "block";
          
          // Force-Reflow, um das Layout zu aktualisieren
          void elements.appSection.offsetHeight;
        }
      }, 100);
    } else {
      console.error("Login- oder App-Sektion nicht gefunden!");
    }
    
    // Aktualisiere die Benutzeranzeige
    if (elements.teacherAvatar && elements.teacherName) {
      elements.teacherAvatar.textContent = currentUser.code.charAt(0);
      elements.teacherName.textContent = currentUser.name;
    }
    
    // Trigger ein benutzerdefiniertes Event für den erfolgreichen Login
    console.log("Auslösen des userLoggedIn-Events");
    const event = new CustomEvent("userLoggedIn", { 
      detail: { teacher: currentUser } 
    });
    document.dispatchEvent(event);
    
    showNotification(`Willkommen, ${currentUser.name}!`);
    console.log("Login erfolgreich abgeschlossen");
  } catch (error) {
    console.error("Login-Fehler:", error);
    showNotification("Fehler bei der Anmeldung. Bitte versuchen Sie es erneut.", "error");
    
    // Setze den aktuellen Benutzer zurück
    currentUser.name = null;
    currentUser.code = null;
    currentUser.password = null;
    currentUser.permissions = {};
  } finally {
    // Sicherstellen, dass der Loader ausgeblendet wird
    hideLoader();
    
    // Doppelte Überprüfung, dass der Loader tatsächlich ausgeblendet ist
    const mainLoader = document.getElementById("mainLoader");
    if (mainLoader) {
      mainLoader.style.display = "none";
      console.log("Ladebildschirm ausgeblendet");
    }
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
  if (elements.loginSection && elements.appSection) {
    elements.loginSection.style.display = "block";
    elements.appSection.style.display = "none";
  }
  
  // Trigger ein benutzerdefiniertes Event für den Logout
  document.dispatchEvent(new Event("userLoggedOut"));
  
  showNotification("Abmeldung erfolgreich.");
  console.log("Logout erfolgreich durchgeführt");
}
