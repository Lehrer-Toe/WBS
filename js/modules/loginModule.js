// js/modules/loginModule.js - Mit Firebase Authentication
import { showLoader, hideLoader, showNotification, initTeacherGrid } from "../uiService.js";
import { currentUser } from "../dataService.js";
import { validateTeacher, allTeachers } from "../adminService.js";
import { initializeUserData } from "../dataService.js";
import { signInWithEmail, signOut, sendPasswordResetEmail } from "../authService.js";

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
  
  // NEU: E-Mail-Login-Elemente
  emailLoginSection: null,
  emailInput: null,
  passwordLoginInput: null,
  emailLoginBtn: null,
  forgotPasswordBtn: null,
  backToTeacherLoginBtn: null,
  showEmailLoginBtn: null
};

/**
 * Aktueller Login-Modus
 */
let loginMode = 'teachers'; // 'teachers' oder 'email'

/**
 * Initialisiert das Login-Modul
 */
export function initLoginModule() {
  // DOM-Elemente abrufen
  loadDOMElements();
  
  // Event-Listener hinzufügen
  setupEventListeners();
  
  // Login-Abschnitt erstellen/erweitern
  enhanceLoginSection();
  
  // Lehrer-Grid initialisieren
  initTeacherGrid(elements.teacherGrid, showPasswordModal, allTeachers);
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
 * Erweitert die Login-Sektion um E-Mail-Login
 */
function enhanceLoginSection() {
  if (!elements.loginSection) return;
  
  // Füge E-Mail-Login-Button hinzu, falls noch nicht vorhanden
  const container = elements.loginSection.querySelector('.container');
  if (!container) return;
  
  // E-Mail-Login-Button am Ende hinzufügen
  if (!document.getElementById('showEmailLoginBtn')) {
    const emailLoginBtnDiv = document.createElement('div');
    emailLoginBtnDiv.className = 'email-login-access';
    emailLoginBtnDiv.innerHTML = `
      <button id="showEmailLoginBtn" class="btn-secondary">Mit E-Mail anmelden</button>
    `;
    container.appendChild(emailLoginBtnDiv);
  }
  
  // E-Mail-Login-Sektion erstellen
  if (!document.getElementById('emailLoginSection')) {
    const emailSection = document.createElement('div');
    emailSection.id = 'emailLoginSection';
    emailSection.style.display = 'none';
    emailSection.innerHTML = `
      <header>
        <h1>Zeig, was du kannst!</h1>
        <div class="version">v2.0</div>
      </header>
      
      <div class="container animate-fade-in">
        <h2>Anmeldung mit E-Mail</h2>
        
        <div class="email-login-form">
          <div class="form-group">
            <label for="emailInput">E-Mail-Adresse</label>
            <input type="email" id="emailInput" placeholder="ihre.email@beispiel.de" required>
          </div>
          <div class="form-group">
            <label for="passwordLoginInput">Passwort</label>
            <input type="password" id="passwordLoginInput" placeholder="Ihr Passwort" required>
          </div>
          <div class="login-actions">
            <button id="emailLoginBtn" class="btn-primary">Anmelden</button>
            <button id="forgotPasswordBtn" class="btn-link">Passwort vergessen?</button>
          </div>
          <div class="login-divider">
            <button id="backToTeacherLoginBtn" class="btn-secondary">Zurück zur Lehrerauswahl</button>
          </div>
        </div>
      </div>
    `;
    
    // Nach Login-Section einfügen
    elements.loginSection.parentNode.insertBefore(emailSection, elements.loginSection.nextSibling);
    
    // Neue Elemente referenzieren
    elements.emailLoginSection = emailSection;
    elements.emailInput = document.getElementById('emailInput');
    elements.passwordLoginInput = document.getElementById('passwordLoginInput');
    elements.emailLoginBtn = document.getElementById('emailLoginBtn');
    elements.forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
    elements.backToTeacherLoginBtn = document.getElementById('backToTeacherLoginBtn');
    elements.showEmailLoginBtn = document.getElementById('showEmailLoginBtn');
  }
}

/**
 * Richtet die Event-Listener ein
 */
function setupEventListeners() {
  // Bestehende Event-Listener
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

  // NEU: E-Mail-Login Event-Listener
  setTimeout(() => {
    // E-Mail-Login anzeigen
    const showEmailBtn = document.getElementById('showEmailLoginBtn');
    if (showEmailBtn) {
      showEmailBtn.addEventListener("click", () => {
        elements.loginSection.style.display = "none";
        elements.emailLoginSection.style.display = "block";
        loginMode = 'email';
        if (elements.emailInput) {
          elements.emailInput.focus();
        }
      });
    }

    // Zurück zur Lehrerauswahl
    if (elements.backToTeacherLoginBtn) {
      elements.backToTeacherLoginBtn.addEventListener("click", () => {
        elements.emailLoginSection.style.display = "none";
        elements.loginSection.style.display = "block";
        loginMode = 'teachers';
      });
    }

    // E-Mail-Login
    if (elements.emailLoginBtn) {
      elements.emailLoginBtn.addEventListener("click", performEmailLogin);
    }

    // Enter-Taste für E-Mail-Login
    if (elements.passwordLoginInput) {
      elements.passwordLoginInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          performEmailLogin();
        }
      });
    }

    // Passwort vergessen
    if (elements.forgotPasswordBtn) {
      elements.forgotPasswordBtn.addEventListener("click", handleForgotPassword);
    }
  }, 100);
}

/**
 * Zeigt den Passwort-Dialog für einen Lehrer (Legacy-Modus)
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
 * Führt den Login-Prozess durch (Legacy-Modus mit Firebase-Fallback)
 */
async function performLogin() {
  const enteredPassword = elements.passwordInput.value;
  
  // Validiere das Passwort lokal
  if (enteredPassword !== currentUser.password) {
    showNotification("Falsches Passwort!", "error");
    return;
  }
  
  // Schließe den Modal
  elements.passwordModal.style.display = "none";
  
  showLoader();
  
  try {
    // Versuche Firebase-Login mit vordefinierter E-Mail
    const email = `${currentUser.code.toLowerCase()}@wbs-app.local`;
    
    try {
      await signInWithEmail(email, enteredPassword);
      console.log("Firebase-Login erfolgreich");
    } catch (firebaseError) {
      console.warn("Firebase-Login fehlgeschlagen, fahre mit lokalem Login fort:", firebaseError);
      // Fahre mit lokalem Login fort
    }
    
    // Überprüfe den Lehrer gegen die Datenbank
    const validTeacher = validateTeacher(currentUser.code, enteredPassword);
    
    if (!validTeacher) {
      throw new Error("Ungültiger Benutzer");
    }
    
    // Lade Benutzerdaten
    await initializeUserData();
    
    // Zeige die App-Oberfläche
    showAppInterface();
    
    showNotification(`Willkommen, ${currentUser.name}!`);
  } catch (error) {
    console.error("Login-Fehler:", error);
    showNotification("Fehler bei der Anmeldung. Bitte versuchen Sie es erneut.", "error");
    
    // Setze den aktuellen Benutzer zurück
    resetCurrentUser();
  } finally {
    hideLoader();
  }
}

/**
 * NEU: Führt E-Mail-Login durch
 */
async function performEmailLogin() {
  const email = elements.emailInput?.value?.trim();
  const password = elements.passwordLoginInput?.value;
  
  if (!email || !password) {
    showNotification("Bitte alle Felder ausfüllen.", "warning");
    return;
  }
  
  showLoader();
  
  try {
    // Firebase-Login
    await signInWithEmail(email, password);
    
    // Lade Benutzerdaten
    await initializeUserData();
    
    // Zeige die App-Oberfläche
    elements.emailLoginSection.style.display = "none";
    showAppInterface();
    
    showNotification(`Willkommen, ${currentUser.name || email}!`);
  } catch (error) {
    console.error("E-Mail-Login-Fehler:", error);
    showNotification(error.message || "Fehler bei der Anmeldung.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * NEU: Behandelt "Passwort vergessen"
 */
async function handleForgotPassword() {
  const email = elements.emailInput?.value?.trim();
  
  if (!email) {
    showNotification("Bitte geben Sie Ihre E-Mail-Adresse ein.", "warning");
    elements.emailInput?.focus();
    return;
  }
  
  if (!confirm(`Möchten Sie ein neues Passwort an ${email} senden?`)) {
    return;
  }
  
  showLoader();
  
  try {
    await sendPasswordResetEmail(email);
    showNotification("Eine E-Mail zum Zurücksetzen des Passworts wurde gesendet.", "success");
  } catch (error) {
    console.error("Fehler beim Senden der Reset-E-Mail:", error);
    showNotification(error.message || "Fehler beim Senden der E-Mail.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Zeigt die App-Oberfläche
 */
function showAppInterface() {
  elements.loginSection.style.display = "none";
  elements.appSection.style.display = "block";
  
  // Aktualisiere die Benutzeranzeige
  if (elements.teacherAvatar) {
    elements.teacherAvatar.textContent = currentUser.code ? currentUser.code.charAt(0) : 'U';
  }
  if (elements.teacherName) {
    elements.teacherName.textContent = currentUser.name || currentUser.email || 'Benutzer';
  }
  
  // Trigger ein benutzerdefiniertes Event für den erfolgreichen Login
  const event = new CustomEvent("userLoggedIn", { 
    detail: { teacher: currentUser } 
  });
  document.dispatchEvent(event);
}

/**
 * Setzt den aktuellen Benutzer zurück
 */
function resetCurrentUser() {
  currentUser.name = null;
  currentUser.code = null;
  currentUser.password = null;
  currentUser.email = null;
  currentUser.uid = null;
  currentUser.permissions = {};
}

/**
 * Führt den Logout-Prozess durch
 */
export async function performLogout() {
  showLoader();
  
  try {
    // Firebase-Logout
    await signOut();
  } catch (error) {
    console.error("Fehler beim Firebase-Logout:", error);
  }
  
  // Setze den aktuellen Benutzer zurück
  resetCurrentUser();
  
  // Zeige die Login-Oberfläche
  elements.loginSection.style.display = "block";
  elements.appSection.style.display = "none";
  elements.emailLoginSection.style.display = "none";
  loginMode = 'teachers';
  
  // Trigger ein benutzerdefiniertes Event für den Logout
  document.dispatchEvent(new Event("userLoggedOut"));
  
  hideLoader();
  showNotification("Abmeldung erfolgreich.");
}

// CSS für E-Mail-Login hinzufügen
const style = document.createElement('style');
style.textContent = `
  .email-login-access {
    border-top: 1px solid var(--border-color);
    padding-top: 1rem;
    margin-top: 2rem;
    text-align: center;
  }
  
  .email-login-form {
    max-width: 400px;
    margin: 0 auto;
  }
  
  .login-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 20px;
  }
  
  .btn-link {
    background: none;
    border: none;
    color: var(--primary-color);
    text-decoration: underline;
    cursor: pointer;
    padding: 8px;
  }
  
  .btn-link:hover {
    color: var(--primary-light);
  }
  
  .login-divider {
    margin-top: 30px;
    padding-top: 20px;
    border-top: 1px solid var(--border-color);
    text-align: center;
  }
`;
document.head.appendChild(style);
