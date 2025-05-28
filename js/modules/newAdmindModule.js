// js/modules/newAdminModule.js - Benutzerverwaltung für Admins
import { 
    registerUser, 
    loadAllUsers, 
    updateUserProfile, 
    toggleUserStatus,
    currentUser,
    USER_ROLES 
} from "../authService.js";
import { showLoader, hideLoader, showNotification } from "../uiService.js";

/**
 * DOM-Elemente
 */
let elements = {
    adminSection: null,
    adminTabs: null,
    usersTab: null,
    systemTab: null,
    
    // Benutzer-Verwaltung
    newUserForm: null,
    newUserEmail: null,
    newUserName: null,
    newUserPassword: null,
    newUserRole: null,
    usersAdminTable: null,
    
    // Admin-Logout
    adminLogoutBtn: null
};

/**
 * Zustand
 */
let allUsers = [];
let selectedUser = null;

/**
 * Initialisiert das Admin-Modul
 */
export function initNewAdminModule() {
    loadDOMElements();
    setupEventListeners();
    
    // Event-Listener für Admin-Login
    document.addEventListener('userLoggedIn', handleAdminLogin);
}

/**
 * Lädt alle DOM-Elemente
 */
function loadDOMElements() {
    elements.adminSection = document.getElementById("adminSection");
    elements.adminTabs = document.querySelectorAll("#adminSection .tab");
    elements.usersTab = document.getElementById("users-tab");
    elements.systemTab = document.getElementById("system-tab");
    
    // Benutzer-Verwaltung
    elements.newUserForm = document.getElementById("newUserForm");
    elements.newUserEmail = document.getElementById("newUserEmail");
    elements.newUserName = document.getElementById("newUserName");
    elements.newUserPassword = document.getElementById("newUserPassword");
    elements.newUserRole = document.getElementById("newUserRole");
    elements.usersAdminTable = document.getElementById("usersAdminTable");
    
    // Admin-Logout
    elements.adminLogoutBtn = document.getElementById("adminLogoutBtn");
}

/**
 * Richtet Event-Listener ein
 */
function setupEventListeners() {
    // Admin Tab-Wechsel
    elements.adminTabs?.forEach((tab) => {
        tab.addEventListener("click", () => {
            const tabId = tab.dataset.tab;
            switchAdminTab(tabId);
        });
    });
    
    // Neuen Benutzer erstellen
    if (elements.newUserForm) {
        elements.newUserForm.addEventListener("submit", handleCreateUser);
    }
    
    // Admin-Logout wird vom Login-Modul behandelt
}

/**
 * Behandelt Admin-Login
 */
async function handleAdminLogin(event) {
    const user = event.detail;
    
    if (user.role === USER_ROLES.ADMIN && elements.adminSection && 
        elements.adminSection.style.display === "block") {
        
        // Admin ist angemeldet und Admin-Panel ist sichtbar
        await loadUsersTab();
    }
}

/**
 * Wechselt Admin-Tabs
 */
function switchAdminTab(tabId) {
    // Tabs deaktivieren
    elements.adminTabs.forEach((t) => t.classList.remove("active"));
    document.querySelectorAll("#adminSection .tab-content").forEach((c) => 
        c.classList.remove("active"));
    
    // Aktiven Tab setzen
    const activeTab = document.querySelector(`#adminSection .tab[data-tab="${tabId}"]`);
    const activeContent = document.getElementById(`${tabId}-tab`);
    
    if (activeTab) activeTab.classList.add("active");
    if (activeContent) activeContent.classList.add("active");
    
    // Tab-spezifische Aktionen
    if (tabId === "users") {
        loadUsersTab();
    } else if (tabId === "system") {
        loadSystemTab();
    }
}

/**
 * Lädt den Benutzer-Tab
 */
async function loadUsersTab() {
    if (!elements.usersAdminTable) return;
    
    try {
        showLoader();
        
        // Lade alle Benutzer
        allUsers = await loadAllUsers();
        
        // Aktualisiere Tabelle
        updateUsersTable();
        
    } catch (error) {
        console.error("Fehler beim Laden der Benutzer:", error);
        showNotification("Fehler beim Laden der Benutzer: " + error.message, "error");
        
        // Fehler-Anzeige in Tabelle
        const tbody = elements.usersAdminTable.querySelector("tbody");
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="error-message">
                        Fehler beim Laden der Benutzer: ${error.message}
                    </td>
                </tr>
            `;
        }
    } finally {
        hideLoader();
    }
}

/**
 * Aktualisiert die Benutzer-Tabelle
 */
function updateUsersTable() {
    if (!elements.usersAdminTable) return;
    
    const tbody = elements.usersAdminTable.querySelector("tbody");
    if (!tbody) return;
    
    // Tabelle leeren
    tbody.innerHTML = "";
    
    if (allUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    Noch keine Benutzer vorhanden
                </td>
            </tr>
        `;
        return;
    }
    
    // Benutzer sortieren (Admins zuerst, dann alphabetisch)
    const sortedUsers = [...allUsers].sort((a, b) => {
        if (a.role !== b.role) {
            return a.role === USER_ROLES.ADMIN ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
    });
    
    // Benutzer-Zeilen erstellen
    sortedUsers.forEach(user => {
        const row = document.createElement("tr");
        row.dataset.userId = user.id;
        
        // Letzter Login formatieren
        const lastLogin = user.lastLoginAt ? 
            new Date(user.lastLoginAt.seconds * 1000).toLocaleDateString('de-DE') : 
            'Noch nie';
        
        row.innerHTML = `
            <td>
                <div class="user-info">
                    <strong>${user.name}</strong>
                    ${user.id === currentUser.uid ? '<span class="current-user-badge">Sie</span>' : ''}
                </div>
            </td>
            <td>${user.email}</td>
            <td>
                <span class="user-role ${user.role}">${
                    user.role === USER_ROLES.ADMIN ? 'Administrator' : 'Lehrer'
                }</span>
            </td>
            <td>
                <span class="user-status ${user.isActive ? 'active' : 'inactive'}">
                    ${user.isActive ? 'Aktiv' : 'Inaktiv'}
                </span>
            </td>
            <td>${lastLogin}</td>
            <td>
                <div class="user-actions">
                    ${user.id !== currentUser.uid ? `
                        <button class="btn-toggle-status btn-compact" 
                                data-user-id="${user.id}" 
                                data-current-status="${user.isActive}"
                                title="${user.isActive ? 'Deaktivieren' : 'Aktivieren'}">
                            ${user.isActive ? '⏸️' : '▶️'}
                        </button>
                        <button class="btn-edit-user btn-compact" 
                                data-user-id="${user.id}"
                                title="Bearbeiten">
                            ✏️
                        </button>
                    ` : ''}
                </div>
            </td>
        `;
        
        // Event-Listener für Aktions-Buttons
        const toggleBtn = row.querySelector(".btn-toggle-status");
        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                handleToggleUserStatus(user.id, !user.isActive);
            });
        }
        
        const editBtn = row.querySelector(".btn-edit-user");
        if (editBtn) {
            editBtn.addEventListener("click", () => {
                handleEditUser(user);
            });
        }
        
        tbody.appendChild(row);
    });
}

/**
 * Behandelt die Erstellung eines neuen Benutzers
 */
async function handleCreateUser(event) {
    event.preventDefault();
    
    const email = elements.newUserEmail.value.trim();
    const name = elements.newUserName.value.trim();
    const password = elements.newUserPassword.value.trim();
    const role = elements.newUserRole.value;
    
    // Validierung
    if (!email || !name || !password || !role) {
        showNotification("Bitte füllen Sie alle Felder aus.", "warning");
        return;
    }
    
    // E-Mail-Format prüfen
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showNotification("Bitte geben Sie eine gültige E-Mail-Adresse ein.", "warning");
        return;
    }
    
    // Passwort-Länge prüfen
    if (password.length < 6) {
        showNotification("Das Passwort muss mindestens 6 Zeichen lang sein.", "warning");
        return;
    }
    
    try {
        showLoader();
        
        // Benutzer erstellen
        const newUser = await registerUser(email, password, {
            name: name,
            role: role,
            permissions: {}
        });
        
        // Form zurücksetzen
        elements.newUserForm.reset();
        
        // Benutzer-Liste neu laden
        await loadUsersTab();
        
        showNotification(`Benutzer "${name}" wurde erfolgreich erstellt.`, "success");
        
    } catch (error) {
        console.error("Fehler beim Erstellen des Benutzers:", error);
        
        let errorMessage = "Fehler beim Erstellen des Benutzers.";
        if (error.code === 'auth/email-already-in-use') {
            errorMessage = "Diese E-Mail-Adresse wird bereits verwendet.";
        } else if (error.code === 'auth/weak-password') {
            errorMessage = "Das Passwort ist zu schwach.";
        } else if (error.code === 'auth/invalid-email') {
            errorMessage = "Ungültige E-Mail-Adresse.";
        } else if (error.message) {
            errorMessage = error.message;
        }
        
        showNotification(errorMessage, "error");
    } finally {
        hideLoader();
    }
}

/**
 * Behandelt das Aktivieren/Deaktivieren eines Benutzers
 */
async function handleToggleUserStatus(userId, newStatus) {
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;
    
    const action = newStatus ? "aktivieren" : "deaktivieren";
    const confirmation = confirm(
        `Möchten Sie den Benutzer "${user.name}" wirklich ${action}?`
    );
    
    if (!confirmation) return;
    
    try {
        showLoader();
        
        await toggleUserStatus(userId, newStatus);
        
        // Lokale Liste aktualisieren
        const userIndex = allUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            allUsers[userIndex].isActive = newStatus;
        }
        
        // Tabelle aktualisieren
        updateUsersTable();
        
        showNotification(
            `Benutzer "${user.name}" wurde ${newStatus ? "aktiviert" : "deaktiviert"}.`, 
            "success"
        );
        
    } catch (error) {
        console.error(`Fehler beim ${action} des Benutzers:`, error);
        showNotification(`Fehler beim ${action} des Benutzers: ${error.message}`, "error");
    } finally {
        hideLoader();
    }
}

/**
 * Behandelt das Bearbeiten eines Benutzers
 */
function handleEditUser(user) {
    // Vereinfachte Bearbeitung - zeigt nur eine Nachricht
    // In einer vollständigen Implementierung würde hier ein Modal geöffnet
    showNotification(
        `Bearbeitung von "${user.name}" - Diese Funktion wird in einer zukünftigen Version implementiert.`,
        "info"
    );
}

/**
 * Lädt den System-Tab
 */
function loadSystemTab() {
    if (!elements.systemTab) return;
    
    // Einfache System-Informationen
    elements.systemTab.innerHTML = `
        <div class="system-info">
            <h2>System-Informationen</h2>
            <div class="info-cards">
                <div class="info-card">
                    <h3>Benutzer</h3>
                    <div class="info-value">${allUsers.length}</div>
                    <div class="info-label">Registrierte Benutzer</div>
                </div>
                <div class="info-card">
                    <h3>System</h3>
                    <div class="info-value">v2.0</div>
                    <div class="info-label">Aktuelle Version</div>
                </div>
                <div class="info-card">
                    <h3>Status</h3>
                    <div class="info-value status-online">Online</div>
                    <div class="info-label">System-Status</div>
                </div>
            </div>
            
            <div class="system-actions">
                <h3>System-Aktionen</h3>
                <div class="action-buttons">
                    <button id="systemHealthBtn" class="btn-secondary">
                        System-Gesundheit prüfen
                    </button>
                    <button id="systemBackupBtn" class="btn-secondary">
                        Backup erstellen
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Event-Listener für System-Aktionen
    const healthBtn = document.getElementById("systemHealthBtn");
    if (healthBtn) {
        healthBtn.addEventListener("click", checkSystemHealth);
    }
    
    const backupBtn = document.getElementById("systemBackupBtn");
    if (backupBtn) {
        backupBtn.addEventListener("click", createSystemBackup);
    }
}

/**
 * Prüft System-Gesundheit
 */
async function checkSystemHealth() {
    try {
        showLoader();
        
        // Import der checkDatabaseHealth Funktion
        const { checkDatabaseHealth } = await import("../firebaseClient.js");
        const health = await checkDatabaseHealth();
        
        let message = `System-Status: ${health.status}\n\n`;
        
        if (health.issues.length > 0) {
            message += "Gefundene Probleme:\n";
            health.issues.forEach(issue => {
                message += `• ${issue}\n`;
            });
        } else {
            message += "Keine Probleme gefunden. System läuft normal.";
        }
        
        alert(message);
        
    } catch (error) {
        console.error("Fehler bei der System-Gesundheitsprüfung:", error);
        showNotification("Fehler bei der System-Gesundheitsprüfung: " + error.message, "error");
    } finally {
        hideLoader();
    }
}

/**
 * Erstellt System-Backup
 */
function createSystemBackup() {
    showNotification("Backup-Funktion wird in einer zukünftigen Version implementiert.", "info");
}
