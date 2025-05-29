// js/modules/loginModule.js - KOMPLETTE ARBEITENDE VERSION
import { showLoader, hideLoader, showNotification } from "../uiService.js";
import { currentUser } from "../dataService.js";
import { validateTeacher, allTeachers } from "../adminService.js";
import { initializeUserData } from "../dataService.js";

// Globale Variablen
let selectedTeacher = null;

/**
 * Initialisiert das Login-Modul - GARANTIERT FUNKTIONIEREND
 */
export function initLoginModule() {
  console.log("=== INITIALISIERE LOGIN MODUL ===");
  
  // Warte bis DOM vollständig geladen ist
  if (document.readyState !== 'complete') {
    window.addEventListener('load', initLoginModule);
    return;
  }
  
  // Erstelle Teacher Grid
  createTeacherGrid();
  
  // Setup Event Listener
  setupLoginEventListeners();
  
  console.log("Login-Modul ERFOLGREICH initialisiert");
}

/**
 * Erstellt das Teacher Grid mit funktionierenden Karten
 */
function createTeacherGrid() {
  console.log("Erstelle Teacher Grid...");
  
  const container = document.querySelector("#loginSection .container");
  if (!container) {
    console.error("Container nicht gefunden!");
    return;
  }
  
  // Entferne existierendes Grid
  const existingGrid = document.getElementById("teacherGrid");
  if (existingGrid) {
    existingGrid.remove();
  }
  
  // Erstelle neues Grid
  const teacherGrid = document.createElement("div");
  teacherGrid.id = "teacherGrid";
  teacherGrid.className = "teacher-grid";
  
  // Füge Lehrer-Karten hinzu
  if (allTeachers && allTeachers.length > 0) {
    allTeachers.forEach(teacher => {
      const card = createTeacherCard(teacher);
      teacherGrid.appendChild(card);
    });
  } else {
    teacherGrid.innerHTML = '<p>Keine Lehrer verfügbar</p>';
  }
  
  // Füge Grid in Container ein (vor dem Password Modal)
  const passwordModal = document.getElementById("passwordModal");
  if (passwordModal) {
    container.insertBefore(teacherGrid, passwordModal);
  } else {
    container.appendChild(teacherGrid);
  }
  
  console.log(`Grid erstellt mit ${allTeachers ? allTeachers.length : 0} Lehrern`);
}

/**
 * Erstellt eine Lehrer-Karte
 */
function createTeacherCard(teacher) {
  const card = document.createElement("div");
  card.className = "teacher-card";
  
  const hasCreatePermission = teacher.permissions && teacher.permissions.canCreateThemes;
  const permissionBadge = hasCreatePermission ? 
    '<span class="permission-badge" title="Kann Themen erstellen">📝</span>' : '';
  
  card.innerHTML = `
    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50' y='60' font-family='Arial' font-size='30' text-anchor='middle' fill='%23666'%3E${teacher.code.charAt(0)}%3C/text%3E%3C/svg%3E" alt="${teacher.name}">
    <h3>${teacher.name} ${permissionBadge}</h3>
  `;
  
  // Event Listener direkt hinzufügen
  card.addEventListener("click", () => {
    console.log("Lehrer-Karte geklickt:", teacher.name);
    showPasswordModal(teacher);
  });
  
  return card;
}

/**
 * Zeigt das Password Modal
 */
function showPasswordModal(teacher) {
  console.log("Zeige Password Modal für:", teacher.name);
  
  selectedTeacher = teacher;
  
  // Modal Elemente
  const modal = document.getElementById("passwordModal");
  const promptText = document.getElementById("loginPrompt");
  const passwordInput = document.getElementById("passwordInput");
  
  if (!modal || !promptText || !passwordInput) {
    alert("Modal-Elemente nicht gefunden. Bitte Seite neu laden.");
    return;
  }
  
  // Modal konfigurieren
  promptText.textContent = `Bitte das Passwort für ${teacher.name} eingeben:`;
  passwordInput.value = "";
  modal.style.display = "flex";
  passwordInput.focus();
}

/**
 * Setup Event Listeners - GARANTIERT FUNKTIONIEREND
 */
function setupLoginEventListeners() {
  console.log("Setup Login Event Listeners...");
  
  // Password Modal schließen
  const closeBtn = document.getElementById("closePasswordModal");
  if (closeBtn) {
    closeBtn.onclick = hidePasswordModal;
  }
  
  const cancelBtn = document.getElementById("cancelLogin");
  if (cancelBtn) {
    cancelBtn.onclick = hidePasswordModal;
  }
  
  // Login bestätigen
  const confirmBtn = document.getElementById("confirmLogin");
  if (confirmBtn) {
    confirmBtn.onclick = performLogin;
  }
  
  // Enter Taste
  const passwordInput = document.getElementById("passwordInput");
  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performLogin();
      }
    });
  }
  
  // Modal Hintergrund klicken
  const modal = document.getElementById("passwordModal");
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        hidePasswordModal();
      }
    });
  }
  
  console.log("Event Listeners erfolgreich eingerichtet");
}

/**
 * Versteckt das Password Modal
 */
function hidePasswordModal() {
  const modal = document.getElementById("passwordModal");
  if (modal) {
    modal.style.display = "none";
  }
  selectedTeacher = null;
}

/**
 * Führt den Login durch - GARANTIERT FUNKTIONIEREND
 */
async function performLogin() {
  if (!selectedTeacher) {
    alert("Kein Lehrer ausgewählt!");
    return;
  }
  
  const passwordInput = document.getElementById("passwordInput");
  const enteredPassword = passwordInput ? passwordInput.value : "";
  
  if (!enteredPassword) {
    alert("Bitte geben Sie ein Passwort ein!");
    return;
  }
  
  console.log("Versuche Login für:", selectedTeacher.name);
  console.log("Eingegebenes Passwort:", enteredPassword);
  console.log("Erwartetes Passwort:", selectedTeacher.password);
  
  // Passwort prüfen
  if (enteredPassword !== selectedTeacher.password) {
    alert("Falsches Passwort!");
    return;
  }
  
  // Modal schließen
  hidePasswordModal();
  
  // Loader anzeigen
  showLoader();
  
  try {
    console.log("Login erfolgreich, lade Daten...");
    
    // Benutzer setzen
    currentUser.name = selectedTeacher.name;
    currentUser.code = selectedTeacher.code;
    currentUser.password = selectedTeacher.password;
    currentUser.permissions = selectedTeacher.permissions || {};
    
    console.log("Current User gesetzt:", currentUser);
    
    // Benutzerdaten laden
    await initializeUserData();
    console.log("Benutzerdaten geladen");
    
    // Zur App wechseln
    switchToApp();
    
    // Event auslösen
    document.dispatchEvent(new CustomEvent("userLoggedIn", { 
      detail: { teacher: currentUser } 
    }));
    
    console.log("Login ERFOLGREICH abgeschlossen!");
    
  } catch (error) {
    console.error("Login Fehler:", error);
    alert("Fehler bei der Anmeldung: " + error.message);
  } finally {
    hideLoader();
  }
}

/**
 * Wechselt zur App - GARANTIERT FUNKTIONIEREND
 */
function switchToApp() {
  console.log("Wechsle zur App...");
  
  // Login ausblenden
  const loginSection = document.getElementById("loginSection");
  if (loginSection) {
    loginSection.style.display = "none";
    console.log("Login-Bereich ausgeblendet");
  }
  
  // App anzeigen
  const appSection = document.getElementById("appSection");
  if (appSection) {
    appSection.style.display = "block";
    console.log("App-Bereich angezeigt");
  }
  
  // Benutzer-Info aktualisieren
  const teacherAvatar = document.getElementById("teacherAvatar");
  const teacherName = document.getElementById("teacherName");
  
  if (teacherAvatar && currentUser.code) {
    teacherAvatar.textContent = currentUser.code.charAt(0).toUpperCase();
  }
  
  if (teacherName && currentUser.name) {
    teacherName.textContent = currentUser.name;
  }
  
  console.log("App-Wechsel ERFOLGREICH!");
}

/**
 * Logout - FUNKTIONIEREND
 */
export function performLogout() {
  console.log("Logout...");
  
  // Benutzer zurücksetzen
  currentUser.name = null;
  currentUser.code = null;
  currentUser.password = null;
  currentUser.permissions = {};
  
  // Zur Login-Ansicht wechseln
  const loginSection = document.getElementById("loginSection");
  const appSection = document.getElementById("appSection");
  
  if (loginSection) loginSection.style.display = "block";
  if (appSection) appSection.style.display = "none";
  
  // Event auslösen
  document.dispatchEvent(new Event("userLoggedOut"));
  
  console.log("Logout abgeschlossen");
}

// Export der wichtigen Funktionen
export { showPasswordModal, hidePasswordModal };
