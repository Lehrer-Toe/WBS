// js/modules/newLoginModule.js - Neues Login-System
import { 
    loginUser, 
    logoutUser, 
    sendPasswordResetEmail, 
    currentUser,
    initAuthStateListener
} from "../authService.js";
import { showLoader, hideLoader, showNotification } from "../uiService.js";

/**
 * DOM-Elemente
 */
let elements = {
    loginSection: null,
    appSection: null,
    adminSection: null,
    
    // Login-Form
    loginForm: null,
    emailInput: null,
    passwordInput: null,
    loginBtn: null,
    
    // Passwort-Reset
    forgotPasswordBtn: null,
    resetPasswordModal: null,
    resetEmailInput: null,
    sendResetBtn: null,
    closeResetModal: null,
    
    // User-Info
    userAvatar: null,
    userName: null,
    logoutBtn: null,
    
    // Admin-Link
    adminAccessBtn: null
};

/**
 * Initialisiert das neue Login-Modul
 */
export function initNewLoginModule() {
    loadDOMElements();
    setupEventListeners();
    initAuthStateListener();
    
    // Prüfe initialen Auth-Status
    checkInitialAuthState();
}

/**
 * Lädt alle DOM-Elemente
 */
function loadDOMElements() {
    elements.loginSection = document.getElementById("loginSection");
    elements.appSection = document.getElementById("appSection");
    elements.adminSection = document.getElementById("adminSection");
    
    // Login-Form
    elements.loginForm = document.getElementById("loginForm");
    elements.emailInput = document.getElementById("loginEmail");
    elements.passwordInput = document.getElementById("loginPassword");
    elements.loginBtn = document.getElementById("loginBtn");
    
    // Passwort-Reset
    elements.forgotPasswordBtn = document.getElementById("forgotPasswordBtn");
    elements.resetPasswordModal = document.getElementById("resetPasswordModal");
    elements.resetEmailInput = document.getElementById("resetEmailInput");
    elements.sendResetBtn = document.getElementById("sendResetBtn");
    elements.closeResetModal = document.getElementById("closeResetModal");
    
    // User-Info
    elements.userAvatar = document.getElementById("userAvatar");
    elements.userName = document.getElementById("userName");
    elements.logoutBtn = document.getElementById("logoutBtn");
    
    // Admin-Zugang
    elements.adminAccessBtn = document.getElementById("adminAccessBtn");
}

/**
 * Richtet Event-Listener ein
 */
function setupEventListeners() {
    // Login-Form
    if (elements.loginForm) {
        elements.loginForm.addEventListener("submit", handleLogin);
    }
    
    // Passwort-Reset
    if (elements.forgotPasswordBtn) {
        elements.forgotPasswordBtn.addEventListener("click", showPasswordResetModal);
    }
    
    if (elements.closeResetModal) {
        elements.closeResetModal.addEventListener("click", hidePasswordResetModal);
    }
    
    if (elements.sendResetBtn) {
        elements.sendResetBtn.addEventListener("click", handlePasswordReset);
    }
    
    // Logout
    if (elements.logoutBtn) {
        elements.logoutBtn.addEventListener("click", handleLogout);
    }
    
    // Admin-Zugang
    if (elements.adminAccessBtn) {
        elements.adminAccessBtn.addEventListener("click", showAdminSection);
    }
    
    // Auth-State Events
    document.addEventListener('userLoggedIn', handleUserLoggedIn);
    document.addEventListener('userLoggedOut', handleUserLoggedOut);
}

/**
 * Behandelt den Login-Prozess
 */
async function handleLogin(event) {
    event.preventDefault();
    
    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value.trim();
    
    if (!email || !password) {
        showNotification("Bitte E-Mail und Passwort eingeben.", "warning");
        return;
    }
    
    // E-Mail-Format validieren
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification("Bitte eine gültige E-Mail-Adresse eingeben.", "warning");
        return;
    }
    
    try {
        showLoader();
        await loginUser(email, password);
        
        // Form zurücksetzen
        elements.loginForm.reset();
        
        showNotification(`Willkommen, ${currentUser.name}!`, "success");
    } catch (error) {
        console.error("Login-Fehler:", error);
        
        let errorMessage = "Fehler bei der Anmeldung.";
        
        if (error.code === 'auth/user-not-found') {
            errorMessage = "Kein Benutzer mit dieser E-Mail gefunden.";
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = "Falsches Passwort.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Ungültige E-Mail-Adresse.";
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = "Ihr Konto wurde deaktiviert.";
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = "Zu viele Anmeldeversuche. Bitte versuchen Sie es später erneut.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, "error");
    } finally {
        hideLoader();
    }
}

/**
 * Behandelt den Logout-Prozess
 */
async function handleLogout() {
    try {
        await logoutUser();
        showNotification("Erfolgreich abgemeldet.", "success");
    } catch (error) {
        console.error("Logout-Fehler:", error);
        showNotification("Fehler bei der Abmeldung.", "error");
    }
}

/**
 * Zeigt das Passwort-Reset-Modal
 */
function showPasswordResetModal() {
    if (elements.resetPasswordModal) {
        elements.resetPasswordModal.style.display = "flex";
        if (elements.resetEmailInput) {
            elements.resetEmailInput.focus();
        }
    }
}

/**
 * Versteckt das Passwort-Reset-Modal
 */
function hidePasswordResetModal() {
    if (elements.resetPasswordModal) {
        elements.resetPasswordModal.style.display = "none";
        if (elements.resetEmailInput) {
            elements.resetEmailInput.value = "";
        }
    }
}

/**
 * Behandelt Passwort-Reset
 */
async function handlePasswordReset() {
    const email = elements.resetEmailInput.value.trim();
    
    if (!email) {
        showNotification("Bitte E-Mail-Adresse eingeben.", "warning");
        return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification("Bitte eine gültige E-Mail-Adresse eingeben.", "warning");
        return;
    }
    
    try {
        showLoader();
        await sendPasswordResetEmail(email);
        hidePasswordResetModal();
        showNotification("Passwort-Reset-E-Mail gesendet. Prüfen Sie Ihr Postfach.", "success");
    } catch (error) {
        console.error("Passwort-Reset-Fehler:", error);
        
        let errorMessage = "Fehler beim Senden der E-Mail.";
        if (error.code === 'auth/user-not-found') {
            errorMessage = "Kein Benutzer mit dieser E-Mail gefunden.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Ungültige E-Mail-Adresse.";
        }
        
        showNotification(errorMessage, "error");
    } finally {
        hideLoader();
    }
}

/**
 * Behandelt erfolgreiche Anmeldung
 */
function handleUserLoggedIn(event) {
    const user = event.detail;
    
    // Verstecke Login-Sektion
    if (elements.loginSection) {
        elements.loginSection.style.display = "none";
    }
    
    // Zeige entsprechende App-Sektion
    if (user.role === 'admin' && elements.adminSection) {
        elements.adminSection.style.display = "block";
        if (elements.appSection) {
            elements.appSection.style.display = "none";
        }
    } else {
        if (elements.appSection) {
            elements.appSection.style.display = "block";
        }
        if (elements.adminSection) {
            elements.adminSection.style.display = "none";
        }
    }
    
    // Aktualisiere Benutzer-UI
    updateUserUI(user);
    
    // Admin-Zugang Button anzeigen/verstecken
    if (elements.adminAccessBtn) {
        elements.adminAccessBtn.style.display = user.role === 'admin' ? "block" : "none";
    }
}

/**
 * Behandelt Abmeldung
 */
function handleUserLoggedOut() {
    // Zeige Login-Sektion
    if (elements.loginSection) {
        elements.loginSection.style.display = "block";
    }
    
    // Verstecke App-Sektionen
    if (elements.appSection) {
        elements.appSection.style.display = "none";
    }
    if (elements.adminSection) {
        elements.adminSection.style.display = "none";
    }
    
    // Lösche Benutzer-UI
    updateUserUI(null);
}

/**
 * Aktualisiert die Benutzer-UI
 */
function updateUserUI(user) {
    if (user) {
        // Avatar und Name setzen
        if (elements.userAvatar) {
            elements.userAvatar.textContent = user.name.charAt(0).toUpperCase();
        }
        if (elements.userName) {
            elements.userName.textContent = user.name;
        }
    } else {
        // UI zurücksetzen
        if (elements.userAvatar) {
            elements.userAvatar.textContent = "?";
        }
        if (elements.userName) {
            elements.userName.textContent = "";
        }
    }
}

/**
 * Zeigt Admin-Bereich
 */
function showAdminSection() {
    if (currentUser.role !== 'admin') {
        showNotification("Keine Admin-Berechtigung.", "error");
        return;
    }
    
    if (elements.appSection) {
        elements.appSection.style.display = "none";
    }
    if (elements.adminSection) {
        elements.adminSection.style.display = "block";
    }
}

/**
 * Prüft initialen Auth-Status
 */
function checkInitialAuthState() {
    if (currentUser.isLoggedIn) {
        handleUserLoggedIn({ detail: currentUser });
    } else {
        handleUserLoggedOut();
    }
}
