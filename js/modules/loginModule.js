// js/modules/loginModule.js - FINALE FUNKTIONIERENDE VERSION
import { showLoader, hideLoader, showNotification } from "../uiService.js";
import { currentUser } from "../dataService.js";
import { validateTeacher, allTeachers } from "../adminService.js";
import { initializeUserData } from "../dataService.js";

// Global variables
let isInitialized = false;

/**
 * HAUPTINITIALISIERUNG - GARANTIERT FUNKTIONIEREND
 */
export function initLoginModule() {
  console.log("🔐 === STARTE E-MAIL LOGIN SYSTEM ===");
  
  // Verhindere doppelte Initialisierung
  if (isInitialized) {
    console.log("⚠️ Login bereits initialisiert - überspringe");
    return;
  }
  
  // Warte bis DOM vollständig geladen
  if (document.readyState !== 'complete') {
    console.log("⏳ DOM nicht bereit - warte auf Load-Event");
    window.addEventListener('load', initLoginModule);
    return;
  }
  
  try {
    // Schritt 1: Alte Elemente entfernen
    console.log("🧹 Schritt 1: Alte Elemente entfernen");
    removeOldLoginElements();
    
    // Schritt 2: E-Mail-Login-Formular erstellen
    console.log("📝 Schritt 2: E-Mail-Login-Formular erstellen");
    createEmailLoginForm();
    
    // Schritt 3: Event-Listener einrichten
    console.log("🔗 Schritt 3: Event-Listener einrichten");
    setupEventListeners();
    
    // Schritt 4: Debug-Info ausgeben
    console.log("🔍 Schritt 4: Debug-Info");
    logDebugInfo();
    
    isInitialized = true;
    console.log("✅ E-MAIL LOGIN SYSTEM ERFOLGREICH INITIALISIERT!");
    
  } catch (error) {
    console.error("💥 FEHLER bei Login-Initialisierung:", error);
    showFallbackLogin();
  }
}

/**
 * Entfernt alle alten Login-Elemente
 */
function removeOldLoginElements() {
  const elementsToRemove = [
    'teacherGrid',
    'passwordModal',
    'emailLoginForm'
  ];
  
  elementsToRemove.forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      console.log(`🗑️ Entferne altes Element: ${id}`);
      element.remove();
    }
  });
}

/**
 * Erstellt das E-Mail-Login-Formular
 */
function createEmailLoginForm() {
  const container = document.querySelector("#loginSection .container");
  if (!container) {
    throw new Error("Login-Container nicht gefunden!");
  }
  
  // Erstelle Formular-HTML
  const formHTML = `
    <div id="emailLoginForm" class="email-login-form">
      <div class="login-header">
        <h2>🔐 Anmeldung</h2>
        <p>Melden Sie sich mit Ihren Zugangsdaten an</p>
      </div>
      
      <form id="actualLoginForm" class="actual-login-form">
        <div class="input-group">
          <label for="userInput">👤 Benutzername / Kürzel</label>
          <input 
            type="text" 
            id="userInput" 
            name="username" 
            required 
            placeholder="z.B. KRE, TOE, RIF"
            autocomplete="username"
            autocapitalize="off"
          >
        </div>
        
        <div class="input-group">
          <label for="passInput">🔑 Passwort</label>
          <input 
            type="password" 
            id="passInput" 
            name="password" 
            required 
            placeholder="Ihr Passwort"
            autocomplete="current-password"
          >
        </div>
        
        <button type="submit" id="submitBtn" class="submit-button">
          🚀 Anmelden
        </button>
        
        <div class="login-hints">
          <div class="hint-box">
            <strong>💡 Testzugänge:</strong><br>
            <code>KRE</code> / <code>TOE</code> / <code>RIF</code> + Passwort <code>Luna</code>
          </div>
        </div>
      </form>
    </div>
  `;
  
  // CSS hinzufügen
  addEmailLoginCSS();
  
  // Formular einfügen
  const adminAccess = container.querySelector('.admin-access');
  if (adminAccess) {
    adminAccess.insertAdjacentHTML('beforebegin', formHTML);
  } else {
    container.innerHTML = formHTML + container.innerHTML;
  }
  
  console.log("✅ E-Mail-Login-Formular erstellt");
}

/**
 * Fügt CSS für das E-Mail-Login hinzu
 */
function addEmailLoginCSS() {
  if (document.getElementById('email-login-css')) return;
  
  const css = `
    <style id="email-login-css">
    .email-login-form {
      max-width: 450px;
      margin: 2rem auto;
      background: white;
      border-radius: 15px;
      padding: 2rem;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
      border: 1px solid #e0e0e0;
    }
    
    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .login-header h2 {
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
      font-size: 1.8rem;
    }
    
    .login-header p {
      color: #666;
      margin: 0;
    }
    
    .actual-login-form {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .input-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .input-group label {
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.9rem;
    }
    
    .input-group input {
      padding: 0.9rem 1rem;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: white;
    }
    
    .input-group input:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }
    
    .submit-button {
      padding: 1rem 2rem;
      background: linear-gradient(135deg, #3498db, #2980b9);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 0.5rem;
    }
    
    .submit-button:hover {
      background: linear-gradient(135deg, #2980b9, #1f618d);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(52, 152, 219, 0.3);
    }
    
    .submit-button:active {
      transform: translateY(0);
    }
    
    .submit-button:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .login-hints {
      margin-top: 1rem;
    }
    
    .hint-box {
      background: #f8f9fa;
      border: 1px solid #dee2e6;
      border-left: 4px solid #3498db;
      padding: 1rem;
      border-radius: 0 8px 8px 0;
      font-size: 0.85rem;
      line-height: 1.5;
    }
    
    .hint-box code {
      background: #e9ecef;
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      color: #495057;
    }
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', css);
}

/**
 * Richtet Event-Listener ein
 */
function setupEventListeners() {
  const form = document.getElementById('actualLoginForm');
  const userInput = document.getElementById('userInput');
  const passInput = document.getElementById('passInput');
  const submitBtn = document.getElementById('submitBtn');
  
  if (!form || !userInput || !passInput || !submitBtn) {
    console.error("❌ Kritische Login-Elemente nicht gefunden!");
    console.log("Form:", !!form, "UserInput:", !!userInput, "PassInput:", !!passInput, "SubmitBtn:", !!submitBtn);
    return;
  }
  
  console.log("✅ Alle Login-Elemente gefunden");
  
  // Form Submit Event
  form.addEventListener('submit', handleFormSubmit);
  console.log("✅ Form Submit Event hinzugefügt");
  
  // Enter-Taste in beiden Input-Feldern
  [userInput, passInput].forEach(input => {
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        console.log("⌨️ Enter-Taste gedrückt in:", input.id);
        handleFormSubmit(e);
      }
    });
  });
  
  console.log("✅ Enter-Key Events hinzugefügt");
  
  // Focus auf erstes Feld setzen
  setTimeout(() => {
    userInput.focus();
    console.log("🎯 Focus auf Benutzername-Feld gesetzt");
  }, 100);
}

/**
 * Behandelt Form-Submit
 */
async function handleFormSubmit(event) {
  event.preventDefault();
  console.log("🚀 === LOGIN-VERSUCH GESTARTET ===");
  
  const userInput = document.getElementById('userInput');
  const passInput = document.getElementById('passInput');
  const submitBtn = document.getElementById('submitBtn');
  
  const username = userInput?.value?.trim() || '';
  const password = passInput?.value?.trim() || '';
  
  console.log("📝 Eingaben - Username:", username, "Password:", password ? '[VORHANDEN]' : '[LEER]');
  
  // Validierung
  if (!username || !password) {
    console.warn("⚠️ Fehlende Eingaben");
    alert("Bitte füllen Sie alle Felder aus!");
    return;
  }
  
  // Button deaktivieren
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = "⏳ Wird angemeldet...";
  }
  
  // Loader anzeigen
  showLoader();
  console.log("🔄 Loader angezeigt");
  
  try {
    // Lehrer suchen
    console.log("🔍 Suche Lehrer...");
    const teacher = findMatchingTeacher(username, password);
    
    if (!teacher) {
      throw new Error("Ungültige Anmeldedaten! Bitte prüfen Sie Benutzername und Passwort.");
    }
    
    console.log("✅ Lehrer gefunden:", teacher.name);
    
    // Benutzer setzen
    currentUser.name = teacher.name;
    currentUser.code = teacher.code;
    currentUser.password = teacher.password;
    currentUser.permissions = teacher.permissions || {};
    
    console.log("👤 Aktueller Benutzer gesetzt:", currentUser.name);
    
    // Benutzerdaten laden
    console.log("📊 Lade Benutzerdaten...");
    await initializeUserData();
    console.log("✅ Benutzerdaten geladen");
    
    // Zur App wechseln
    console.log("🔄 Wechsle zur App...");
    switchToApp();
    
    // Login-Event auslösen
    const loginEvent = new CustomEvent("userLoggedIn", { 
      detail: { teacher: currentUser } 
    });
    document.dispatchEvent(loginEvent);
    console.log("📡 Login-Event ausgelöst");
    
    // Erfolgs-Nachricht
    showNotification(`Willkommen, ${currentUser.name}!`, "success");
    console.log("🎉 === LOGIN ERFOLGREICH ABGESCHLOSSEN ===");
    
  } catch (error) {
    console.error("❌ LOGIN FEHLER:", error);
    alert(error.message || "Ein Fehler ist bei der Anmeldung aufgetreten.");
    
    // Passwort-Feld leeren
    if (passInput) passInput.value = '';
    if (userInput) userInput.focus();
    
  } finally {
    // Loader ausblenden
    hideLoader();
    console.log("🔄 Loader ausgeblendet");
    
    // Button wieder aktivieren
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = "🚀 Anmelden";
    }
  }
}

/**
 * Sucht passenden Lehrer
 */
function findMatchingTeacher(username, password) {
  console.log("🔍 Durchsuche", allTeachers?.length || 0, "Lehrer");
  
  if (!allTeachers || allTeachers.length === 0) {
    console.error("❌ Keine Lehrer verfügbar!");
    return null;
  }
  
  // Suche nach Code (Kürzel) - Case insensitive
  const byCode = allTeachers.find(teacher => 
    teacher.code && teacher.code.toLowerCase() === username.toLowerCase()
  );
  
  if (byCode) {
    console.log("🎯 Gefunden per Code:", byCode.name);
    if (byCode.password === password) {
      console.log("✅ Passwort korrekt");
      return byCode;
    } else {
      console.log("❌ Passwort falsch für", byCode.name);
    }
  }
  
  // Suche nach Name - Teilübereinstimmung
  const byName = allTeachers.find(teacher => 
    teacher.name && teacher.name.toLowerCase().includes(username.toLowerCase())
  );
  
  if (byName) {
    console.log("🎯 Gefunden per Name:", byName.name);
    if (byName.password === password) {
      console.log("✅ Passwort korrekt");
      return byName;
    } else {
      console.log("❌ Passwort falsch für", byName.name);
    }
  }
  
  console.log("❌ Kein passender Lehrer gefunden");
  return null;
}

/**
 * Wechselt zur Hauptanwendung
 */
function switchToApp() {
  console.log("🔄 === WECHSLE ZUR HAUPTANWENDUNG ===");
  
  // Alle Loader verstecken
  const loaders = document.querySelectorAll('#mainLoader, .loader-container, .loader');
  loaders.forEach((loader, index) => {
    loader.style.display = 'none';
    console.log(`🔒 Loader ${index + 1} ausgeblendet`);
  });
  
  // Login-Bereich ausblenden
  const loginSection = document.getElementById('loginSection');
  if (loginSection) {
    loginSection.style.display = 'none';
    console.log("🔒 Login-Bereich ausgeblendet");
  } else {
    console.error("❌ Login-Bereich nicht gefunden!");
  }
  
  // App-Bereich anzeigen
  const appSection = document.getElementById('appSection');
  if (appSection) {
    appSection.style.display = 'block';
    console.log("✅ App-Bereich angezeigt");
  } else {
    console.error("❌ App-Bereich nicht gefunden!");
  }
  
  // Header-Info aktualisieren
  updateHeaderInfo();
  
  console.log("🎯 === APP-WECHSEL ABGESCHLOSSEN ===");
}

/**
 * Aktualisiert Header-Informationen
 */
function updateHeaderInfo() {
  const avatar = document.getElementById('teacherAvatar');
  const name = document.getElementById('teacherName');
  
  if (avatar && currentUser.code) {
    avatar.textContent = currentUser.code.charAt(0).toUpperCase();
    console.log("👤 Avatar aktualisiert:", avatar.textContent);
  }
  
  if (name && currentUser.name) {
    name.textContent = currentUser.name;
    console.log("👤 Name aktualisiert:", name.textContent);
  }
}

/**
 * Zeigt Fallback-Login bei Fehlern
 */
function showFallbackLogin() {
  const container = document.querySelector("#loginSection .container");
  if (!container) return;
  
  container.innerHTML = `
    <div style="max-width: 400px; margin: 2rem auto; padding: 2rem; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 10px;">
      <h3 style="color: #721c24; margin-top: 0;">⚠️ Login-System Fehler</h3>
      <p>Das normale Login-System konnte nicht geladen werden.</p>
      <button onclick="location.reload()" style="background: #dc3545; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">
        🔄 Seite neu laden
      </button>
    </div>
  `;
}

/**
 * Debug-Informationen ausgeben
 */
function logDebugInfo() {
  console.log("🔍 === DEBUG INFORMATIONEN ===");
  console.log("All Teachers:", allTeachers?.length || 0);
  console.log("Current User:", currentUser);
  console.log("Login Form:", !!document.getElementById('actualLoginForm'));
  console.log("User Input:", !!document.getElementById('userInput'));
  console.log("Pass Input:", !!document.getElementById('passInput'));
  console.log("Submit Button:", !!document.getElementById('submitBtn'));
  console.log("Login Section:", !!document.getElementById('loginSection'));
  console.log("App Section:", !!document.getElementById('appSection'));
  console.log("===========================");
}

/**
 * Logout-Funktion
 */
export function performLogout() {
  console.log("🚪 === LOGOUT GESTARTET ===");
  
  // Benutzer zurücksetzen
  currentUser.name = null;
  currentUser.code = null;
  currentUser.password = null;
  currentUser.permissions = {};
  
  // Zur Login-Ansicht wechseln
  const loginSection = document.getElementById('loginSection');
  const appSection = document.getElementById('appSection');
  
  if (loginSection) {
    loginSection.style.display = 'block';
    console.log("✅ Login-Bereich angezeigt");
  }
  
  if (appSection) {
    appSection.style.display = 'none';
    console.log("🔒 App-Bereich ausgeblendet");
  }
  
  // Login-Felder zurücksetzen
  const userInput = document.getElementById('userInput');
  const passInput = document.getElementById('passInput');
  if (userInput) userInput.value = '';
  if (passInput) passInput.value = '';
  if (userInput) userInput.focus();
  
  // Logout-Event auslösen
  document.dispatchEvent(new Event("userLoggedOut"));
  
  showNotification("Erfolgreich abgemeldet.", "success");
  console.log("✅ === LOGOUT ABGESCHLOSSEN ===");
}

// Dummy-Funktionen für Kompatibilität
export function showPasswordModal() { /* nicht mehr verwendet */ }
export function hidePasswordModal() { /* nicht mehr verwendet */ }

// Debug-Funktion global verfügbar machen
window.debugLogin = function() {
  logDebugInfo();
  console.log("Teachers Detail:", allTeachers);
};
