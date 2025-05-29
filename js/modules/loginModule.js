// js/modules/loginModule.js - REPARIERTE VERSION
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
 * Aktueller Login-Status
 */
let currentLoginAttempt = null;

/**
 * Initialisiert das Login-Modul
 */
export function initLoginModule() {
  console.log("Initialisiere Login-Modul...");
  
  // DOM-Elemente abrufen und prüfen
  loadDOMElements();
  
  // Event-Listener hinzufügen
  setupEventListeners();
  
  // Lehrer-Grid initialisieren
  setupTeacherGrid();
  
  console.log("Login-Modul erfolgreich initialisiert");
}

/**
 * Lädt und prüft alle DOM-Elemente
 */
function loadDOMElements() {
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

  // Debug-Ausgabe für fehlende Elemente
  const elementStatus = {
    loginSection: !!elements.loginSection,
    appSection: !!elements.appSection,
    teacherGrid: !!elements.teacherGrid,
    passwordModal: !!elements.passwordModal,
    mainLoader: !!elements.mainLoader
  };
  
  console.log("DOM-Elemente Status:", elementStatus);
  
  // Kritische Elemente prüfen
  if (!elements.loginSection) {
    console.error("KRITISCH: loginSection nicht gefunden!");
  }
  if (!elements.appSection) {
    console.error("KRITISCH: appSection nicht gefunden!");
  }
  if (!elements.teacherGrid) {
    console.error("KRITISCH: teacherGrid nicht gefunden!");
    
    // Versuche teacherGrid zu erstellen, falls es fehlt
    createTeacherGridIfMissing();
  }
}

/**
 * Erstellt das teacherGrid-Element, falls es fehlt
 */
function createTeacherGridIfMissing() {
  if (elements.teacherGrid) return;
  
  // Suche nach einem Container, in dem wir das Grid erstellen können
  const container = document.querySelector("#loginSection .container");
  if (!container) {
    console.error("Kein Container für teacherGrid gefunden!");
    return;
  }
  
  // Erstelle das teacherGrid-Element
  const teacherGrid = document.createElement("div");
  teacherGrid.id = "teacherGrid";
  teacherGrid.className = "teacher-grid";
  
  // Füge es vor dem Password-Modal ein
  const passwordModal = document.getElementById("passwordModal");
  if (passwordModal && passwordModal.parentNode === container) {
    container.insertBefore(teacherGrid, passwordModal);
  } else {
    container.appendChild(teacherGrid);
  }
  
  elements.teacherGrid = teacherGrid;
  console.log("teacherGrid wurde erstellt");
}

/**
 * Richtet die Event-Listener ein
 */
function setupEventListeners() {
  // Password Modal schließen
  if (elements.closePasswordModalBtn) {
    elements.closePasswordModalBtn.addEventListener("click", () => {
      hidePasswordModal();
    });
  }

  if (elements.cancelLoginBtn) {
    elements.cancelLoginBtn.addEventListener("click", () => {
      hidePasswordModal();
    });
  }

  // Login bestätigen
  if (elements.confirmLoginBtn) {
    elements.confirmLoginBtn.addEventListener("click", performLogin);
  }

  // Enter-Taste im Passwort-Feld
  if (elements.passwordInput) {
    elements.passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performLogin();
      }
    });
  }
  
  // Modal-Hintergrund klicken zum Schließen
  if (elements.passwordModal) {
    elements.passwordModal.addEventListener("click", (e) => {
      if (e.target === elements.passwordModal) {
        hidePasswordModal();
      }
    });
  }
}

/**
 * Initialisiert das Lehrer-Grid
 */
function setupTeacherGrid() {
  if (!elements.teacherGrid) {
    console.error("teacherGrid nicht verfügbar für Initialisierung");
    return;
  }
  
  if (!allTeachers || allTeachers.length === 0) {
    console.warn("Keine Lehrer verfügbar");
    showNoTeachersMessage();
    return;
  }
  
  console.log(`Initialisiere Grid mit ${allTeachers.length} Lehrern`);
  initTeacherGrid(elements.teacherGrid, showPasswordModal, allTeachers);
}

/**
 * Zeigt eine Nachricht an, wenn keine Lehrer verfügbar sind
 */
function showNoTeachersMessage() {
  if (!elements.teacherGrid) return;
  
  elements.teacherGrid.innerHTML = `
    <div class="empty-state">
      <p>Keine Lehrer verfügbar</p>
      <button onclick="location.reload()" class="btn-secondary">Seite neu laden</button>
    </div>
  `;
}

/**
 * Zeigt den Passwort-Dialog für einen Lehrer
 */
export function showPasswordModal(teacher) {
  if (!elements.passwordModal || !elements.loginPrompt || !elements.passwordInput) {
    console.error("Password Modal Elemente nicht verfügbar");
    return;
  }
  
  console.log("Zeige Password Modal für:", teacher.name);
  
  elements.loginPrompt.textContent = `Bitte das Passwort für ${teacher.name} eingeben:`;
  elements.passwordInput.value = "";
  elements.passwordModal.style.display = "flex";
  elements.passwordInput.focus();
  
  // Speichere den ausgewählten Lehrer
  currentLoginAttempt = {
    name: teacher.name,
    code: teacher.code,
    password: teacher.password,
    permissions: teacher.permissions || {}
  };
}

/**
 * Versteckt den Passwort-Dialog
 */
function hidePasswordModal() {
  if (elements.passwordModal) {
    elements.passwordModal.style.display = "none";
  }
  currentLoginAttempt = null;
}

/**
 * Führt den Login-Prozess durch
 */
async function performLogin() {
  if (!currentLoginAttempt) {
    showNotification("Kein Lehrer ausgewählt", "error");
    return;
  }
  
  const enteredPassword = elements.passwordInput ? elements.passwordInput.value : "";
  
  if (!enteredPassword) {
    showNotification("Bitte geben Sie ein Passwort ein.", "warning");
    return;
  }
  
  console.log("Versuche Login für:", currentLoginAttempt.name);
  
  // Validiere das Passwort
  if (enteredPassword !== currentLoginAttempt.password) {
    showNotification("Falsches Passwort!", "error");
    return;
  }
  
  // Schließe den Modal
  hidePasswordModal();
  
  // Zeige Ladebildschirm
  showLoader();
  
  try {
    // Überprüfe den Lehrer gegen die Datenbank
    const validTeacher = validateTeacher(currentLoginAttempt.code, enteredPassword);
    
    if (!validTeacher) {
      throw new Error("Ungültiger Benutzer");
    }
    
    // Setze den aktuellen Benutzer
    currentUser.name = currentLoginAttempt.name;
    currentUser.code = currentLoginAttempt.code;
    currentUser.password = currentLoginAttempt.password;
    currentUser.permissions = currentLoginAttempt.permissions;
    
    console.log("Benutzer gesetzt:", currentUser.name);
    
    // Lade Benutzerdaten
    console.log("Lade Benutzerdaten...");
    await initializeUserData();
    
    // Wechsle zur App-Oberfläche
    console.log("Wechsle zur App-Oberfläche...");
    switchToAppInterface();
    
    // Trigger Login-Event
    const event = new CustomEvent("userLoggedIn", { 
      detail: { teacher: currentUser } 
    });
    document.dispatchEvent(event);
    
    showNotification(`Willkommen, ${currentUser.name}!`);
    
    console.log("Login erfolgreich abgeschlossen");
    
  } catch (error) {
    console.error("Login-Fehler:", error);
    showNotification("Fehler bei der Anmeldung: " + error.message, "error");
    
    // Setze den aktuellen Benutzer zurück
    resetCurrentUser();
  } finally {
    hideLoader();
  }
}

/**
 * Wechselt zur App-Oberfläche
 */
function switchToAppInterface() {
  console.log("Wechsle zur App-Oberfläche...");
  
  // Login-Bereich ausblenden
  if (elements.loginSection) {
    elements.loginSection.style.display = "none";
    console.log("Login-Bereich ausgeblendet");
  } else {
    console.error("loginSection nicht verfügbar für das Ausblenden");
  }
  
  // App-Bereich anzeigen
  if (elements.appSection) {
    elements.appSection.style.display = "block";
    console.log("App-Bereich angezeigt");
  } else {
    console.error("appSection nicht verfügbar für das Anzeigen");
  }
  
  // Benutzeranzeige aktualisieren
  updateUserDisplay();
  
  // Sicherstellen, dass der Loader ausgeblendet ist
  if (elements.mainLoader) {
    elements.mainLoader.style.display = "none";
  }
}

/**
 * Aktualisiert die Benutzeranzeige in der App
 */
function updateUserDisplay() {
  if (elements.teacherAvatar && currentUser.code) {
    elements.teacherAvatar.textContent = currentUser.code.charAt(0).toUpperCase();
  }
  
  if (elements.teacherName && currentUser.name) {
    elements.teacherName.textContent = currentUser.name;
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
}

/**
 * Führt den Logout-Prozess durch
 */
export function performLogout() {
  console.log("Führe Logout durch...");
  
  // Setze den aktuellen Benutzer zurück
  resetCurrentUser();
  
  // Wechsle zur Login-Oberfläche
  if (elements.loginSection) {
    elements.loginSection.style.display = "block";
  }
  
  if (elements.appSection) {
    elements.appSection.style.display = "none";
  }
  
  // Trigger Logout-Event
  document.dispatchEvent(new Event("userLoggedOut"));
  
  showNotification("Abmeldung erfolgreich.");
  
  console.log("Logout abgeschlossen");
}

/**
 * Event-Listener für Lehrer-Updates
 */
document.addEventListener("teachersUpdated", (event) => {
  console.log("Lehrer wurden aktualisiert, Grid wird neu initialisiert");
  setupTeacherGrid();
});

/**
 * Debug-Funktion für Fehlerbehebung
 */
window.debugLoginModule = function() {
  console.log("=== LOGIN MODULE DEBUG ===");
  console.log("Elements:", elements);
  console.log("Current User:", currentUser);
  console.log("All Teachers:", allTeachers);
  console.log("Current Login Attempt:", currentLoginAttempt);
  console.log("========================");
};
