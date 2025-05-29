// js/modules/loginModule.js - E-MAIL LOGIN SYSTEM
import { showLoader, hideLoader, showNotification } from "../uiService.js";
import { currentUser } from "../dataService.js";
import { validateTeacher, allTeachers } from "../adminService.js";
import { initializeUserData } from "../dataService.js";

/**
 * E-Mail-basiertes Login-System - FUNKTIONIEREND
 */

let loginForm = null;

/**
 * Initialisiert das E-Mail-Login-System
 */
export function initLoginModule() {
  console.log("=== INITIALISIERE E-MAIL LOGIN ===");
  
  // Warte bis DOM fertig ist
  if (document.readyState !== 'complete') {
    window.addEventListener('load', initLoginModule);
    return;
  }
  
  // Erstelle E-Mail-Login-Formular
  createEmailLoginForm();
  
  // Setup Event Listeners
  setupEmailLoginEvents();
  
  console.log("✅ E-Mail-Login erfolgreich initialisiert");
}

/**
 * Erstellt das E-Mail-Login-Formular
 */
function createEmailLoginForm() {
  console.log("Erstelle E-Mail-Login-Formular...");
  
  const container = document.querySelector("#loginSection .container");
  if (!container) {
    console.error("Container nicht gefunden!");
    return;
  }
  
  // Entferne alle alten Login-Elemente
  const oldGrid = document.getElementById("teacherGrid");
  if (oldGrid) oldGrid.remove();
  
  const oldForm = document.getElementById("emailLoginForm");
  if (oldForm) oldForm.remove();
  
  // Erstelle neues E-Mail-Login-Formular
  const formHTML = `
    <div id="emailLoginForm" class="email-login-form">
      <h2>🔐 Anmeldung</h2>
      <div class="login-description">
        <p>Bitte melden Sie sich mit Ihren Zugangsdaten an:</p>
      </div>
      
      <form id="loginForm" class="login-form">
        <div class="form-group">
          <label for="loginEmail">📧 E-Mail oder Benutzername</label>
          <input type="text" id="loginEmail" name="email" required 
                 placeholder="ihre.email@schule.de oder Kürzel" 
                 autocomplete="username">
        </div>
        
        <div class="form-group">
          <label for="loginPassword">🔑 Passwort</label>
          <input type="password" id="loginPassword" name="password" required 
                 placeholder="Ihr Passwort" 
                 autocomplete="current-password">
        </div>
        
        <button type="submit" id="loginSubmit" class="login-button">
          🚀 Anmelden
        </button>
        
        <div class="login-help">
          <small>💡 Verwenden Sie Ihr Lehrerkürzel und das Passwort "Luna"</small>
        </div>
      </form>
    </div>
  `;
  
  // CSS für das Login-Formular
  const loginStyles = `
    <style>
    .email-login-form {
      max-width: 400px;
      margin: 0 auto;
      padding: 30px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      border: 1px solid #e0e0e0;
    }
    
    .email-login-form h2 {
      text-align: center;
      color: #34495e;
      margin-bottom: 20px;
      font-size: 24px;
    }
    
    .login-description {
      text-align: center;
      margin-bottom: 25px;
      color: #666;
    }
    
    .login-form .form-group {
      margin-bottom: 20px;
    }
    
    .login-form label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #34495e;
      font-size: 14px;
    }
    
    .login-form input {
      width: 100%;
      padding: 12px 15px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: all 0.3s ease;
      box-sizing: border-box;
    }
    
    .login-form input:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.2);
    }
    
    .login-button {
      width: 100%;
      padding: 15px;
      background: #3498db;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 10px;
    }
    
    .login-button:hover {
      background: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }
    
    .login-button:active {
      transform: translateY(0);
    }
    
    .login-help {
      text-align: center;
      margin-top: 15px;
      padding: 10px;
      background: #f8f9fa;
      border-radius: 5px;
      border-left: 4px solid #3498db;
    }
    
    .login-help small {
      color: #666;
      font-size: 13px;
    }
    </style>
  `;
  
  // Styles hinzufügen
  if (!document.getElementById('email-login-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'email-login-styles';
    styleElement.innerHTML = loginStyles;
    document.head.appendChild(styleElement);
  }
  
  // Formular vor dem Password Modal einfügen
  const passwordModal = document.getElementById("passwordModal");
  if (passwordModal) {
    container.insertBefore(document.createElement('div'), passwordModal);
    container.lastElementChild.outerHTML = formHTML;
  } else {
    container.innerHTML = formHTML + container.innerHTML;
  }
  
  loginForm = document.getElementById("loginForm");
  console.log("✅ E-Mail-Login-Formular erstellt");
}

/**
 * Setup Event Listeners für E-Mail-Login
 */
function setupEmailLoginEvents() {
  if (!loginForm) {
    console.error("Login-Formular nicht gefunden!");
    return;
  }
  
  loginForm.addEventListener("submit", handleEmailLogin);
  
  // Enter-Taste in beiden Feldern
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  
  [emailInput, passwordInput].forEach(input => {
    if (input) {
      input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          handleEmailLogin(e);
        }
      });
    }
  });
  
  console.log("✅ E-Mail-Login Event Listeners eingerichtet");
}

/**
 * Behandelt E-Mail-Login
 */
async function handleEmailLogin(event) {
  event.preventDefault();
  
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  const submitButton = document.getElementById("loginSubmit");
  
  if (!emailInput || !passwordInput) {
    alert("Login-Felder nicht gefunden!");
    return;
  }
  
  const emailOrCode = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!emailOrCode || !password) {
    showNotification("Bitte füllen Sie alle Felder aus!", "warning");
    return;
  }
  
  console.log("🔐 Login-Versuch:", emailOrCode);
  
  // Button deaktivieren
  if (submitButton) {
    submitButton.disabled = true;
    submitButton.textContent = "⏳ Wird angemeldet...";
  }
  
  // Loader anzeigen
  showLoader();
  
  try {
    // Finde passenden Lehrer
    const teacher = findTeacherByEmailOrCode(emailOrCode, password);
    
    if (!teacher) {
      throw new Error("Ungültige Anmeldedaten");
    }
    
    console.log("✅ Lehrer gefunden:", teacher.name);
    
    // Benutzer setzen
    currentUser.name = teacher.name;
    currentUser.code = teacher.code;
    currentUser.password = teacher.password;
    currentUser.permissions = teacher.permissions || {};
    
    console.log("👤 Benutzer gesetzt:", currentUser.name);
    
    // Benutzerdaten laden
    await initializeUserData();
    console.log("📊 Benutzerdaten geladen");
    
    // Zur App wechseln
    switchToMainApp();
    
    // Event auslösen
    document.dispatchEvent(new CustomEvent("userLoggedIn", { 
      detail: { teacher: currentUser } 
    }));
    
    console.log("🎉 LOGIN ERFOLGREICH!");
    showNotification(`Willkommen, ${currentUser.name}!`, "success");
    
  } catch (error) {
    console.error("❌ Login-Fehler:", error);
    showNotification(error.message, "error");
    
    // Felder zurücksetzen
    passwordInput.value = "";
    emailInput.focus();
    
  } finally {
    // Loader ausblenden
    hideLoader();
    
    // Button wieder aktivieren
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = "🚀 Anmelden";
    }
  }
}

/**
 * Findet Lehrer anhand E-Mail oder Code
 */
function findTeacherByEmailOrCode(emailOrCode, password) {
  if (!allTeachers || allTeachers.length === 0) {
    console.error("Keine Lehrer verfügbar!");
    return null;
  }
  
  // Suche nach Code (Kürzel)
  let teacher = allTeachers.find(t => 
    t.code && t.code.toLowerCase() === emailOrCode.toLowerCase()
  );
  
  // Suche nach Name (falls kein Code gefunden)
  if (!teacher) {
    teacher = allTeachers.find(t => 
      t.name && t.name.toLowerCase().includes(emailOrCode.toLowerCase())
    );
  }
  
  // Passwort prüfen
  if (teacher && teacher.password === password) {
    return teacher;
  }
  
  console.log("🔍 Lehrer-Suche für:", emailOrCode, "Gefunden:", !!teacher, "Passwort OK:", teacher ? teacher.password === password : false);
  return null;
}

/**
 * Wechselt zur Hauptanwendung - GARANTIERT FUNKTIONIEREND
 */
function switchToMainApp() {
  console.log("🔄 Wechsle zur Hauptanwendung...");
  
  // Alle Loader verstecken
  const allLoaders = document.querySelectorAll("#mainLoader, .loader-container, .loader");
  allLoaders.forEach(loader => {
    loader.style.display = "none";
  });
  
  // Login-Bereich ausblenden
  const loginSection = document.getElementById("loginSection");
  if (loginSection) {
    loginSection.style.display = "none";
    console.log("✅ Login-Bereich ausgeblendet");
  }
  
  // App-Bereich anzeigen
  const appSection = document.getElementById("appSection");
  if (appSection) {
    appSection.style.display = "block";
    console.log("✅ App-Bereich angezeigt");
  }
  
  // Benutzer-Info in Header aktualisieren
  updateHeaderUserInfo();
  
  console.log("🎯 App-Wechsel ABGESCHLOSSEN!");
}

/**
 * Aktualisiert Benutzer-Info im Header
 */
function updateHeaderUserInfo() {
  const teacherAvatar = document.getElementById("teacherAvatar");
  const teacherName = document.getElementById("teacherName");
  
  if (teacherAvatar && currentUser.code) {
    teacherAvatar.textContent = currentUser.code.charAt(0).toUpperCase();
  }
  
  if (teacherName && currentUser.name) {
    teacherName.textContent = currentUser.name;
  }
  
  console.log("👤 Header-Benutzerinfo aktualisiert");
}

/**
 * Logout-Funktion
 */
export function performLogout() {
  console.log("🚪 Logout wird durchgeführt...");
  
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
  
  // Login-Felder zurücksetzen
  const emailInput = document.getElementById("loginEmail");
  const passwordInput = document.getElementById("loginPassword");
  if (emailInput) emailInput.value = "";
  if (passwordInput) passwordInput.value = "";
  
  // Event auslösen
  document.dispatchEvent(new Event("userLoggedOut"));
  
  showNotification("Erfolgreich abgemeldet.", "success");
  console.log("✅ Logout abgeschlossen");
}

// Dummy-Funktionen für Kompatibilität
export function showPasswordModal() {
  console.log("showPasswordModal - nicht mehr verwendet");
}

export function hidePasswordModal() {
  console.log("hidePasswordModal - nicht mehr verwendet");
}
