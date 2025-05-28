// js/modules/newLoginModule.js - Temporäres Setup für erweiterte Login-Funktionalität

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
 * Erweiterte Login-Konfiguration
 */
const loginConfig = {
  maxRetries: 3,
  retryCount: 0,
  lockoutTime: 300000, // 5 Minuten
  lastFailedAttempt: null,
  sessionTimeout: 3600000, // 1 Stunde
  rememberLogin: false
};

/**
 * Initialisiert das erweiterte Login-Modul
 */
export function initNewLoginModule() {
  console.log("Initialisiere erweitertes Login-Modul...");
  
  // DOM-Elemente abrufen
  loadDOMElements();
  
  // Event-Listener hinzufügen
  setupEventListeners();
  
  // Session-Management initialisieren
  initSessionManagement();
  
  // Lehrer-Grid initialisieren
  initTeacherGrid(elements.teacherGrid, showPasswordModal, allTeachers);
  
  console.log("Erweitertes Login-Modul initialisiert");
}

/**
 * Lädt alle DOM-Elemente
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
}

/**
 * Richtet die Event-Listener ein
 */
function setupEventListeners() {
  if (elements.closePasswordModalBtn) {
    elements.closePasswordModalBtn.addEventListener("click", () => {
      elements.passwordModal.style.display = "none";
      resetLoginAttempt();
    });
  }

  if (elements.cancelLoginBtn) {
    elements.cancelLoginBtn.addEventListener("click", () => {
      elements.passwordModal.style.display = "none";
      resetLoginAttempt();
    });
  }

  if (elements.confirmLoginBtn) {
    elements.confirmLoginBtn.addEventListener("click", performEnhancedLogin);
  }

  if (elements.passwordInput) {
    elements.passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performEnhancedLogin();
      }
    });
    
    // Eingabe-Validierung in Echtzeit
    elements.passwordInput.addEventListener("input", (e) => {
      validatePasswordInput(e.target.value);
    });
  }
}

/**
 * Zeigt den Passwort-Dialog für einen Lehrer (erweitert)
 */
export function showPasswordModal(teacher) {
  // Prüfe Lockout-Status
  if (isAccountLocked()) {
    const remainingTime = getRemainingLockoutTime();
    showNotification(`Account gesperrt. Versuchen Sie es in ${Math.ceil(remainingTime / 60000)} Minuten erneut.`, "error");
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
  
  // Zeige zusätzliche Informationen
  showTeacherInfo(teacher);
}

/**
 * Zeigt zusätzliche Lehrer-Informationen
 */
function showTeacherInfo(teacher) {
  // Erstelle Info-Panel falls nicht vorhanden
  let infoPanel = document.getElementById("teacherInfoPanel");
  if (!infoPanel) {
    infoPanel = document.createElement("div");
    infoPanel.id = "teacherInfoPanel";
    infoPanel.className = "teacher-info-panel";
    elements.passwordModal.querySelector(".modal-content").appendChild(infoPanel);
  }
  
  // Berechtigungen anzeigen
  const permissions = teacher.permissions || {};
  const canCreateThemes = permissions.canCreateThemes ? "✓" : "✗";
  
  infoPanel.innerHTML = `
    <div class="teacher-info-content">
      <h4>Benutzer-Informationen</h4>
      <p><strong>Name:</strong> ${teacher.name}</p>
      <p><strong>Kürzel:</strong> ${teacher.code}</p>
      <p><strong>Themen erstellen:</strong> ${canCreateThemes}</p>
      <p><strong>Anmeldeversuche:</strong> ${loginConfig.retryCount}/${loginConfig.maxRetries}</p>
    </div>
  `;
}

/**
 * Führt den erweiterten Login-Prozess durch
 */
async function performEnhancedLogin() {
  const enteredPassword = elements.passwordInput.value;
  
  // Eingabe-Validierung
  if (!enteredPassword.trim()) {
    showNotification("Bitte geben Sie ein Passwort ein.", "warning");
    return;
  }
  
  // Prüfe Lockout-Status
  if (isAccountLocked()) {
    showNotification("Account ist gesperrt. Bitte warten Sie.", "error");
    return;
  }
  
  // Zeige Ladebildschirm
  showLoader();
  
  try {
    // Simuliere Authentifizierungs-Delay (Sicherheit)
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Validiere das Passwort
    if (enteredPassword !== currentUser.password) {
      handleFailedLogin();
      return;
    }
    
    // Erfolgreicher Login
    await handleSuccessfulLogin();
    
  } catch (error) {
    console.error("Login-Fehler:", error);
    showNotification("Unerwarteter Fehler bei der Anmeldung. Bitte versuchen Sie es erneut.", "error");
    
    // Setze den aktuellen Benutzer zurück
    resetCurrentUser();
  } finally {
    hideLoader();
  }
}

/**
 * Behandelt fehlgeschlagene Login-Versuche
 */
function handleFailedLogin() {
  loginConfig.retryCount++;
  loginConfig.lastFailedAttempt = Date.now();
  
  const remainingAttempts = loginConfig.maxRetries - loginConfig.retryCount;
  
  if (remainingAttempts > 0) {
    showNotification(`Falsches Passwort! Noch ${remainingAttempts} Versuche möglich.`, "error");
    
    // Aktualisiere Info-Panel
    const infoPanel = document.getElementById("teacherInfoPanel");
    if (infoPanel) {
      const attemptsElement = infoPanel.querySelector("p:last-child");
      if (attemptsElement) {
        attemptsElement.innerHTML = `<strong>Anmeldeversuche:</strong> ${loginConfig.retryCount}/${loginConfig.maxRetries}`;
      }
    }
  } else {
    // Account sperren
    showNotification(`Account gesperrt für ${loginConfig.lockoutTime / 60000} Minuten.`, "error");
    elements.passwordModal.style.display = "none";
    
    // Lockout-Timer starten
    setTimeout(() => {
      resetLoginAttempt();
      showNotification("Account entsperrt. Sie können sich wieder anmelden.", "info");
    }, loginConfig.lockoutTime);
  }
  
  // Passwort-Feld leeren
  elements.passwordInput.value = "";
  elements.passwordInput.focus();
}

/**
 * Behandelt erfolgreiche Anmeldung
 */
async function handleSuccessfulLogin() {
  // Schließe den Modal
  elements.passwordModal.style.display = "none";
  
  try {
    // Überprüfe den Lehrer gegen die Datenbank
    const validTeacher = validateTeacher(currentUser.code, currentUser.password);
    
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
    
    // Session-Management
    startSessionTimer();
    
    // Reset Login-Versuche
    resetLoginAttempt();
    
    // Trigger ein benutzerdefiniertes Event für den erfolgreichen Login
    const event = new CustomEvent("userLoggedIn", { 
      detail: { 
        teacher: currentUser,
        timestamp: Date.now(),
        enhanced: true
      }
    });
    document.dispatchEvent(event);
    
    showNotification(`Willkommen, ${currentUser.name}!`, "success");
    
    // Zusätzliche Setup nach Login
    await postLoginSetup();
    
  } catch (error) {
    console.error("Post-Login-Fehler:", error);
    showNotification("Fehler bei der Anmeldung. Bitte versuchen Sie es erneut.", "error");
    resetCurrentUser();
  }
}

/**
 * Zusätzliche Setup-Aktionen nach erfolgreichem Login
 */
async function postLoginSetup() {
  try {
    // Prüfe auf verfügbare Updates
    await checkForUpdates();
    
    // Lade Benutzer-spezifische Einstellungen
    await loadUserPreferences();
    
    // Prüfe System-Status
    await checkSystemHealth();
    
  } catch (error) {
    console.warn("Fehler beim Post-Login-Setup:", error);
    // Nicht kritisch, also nicht den Login unterbrechen
  }
}

/**
 * Prüft auf verfügbare System-Updates
 */
async function checkForUpdates() {
  // Placeholder für Update-Check-Logik
  console.log("Prüfe auf Updates...");
}

/**
 * Lädt Benutzer-spezifische Einstellungen
 */
async function loadUserPreferences() {
  // Placeholder für Benutzereinstellungen
  console.log("Lade Benutzereinstellungen...");
}

/**
 * Prüft den System-Status
 */
async function checkSystemHealth() {
  // Placeholder für System-Gesundheitsprüfung
  console.log("Prüfe System-Status...");
}

/**
 * Initialisiert das Session-Management
 */
function initSessionManagement() {
  // Prüfe auf bestehende Session
  const existingSession = localStorage.getItem('wbs_session');
  if (existingSession) {
    try {
      const sessionData = JSON.parse(existingSession);
      if (isSessionValid(sessionData)) {
        console.log("Gültige Session gefunden");
        // Hier könnte Auto-Login implementiert werden
      }
    } catch (error) {
      console.warn("Ungültige Session-Daten:", error);
      localStorage.removeItem('wbs_session');
    }
  }
}

/**
 * Startet den Session-Timer
 */
function startSessionTimer() {
  // Session-Daten speichern
  const sessionData = {
    teacherCode: currentUser.code,
    loginTime: Date.now(),
    expires: Date.now() + loginConfig.sessionTimeout
  };
  
  localStorage.setItem('wbs_session', JSON.stringify(sessionData));
  
  // Auto-Logout nach Session-Timeout
  setTimeout(() => {
    if (currentUser.code) {
      showNotification("Session abgelaufen. Bitte melden Sie sich erneut an.", "warning");
      performEnhancedLogout();
    }
  }, loginConfig.sessionTimeout);
}

/**
 * Prüft, ob eine Session gültig ist
 */
function isSessionValid(sessionData) {
  return sessionData && 
         sessionData.expires && 
         Date.now() < sessionData.expires &&
         sessionData.teacherCode;
}

/**
 * Führt den erweiterten Logout-Prozess durch
 */
export function performEnhancedLogout() {
  // Session-Daten löschen
  localStorage.removeItem('wbs_session');
  
  // Setze den aktuellen Benutzer zurück
  resetCurrentUser();
  
  // Zeige die Login-Oberfläche
  elements.loginSection.style.display = "block";
  elements.appSection.style.display = "none";
  
  // Reset Login-Status
  resetLoginAttempt();
  
  // Trigger ein benutzerdefiniertes Event für den Logout
  document.dispatchEvent(new CustomEvent("userLoggedOut", {
    detail: { enhanced: true, timestamp: Date.now() }
  }));
  
  showNotification("Abmeldung erfolgreich.", "success");
}

/**
 * Validiert Passwort-Eingabe in Echtzeit
 */
function validatePasswordInput(password) {
  const strength = getPasswordStrength(password);
  
  // Visuelles Feedback (optional)
  if (password.length > 0) {
    elements.passwordInput.style.borderColor = strength.color;
  } else {
    elements.passwordInput.style.borderColor = "";
  }
}

/**
 * Berechnet die Passwort-Stärke
 */
function getPasswordStrength(password) {
  if (password.length < 3) {
    return { strength: 'weak', color: '#ff4444' };
  } else if (password.length < 6) {
    return { strength: 'medium', color: '#ffaa00' };
  } else {
    return { strength: 'strong', color: '#44ff44' };
  }
}

/**
 * Prüft, ob der Account gesperrt ist
 */
function isAccountLocked() {
  return loginConfig.retryCount >= loginConfig.maxRetries && 
         loginConfig.lastFailedAttempt && 
         (Date.now() - loginConfig.lastFailedAttempt) < loginConfig.lockoutTime;
}

/**
 * Gibt die verbleibende Sperrzeit zurück
 */
function getRemainingLockoutTime() {
  if (!loginConfig.lastFailedAttempt) return 0;
  
  const elapsed = Date.now() - loginConfig.lastFailedAttempt;
  return Math.max(0, loginConfig.lockoutTime - elapsed);
}

/**
 * Setzt Login-Versuche zurück
 */
function resetLoginAttempt() {
  loginConfig.retryCount = 0;
  loginConfig.lastFailedAttempt = null;
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

// Event-Listener für Sicherheits-Events
document.addEventListener('visibilitychange', () => {
  if (document.hidden && currentUser.code) {
    console.log("Anwendung in den Hintergrund gewechselt");
    // Hier könnte eine Auto-Sperre implementiert werden
  }
});

// Keyboard-Shortcuts
document.addEventListener('keydown', (e) => {
  // Strg+Alt+L für schnellen Logout
  if (e.ctrlKey && e.altKey && e.key === 'l') {
    if (currentUser.code) {
      e.preventDefault();
      performEnhancedLogout();
    }
  }
});

console.log("Erweitertes Login-Modul geladen");
