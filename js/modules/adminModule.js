// ==== FÜR js/modules/adminModule.js ====
// Ersetzen Sie die Imports am Anfang der Datei mit:

import { 
  showLoader, 
  hideLoader, 
  showNotification, 
  formatDate, 
  downloadFile 
} from "../uiService.js";
import {
  loginAdmin,
  logoutAdmin,
  currentAdmin,
  allTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  getSystemStats,
  exportAllData,
  importAllData,
  deleteAllData,
  deleteAllTeachers,
  updateTeacherPermissions,
  loadSystemSettings,
  saveSystemSettings,
  systemSettings
} from "../adminService.js";
import { loadAssessmentTemplates } from "../assessmentService.js";
import { TEACHER_PERMISSIONS } from "../constants.js";

/**
 * Referenz auf die DOM-Elemente
 */
let elements = {
  // Login-Elemente
  loginSection: null,
  adminLoginSection: null,
  adminSection: null,
  showAdminLoginBtn: null,
  backToLoginBtn: null,
  adminUsername: null,
  adminPassword: null,
  adminLoginBtn: null,
  adminLogoutBtn: null,
  
  // Admin-Panel-Elemente
  adminTabs: null,
  teachersTab: null,
  systemTab: null,
  templatesTab: null,
  
  // Lehrer-Verwaltung
  newTeacherName: null,
  newTeacherCode: null,
  newTeacherPassword: null,
  canCreateThemes: null,
  canManageTemplates: null,
  addTeacherBtn: null,
  teachersAdminTable: null,
  
  // Lehrer-Bearbeitung
  editTeacherModal: null,
  editTeacherName: null,
  editTeacherCode: null,
  editTeacherPassword: null,
  editCanCreateThemes: null,
  editCanManageTemplates: null,
  closeEditTeacherModal: null,
  saveTeacherBtn: null,
  deleteTeacherBtn: null,
  
  // Lösch-Bestätigung
  confirmDeleteTeacherModal: null,
  deleteTeacherName: null,
  closeConfirmDeleteTeacherModal: null,
  cancelDeleteTeacherBtn: null,
  confirmDeleteTeacherBtn: null,
  
  // System-Einstellungen
  totalTeachers: null,
  totalThemes: null,
  totalStudents: null,
  totalTemplates: null,
  firebaseStatus: null,
  lastUpdate: null,
  currentSchoolYear: null,
  
  // System-Aktionen
  refreshSystemBtn: null,
  exportSystemBtn: null,
  importSystemBtn: null,
  importFileInput: null,
  
  // Lösch-Funktionen
  adminDeleteVerificationCode: null,
  deleteAllTeachersBtn: null,
  deleteAllDataBtn: null
};

/**
 * Zustand für die Lehrer-Bearbeitung
 */
let selectedTeacher = null;
let teacherToDelete = null;

/**
 * Initialisiert das Admin-Modul
 */
export function initAdminModule() {
  // DOM-Elemente abrufen
  loadDOMElements();
  
  // Event-Listener hinzufügen
  setupEventListeners();
}

/**
 * Lädt alle benötigten DOM-Elemente
 */
function loadDOMElements() {
  // Login-Elemente
  elements.loginSection = document.getElementById("loginSection");
  elements.adminLoginSection = document.getElementById("adminLoginSection");
  elements.adminSection = document.getElementById("adminSection");
  elements.showAdminLoginBtn = document.getElementById("showAdminLoginBtn");
  elements.backToLoginBtn = document.getElementById("backToLoginBtn");
  elements.adminUsername = document.getElementById("adminUsername");
  elements.adminPassword = document.getElementById("adminPassword");
  elements.adminLoginBtn = document.getElementById("adminLoginBtn");
  elements.adminLogoutBtn = document.getElementById("adminLogoutBtn");
  
  // Admin-Panel-Elemente
  elements.adminTabs = document.querySelectorAll("#adminSection .tab");
  elements.teachersTab = document.getElementById("teachers-tab");
  elements.systemTab = document.getElementById("system-tab");
  elements.templatesTab = document.getElementById("templates-tab");
  
  // Lehrer-Verwaltung
  elements.newTeacherName = document.getElementById("newTeacherName");
  elements.newTeacherCode = document.getElementById("newTeacherCode");
  elements.newTeacherPassword = document.getElementById("newTeacherPassword");
  elements.canCreateThemes = document.getElementById("canCreateThemes");
  elements.canManageTemplates = document.getElementById("canManageTemplates");
  elements.addTeacherBtn = document.getElementById("addTeacherBtn");
  elements.teachersAdminTable = document.getElementById("teachersAdminTable");
  
  // Lehrer-Bearbeitung
  elements.editTeacherModal = document.getElementById("editTeacherModal");
  elements.editTeacherName = document.getElementById("editTeacherName");
  elements.editTeacherCode = document.getElementById("editTeacherCode");
  elements.editTeacherPassword = document.getElementById("editTeacherPassword");
  elements.editCanCreateThemes = document.getElementById("editCanCreateThemes");
  elements.editCanManageTemplates = document.getElementById("editCanManageTemplates");
  elements.closeEditTeacherModal = document.getElementById("closeEditTeacherModal");
  elements.saveTeacherBtn = document.getElementById("saveTeacherBtn");
  elements.deleteTeacherBtn = document.getElementById("deleteTeacherBtn");
  
  // Lösch-Bestätigung
  elements.confirmDeleteTeacherModal = document.getElementById("confirmDeleteTeacherModal");
  elements.deleteTeacherName = document.getElementById("deleteTeacherName");
  elements.closeConfirmDeleteTeacherModal = document.getElementById("closeConfirmDeleteTeacherModal");
  elements.cancelDeleteTeacherBtn = document.getElementById("cancelDeleteTeacherBtn");
  elements.confirmDeleteTeacherBtn = document.getElementById("confirmDeleteTeacherBtn");
  
  // System-Einstellungen
  elements.totalTeachers = document.getElementById("totalTeachers");
  elements.totalThemes = document.getElementById("totalThemes");
  elements.totalStudents = document.getElementById("totalStudents");
  elements.totalTemplates = document.getElementById("totalTemplates");
  elements.firebaseStatus = document.getElementById("firebaseStatus");
  elements.lastUpdate = document.getElementById("lastUpdate");
  elements.currentSchoolYear = document.getElementById("currentSchoolYear");
  
  // System-Aktionen
  elements.refreshSystemBtn = document.getElementById("refreshSystemBtn");
  elements.exportSystemBtn = document.getElementById("exportSystemBtn");
  elements.importSystemBtn = document.getElementById("importSystemBtn");
  elements.importFileInput = document.getElementById("importFileInput");
  
  // Lösch-Funktionen
  elements.adminDeleteVerificationCode = document.getElementById("adminDeleteVerificationCode");
  elements.deleteAllTeachersBtn = document.getElementById("deleteAllTeachersBtn");
  elements.deleteAllDataBtn = document.getElementById("deleteAllDataBtn");
}

/**
 * Richtet die Event-Listener ein
 */
function setupEventListeners() {
  // Admin Login anzeigen
  if (elements.showAdminLoginBtn) {
    elements.showAdminLoginBtn.addEventListener("click", () => {
      elements.loginSection.style.display = "none";
      elements.adminLoginSection.style.display = "block";
    });
  }

  // Zurück zur normalen Anmeldung
  if (elements.backToLoginBtn) {
    elements.backToLoginBtn.addEventListener("click", () => {
      elements.adminLoginSection.style.display = "none"; 
      elements.loginSection.style.display = "block";
      if (elements.adminUsername) elements.adminUsername.value = "";
      if (elements.adminPassword) elements.adminPassword.value = "";
    });
  }

  // Admin Login
  if (elements.adminLoginBtn) {
    elements.adminLoginBtn.addEventListener("click", performAdminLogin);
  }
  if (elements.adminPassword) {
    elements.adminPassword.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performAdminLogin();
      }
    });
  }

  // Admin Logout
  if (elements.adminLogoutBtn) {
    elements.adminLogoutBtn.addEventListener("click", performAdminLogout);
  }

  // Admin Tab switching
  elements.adminTabs?.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      elements.adminTabs.forEach((t) => t.classList.remove("active"));
      document.querySelectorAll("#adminSection .tab-content").forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`${tabId}-tab`).classList.add("active");
      
      if (tabId === "teachers") {
        updateTeachersAdminTab();
      } else if (tabId === "system") {
        updateSystemInfoTab();
      } else if (tabId === "templates") {
        updateTemplatesTab();
      }
    });
  });

  // Lehrer hinzufügen
  if (elements.addTeacherBtn) {
    elements.addTeacherBtn.addEventListener("click", addNewTeacher);
  }

  // System aktualisieren
  if (elements.refreshSystemBtn) {
    elements.refreshSystemBtn.addEventListener("click", refreshSystemInfo);
  }

  // System exportieren
  if (elements.exportSystemBtn) {
    elements.exportSystemBtn.addEventListener("click", exportSystemData);
  }

  // System importieren
  if (elements.importSystemBtn) {
    elements.importSystemBtn.addEventListener("click", () => {
      elements.importFileInput?.click();
    });
  }

  // Import-Datei verarbeiten
  if (elements.importFileInput) {
    elements.importFileInput.addEventListener("change", handleImportFile);
  }

  // Alle Lehrer löschen
  if (elements.deleteAllTeachersBtn) {
    elements.deleteAllTeachersBtn.addEventListener("click", confirmDeleteAllTeachers);
  }

  // Alle Daten löschen
  if (elements.deleteAllDataBtn) {
    elements.deleteAllDataBtn.addEventListener("click", confirmDeleteAllSystemData);
  }

  // Edit Teacher Modal
  if (elements.closeEditTeacherModal) {
    elements.closeEditTeacherModal.addEventListener("click", () => {
      elements.editTeacherModal.style.display = "none";
    });
  }
  if (elements.saveTeacherBtn) {
    elements.saveTeacherBtn.addEventListener("click", saveEditedTeacher);
  }
  if (elements.deleteTeacherBtn) {
    elements.deleteTeacherBtn.addEventListener("click", showDeleteTeacherConfirmation);
  }

  // Confirm Delete Teacher Modal
  if (elements.closeConfirmDeleteTeacherModal) {
    elements.closeConfirmDeleteTeacherModal.addEventListener("click", () => {
      elements.confirmDeleteTeacherModal.style.display = "none";
    });
  }
  if (elements.cancelDeleteTeacherBtn) {
    elements.cancelDeleteTeacherBtn.addEventListener("click", () => {
      elements.confirmDeleteTeacherModal.style.display = "none";
    });
  }
  if (elements.confirmDeleteTeacherBtn) {
    elements.confirmDeleteTeacherBtn.addEventListener("click", confirmDeleteTeacher);
  }
}

/**
 * Admin Login durchführen
 */
async function performAdminLogin() {
  const username = elements.adminUsername ? elements.adminUsername.value.trim() : "";
  const password = elements.adminPassword ? elements.adminPassword.value.trim() : "";

  if (!username || !password) {
    showNotification("Bitte alle Felder ausfüllen.", "warning");
    return;
  }

  showLoader();
  
  try {
    // Admin Login prüfen
    const loginSuccess = loginAdmin(username, password);
    if (loginSuccess) {
      // Systemeinstellungen laden
      await loadSystemSettings();
      
      // Bewertungsraster laden
      await loadAssessmentTemplates();
      
      elements.adminLoginSection.style.display = "none";
      elements.adminSection.style.display = "block";
      
      updateTeachersAdminTab();
      updateSystemInfoTab();
      
      showNotification("Admin-Anmeldung erfolgreich!");
    } else {
      showNotification("Ungültige Anmeldedaten!", "error");
    }
  } catch (error) {
    console.error("Admin Login Fehler:", error);
    showNotification("Fehler bei der Anmeldung.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Admin Logout
 */
function performAdminLogout() {
  logoutAdmin();
  elements.adminSection.style.display = "none";
  elements.loginSection.style.display = "block";
  if (elements.adminUsername) elements.adminUsername.value = "";
  if (elements.adminPassword) elements.adminPassword.value = "";
  showNotification("Admin-Abmeldung erfolgreich.");
}

/**
 * Lehrer-Admin-Tab aktualisieren
 */
function updateTeachersAdminTab() {
  if (!elements.teachersAdminTable) return;
  
  const tbody = elements.teachersAdminTable.querySelector("tbody");
  tbody.innerHTML = "";

  if (allTeachers.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="5">Keine Lehrer vorhanden</td>';
    tbody.appendChild(tr);
    return;
  }

  // Sortiere Lehrer nach Namen
  const sortedTeachers = [...allTeachers].sort((a, b) => a.name.localeCompare(b.name));

  sortedTeachers.forEach((teacher) => {
    const tr = document.createElement("tr");
    const createdDate = teacher.createdAt ? formatDate(teacher.createdAt.split('T')[0]) : '-';
    
    // Berechtigungen anzeigen
    const canCreateThemes = teacher.permissions && teacher.permissions[TEACHER_PERMISSIONS.CREATE_THEMES];
    const canManageTemplates = teacher.permissions && teacher.permissions[TEACHER_PERMISSIONS.MANAGE_TEMPLATES];
    
    tr.innerHTML = `
      <td>${teacher.name}</td>
      <td><span class="teacher-code">${teacher.code}</span></td>
      <td>
        <span class="permission-icon ${canCreateThemes ? 'enabled' : 'disabled'}" title="Themen erstellen">
          ${canCreateThemes ? '✓' : '✗'}
        </span>
        <span class="permission-icon ${canManageTemplates ? 'enabled' : 'disabled'}" title="Bewertungsraster verwalten">
          ${canManageTemplates ? '✓' : '✗'}
        </span>
      </td>
      <td>${createdDate}</td>
      <td>
        <div class="teacher-actions">
          <button class="edit-btn" data-code="${teacher.code}">✏️</button>
        </div>
      </td>
    `;
    
    tr.querySelector(".edit-btn").addEventListener("click", () => {
      showEditTeacherModal(teacher);
    });
    
    tbody.appendChild(tr);
  });
}

/**
 * System-Info-Tab aktualisieren
 */
async function updateSystemInfoTab() {
  // System-Statistiken abrufen
  const stats = await getSystemStats();
  
  if (elements.totalTeachers) {
    elements.totalTeachers.textContent = stats.totalTeachers;
  }
  
  if (elements.totalThemes) {
    elements.totalThemes.textContent = stats.totalThemes || 0;
  }
  
  if (elements.totalStudents) {
    elements.totalStudents.textContent = stats.totalStudents || 0;
  }
  
  if (elements.totalTemplates) {
    elements.totalTemplates.textContent = stats.totalTemplates || 0;
  }
  
  if (elements.firebaseStatus) {
    elements.firebaseStatus.textContent = stats.firebaseStatus;
    elements.firebaseStatus.className = stats.firebaseStatus === "Online" 
      ? "stat-value status-online" 
      : "stat-value status-offline";
  }
  
  if (elements.lastUpdate) {
    elements.lastUpdate.textContent = new Date().toLocaleString("de-DE");
  }
  
  if (elements.currentSchoolYear) {
    elements.currentSchoolYear.value = systemSettings.currentSchoolYear || "";
    
    // Event-Listener für Änderungen am Schuljahr
    elements.currentSchoolYear.addEventListener("change", async () => {
      const newSchoolYear = elements.currentSchoolYear.value;
      
      if (newSchoolYear) {
        showLoader();
        try {
          await saveSystemSettings({
            ...systemSettings,
            currentSchoolYear: newSchoolYear
          });
          showNotification("Schuljahr aktualisiert.");
        } catch (error) {
          console.error("Fehler beim Speichern des Schuljahres:", error);
          showNotification("Fehler beim Speichern des Schuljahres.", "error");
        } finally {
          hideLoader();
        }
      }
    });
  }
}

/**
 * Bewertungsraster-Tab aktualisieren
 */
function updateTemplatesTab() {
  // Diese Funktion wird implementiert, wenn wir das Bewertungsraster-UI erstellen
  console.log("Bewertungsraster-Tab wird aktualisiert");
}

/**
 * System-Info aktualisieren
 */
async function refreshSystemInfo() {
  showLoader();
  try {
    await updateSystemInfoTab();
    showNotification("System-Informationen aktualisiert.");
  } catch (error) {
    showNotification("Fehler beim Aktualisieren.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Neuen Lehrer hinzufügen
 */
async function addNewTeacher() {
  const name = elements.newTeacherName ? elements.newTeacherName.value.trim() : "";
  const code = elements.newTeacherCode ? elements.newTeacherCode.value.trim() : "";
  const password = elements.newTeacherPassword ? elements.newTeacherPassword.value.trim() : "";
  
  const canCreateThemes = elements.canCreateThemes ? elements.canCreateThemes.checked : false;
  const canManageTemplates = elements.canManageTemplates ? elements.canManageTemplates.checked : false;

  if (!name || !code || !password) {
    showNotification("Bitte alle Felder ausfüllen.", "warning");
    return;
  }

  if (code.length > 5) {
    showNotification("Kürzel darf maximal 5 Zeichen haben.", "warning");
    return;
  }

  showLoader();
  
  try {
    // Berechtigungen zusammenstellen
    const permissions = {
      [TEACHER_PERMISSIONS.CREATE_THEMES]: canCreateThemes,
      [TEACHER_PERMISSIONS.MANAGE_TEMPLATES]: canManageTemplates
    };
    
    await addTeacher(name, code, password, permissions);
    
    // Eingabefelder zurücksetzen
    if (elements.newTeacherName) elements.newTeacherName.value = "";
    if (elements.newTeacherCode) elements.newTeacherCode.value = "";
    if (elements.newTeacherPassword) elements.newTeacherPassword.value = "";
    if (elements.canCreateThemes) elements.canCreateThemes.checked = false;
    if (elements.canManageTemplates) elements.canManageTemplates.checked = false;
    
    updateTeachersAdminTab();
    updateSystemInfoTab();
    
    // Event auslösen, dass Lehrer aktualisiert wurden
    document.dispatchEvent(new CustomEvent("teachersUpdated", { detail: { teachers: allTeachers } }));
    
    showNotification(`Lehrer "${name}" wurde hinzugefügt.`);
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoader();
  }
}

/**
 * Lehrer bearbeiten Modal anzeigen
 */
function showEditTeacherModal(teacher) {
  if (elements.editTeacherName) elements.editTeacherName.value = teacher.name;
  if (elements.editTeacherCode) elements.editTeacherCode.value = teacher.code;
  if (elements.editTeacherPassword) elements.editTeacherPassword.value = teacher.password;
  
  // Berechtigungen setzen
  if (elements.editCanCreateThemes) {
    elements.editCanCreateThemes.checked = teacher.permissions && 
      teacher.permissions[TEACHER_PERMISSIONS.CREATE_THEMES] === true;
  }
  
  if (elements.editCanManageTemplates) {
    elements.editCanManageTemplates.checked = teacher.permissions && 
      teacher.permissions[TEACHER_PERMISSIONS.MANAGE_TEMPLATES] === true;
  }
  
  selectedTeacher = teacher;
  if (elements.editTeacherModal) elements.editTeacherModal.style.display = "flex";
}

/**
 * Bearbeiteten Lehrer speichern
 */
async function saveEditedTeacher() {
  if (!selectedTeacher) return;

  const name = elements.editTeacherName ? elements.editTeacherName.value.trim() : "";
  const code = elements.editTeacherCode ? elements.editTeacherCode.value.trim() : "";
  const password = elements.editTeacherPassword ? elements.editTeacherPassword.value.trim() : "";
  
  const canCreateThemes = elements.editCanCreateThemes ? elements.editCanCreateThemes.checked : false;
  const canManageTemplates = elements.editCanManageTemplates ? elements.editCanManageTemplates.checked : false;

  if (!name || !code || !password) {
    showNotification("Bitte alle Felder ausfüllen.", "warning");
    return;
  }

  if (code.length > 5) {
    showNotification("Kürzel darf maximal 5 Zeichen haben.", "warning");
    return;
  }

  showLoader();
  
  try {
    // Berechtigungen zusammenstellen
    const permissions = {
      [TEACHER_PERMISSIONS.CREATE_THEMES]: canCreateThemes,
      [TEACHER_PERMISSIONS.MANAGE_TEMPLATES]: canManageTemplates
    };
    
    await updateTeacher(selectedTeacher.code, name, code, password, permissions);
    
    updateTeachersAdminTab();
    updateSystemInfoTab();
    
    // Event auslösen, dass Lehrer aktualisiert wurden
    document.dispatchEvent(new CustomEvent("teachersUpdated", { detail: { teachers: allTeachers } }));
    
    showNotification(`Lehrer "${name}" wurde aktualisiert.`);
    if (elements.editTeacherModal) elements.editTeacherModal.style.display = "none";
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoader();
  }
}

/**
 * Lehrer löschen Bestätigung anzeigen
 */
function showDeleteTeacherConfirmation() {
  teacherToDelete = selectedTeacher;
  if (elements.deleteTeacherName) elements.deleteTeacherName.textContent = teacherToDelete.name;
  if (elements.editTeacherModal) elements.editTeacherModal.style.display = "none";
  if (elements.confirmDeleteTeacherModal) elements.confirmDeleteTeacherModal.style.display = "flex";
}

/**
 * Lehrer löschen bestätigen
 */
async function confirmDeleteTeacher() {
  if (!teacherToDelete) return;
  
  showLoader();
  
  try {
    await deleteTeacher(teacherToDelete.code);
    
    updateTeachersAdminTab();
    updateSystemInfoTab();
    
    // Event auslösen, dass Lehrer aktualisiert wurden
    document.dispatchEvent(new CustomEvent("teachersUpdated", { detail: { teachers: allTeachers } }));
    
    showNotification(`Lehrer "${teacherToDelete.name}" wurde gelöscht.`);
    if (elements.confirmDeleteTeacherModal) elements.confirmDeleteTeacherModal.style.display = "none";
    teacherToDelete = null;
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoader();
  }
}

/**
 * Alle Lehrer löschen bestätigen
 */
function confirmDeleteAllTeachers() {
  if (!elements.adminDeleteVerificationCode) return;
  
  const code = elements.adminDeleteVerificationCode.value.trim().toLowerCase();
  if (code !== "delete teachers") {
    showNotification('Bitte "delete teachers" eingeben, um zu bestätigen.', "error");
    return;
  }
  
  if (!confirm("Sollen wirklich ALLE Lehrer gelöscht werden?\n\nDas System wird auf Standard-Lehrer zurückgesetzt!\n\nDieser Vorgang kann nicht rückgängig gemacht werden!")) {
    return;
  }
  
  performDeleteAllTeachers();
}

/**
 * Alle Lehrer löschen
 */
async function performDeleteAllTeachers() {
  showLoader();
  try {
    await deleteAllTeachers();
    
    updateTeachersAdminTab();
    updateSystemInfoTab();
    
    // Event auslösen, dass Lehrer aktualisiert wurden
    document.dispatchEvent(new CustomEvent("teachersUpdated", { detail: { teachers: allTeachers } }));
    
    if (elements.adminDeleteVerificationCode) elements.adminDeleteVerificationCode.value = "";
    showNotification("Alle Lehrer wurden gelöscht. Standard-Lehrer wiederhergestellt.");
  } catch (error) {
    showNotification("Fehler beim Löschen der Lehrer: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

/**
 * Alle Systemdaten löschen bestätigen
 */
function confirmDeleteAllSystemData() {
  if (!elements.adminDeleteVerificationCode) return;
  
  const code = elements.adminDeleteVerificationCode.value.trim().toLowerCase();
  if (code !== "delete everything") {
    showNotification('Bitte "delete everything" eingeben, um zu bestätigen.', "error");
    return;
  }
  
  if (!confirm("Sollen wirklich ALLE DATEN gelöscht werden?\n\n- Alle Lehrer (außer Standard-Lehrer)\n- Alle Themen und Gruppen\n- Alle Bewertungen\n- Kompletter System-Reset\n\nDieser Vorgang kann NICHT rückgängig gemacht werden!")) {
    return;
  }
  
  performDeleteAllSystemData();
}

/**
 * Alle Systemdaten löschen
 */
async function performDeleteAllSystemData() {
  showLoader();
  try {
    // 1. Alle Daten löschen
    await deleteAllData();
    
    // 2. Alle Lehrer auf Standard zurücksetzen
    await deleteAllTeachers();
    
    // 3. UI aktualisieren
    updateTeachersAdminTab();
    updateSystemInfoTab();
    
    // Event auslösen, dass Lehrer aktualisiert wurden
    document.dispatchEvent(new CustomEvent("teachersUpdated", { detail: { teachers: allTeachers } }));
    
    if (elements.adminDeleteVerificationCode) elements.adminDeleteVerificationCode.value = "";
    
    showNotification("Kompletter System-Reset durchgeführt. Alle Daten gelöscht.");
  } catch (error) {
    showNotification("Fehler beim System-Reset: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

/**
 * System-Daten exportieren
 */
async function exportSystemData() {
  showLoader();
  try {
    const exportData = await exportAllData();
    const jsonString = JSON.stringify(exportData, null, 2);
    
    downloadFile(
      `WBS_System_Export_${new Date().toISOString().split('T')[0]}.json`, 
      jsonString, 
      "application/json"
    );
    
    showNotification("Systemdaten wurden exportiert.");
  } catch (error) {
    console.error("Fehler beim Exportieren:", error);
    showNotification("Fehler beim Exportieren der Daten.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Import-Datei verarbeiten
 */
function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  
  reader.onload = async function(e) {
    try {
      const content = e.target.result;
      const importData = JSON.parse(content);
      
      if (confirm("Sollen die Daten wirklich importiert werden? Bestehende Daten werden überschrieben!")) {
        showLoader();
        try {
          await importAllData(importData);
          
          updateTeachersAdminTab();
          updateSystemInfoTab();
          
          // Event auslösen, dass Lehrer aktualisiert wurden
          document.dispatchEvent(new CustomEvent("teachersUpdated", { detail: { teachers: allTeachers } }));
          
          showNotification("Systemdaten wurden importiert.");
        } catch (error) {
          console.error("Fehler beim Importieren:", error);
          showNotification("Fehler beim Importieren der Daten: " + error.message, "error");
        } finally {
          hideLoader();
        }
      }
    } catch (error) {
      console.error("Fehler beim Parsen der Import-Datei:", error);
      showNotification("Ungültiges Dateiformat.", "error");
    }
    
    // Zurücksetzen des Datei-Inputs
    if (elements.importFileInput) elements.importFileInput.value = "";
  };
  
  reader.readAsText(file);
}
