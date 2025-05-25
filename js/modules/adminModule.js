// js/modules/adminModule.js - Vollständig erweiterte Version

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
  systemSettings,
  updateSystemDates
} from "../adminService.js";
import { loadAssessmentTemplates, assessmentTemplates } from "../assessmentService.js";
import { TEACHER_PERMISSIONS, ASSESSMENT_TEMPLATES } from "../constants.js";

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
  
  // Lehrer-Verwaltung
  newTeacherName: null,
  newTeacherCode: null,
  newTeacherPassword: null,
  canCreateThemes: null,
  addTeacherBtn: null,
  teachersAdminTable: null,
  
  // Lehrer-Bearbeitung
  editTeacherModal: null,
  editTeacherName: null,
  editTeacherCode: null,
  editTeacherPassword: null,
  editCanCreateThemes: null,
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
  schoolYearEnd: null,
  lastAssessmentDate: null,
  saveSystemSettingsBtn: null,
  
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
let lastSystemStatsUpdate = null;

/**
 * Initialisiert das Admin-Modul
 */
export function initAdminModule() {
  // DOM-Elemente abrufen
  loadDOMElements();
  
  // Event-Listener hinzufügen
  setupEventListeners();
  
  // Systemeinstellungen laden
  loadSystemSettings();
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
  
  // Lehrer-Verwaltung
  elements.newTeacherName = document.getElementById("newTeacherName");
  elements.newTeacherCode = document.getElementById("newTeacherCode");
  elements.newTeacherPassword = document.getElementById("newTeacherPassword");
  elements.canCreateThemes = document.getElementById("canCreateThemes");
  elements.addTeacherBtn = document.getElementById("addTeacherBtn");
  elements.teachersAdminTable = document.getElementById("teachersAdminTable");
  
  // Lehrer-Bearbeitung
  elements.editTeacherModal = document.getElementById("editTeacherModal");
  elements.editTeacherName = document.getElementById("editTeacherName");
  elements.editTeacherCode = document.getElementById("editTeacherCode");
  elements.editTeacherPassword = document.getElementById("editTeacherPassword");
  elements.editCanCreateThemes = document.getElementById("editCanCreateThemes");
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
  elements.schoolYearEnd = document.getElementById("schoolYearEnd");
  elements.lastAssessmentDate = document.getElementById("lastAssessmentDate");
  elements.saveSystemSettingsBtn = document.getElementById("saveSystemSettingsBtn");
  
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

  // NEU: System-Einstellungen speichern
  if (elements.saveSystemSettingsBtn) {
    elements.saveSystemSettingsBtn.addEventListener("click", saveSystemSettingsHandler);
  }

  // NEU: Event-Listener für Schuljahr-Änderung
  if (elements.currentSchoolYear) {
    elements.currentSchoolYear.addEventListener("change", handleSchoolYearChange);
  }

  // NEU: Event-Listener für Schuljahresende-Änderung
  if (elements.schoolYearEnd) {
    elements.schoolYearEnd.addEventListener("change", validateSchoolYearEnd);
  }

  // NEU: Event-Listener für Bewertungsfrist-Änderung
  if (elements.lastAssessmentDate) {
    elements.lastAssessmentDate.addEventListener("change", validateAssessmentDate);
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
    
    // NEU: Anzahl der Bewertungsraster des Lehrers anzeigen
    const templateCount = getTeacherTemplateCount(teacher.code);
    
    tr.innerHTML = `
      <td>${teacher.name}</td>
      <td><span class="teacher-code">${teacher.code}</span></td>
      <td>
        <div class="teacher-permissions">
          <span class="permission-icon ${canCreateThemes ? 'enabled' : 'disabled'}" title="Themen erstellen">
            ${canCreateThemes ? '✓' : '✗'} Themen
          </span>
          <div class="template-count" title="Anzahl Bewertungsraster">
            📝 ${templateCount}/${ASSESSMENT_TEMPLATES.maxTemplatesPerTeacher}
          </div>
        </div>
      </td>
      <td>${createdDate}</td>
      <td>
        <div class="teacher-actions">
          <button class="edit-btn" data-code="${teacher.code}" title="Bearbeiten">✏️</button>
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
 * NEU: Ermittelt die Anzahl der Bewertungsraster für einen Lehrer
 */
function getTeacherTemplateCount(teacherCode) {
  if (!assessmentTemplates || !Array.isArray(assessmentTemplates)) {
    return 0;
  }
  
  return assessmentTemplates.filter(template => 
    template.created_by === teacherCode
  ).length;
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
  
  // NEU: Systemeinstellungen in die UI laden
  if (elements.currentSchoolYear) {
    elements.currentSchoolYear.value = systemSettings.currentSchoolYear || "";
    
    // Schuljahre-Dropdown befüllen, falls es ein Select ist
    populateSchoolYearDropdown();
  }
  
  if (elements.schoolYearEnd) {
    elements.schoolYearEnd.value = systemSettings.schoolYearEnd || "";
  }
  
  if (elements.lastAssessmentDate) {
    elements.lastAssessmentDate.value = systemSettings.lastAssessmentDate || "";
  }
  
  // NEU: Deadline-Warnungen prüfen
  checkSystemDeadlineWarnings();
  
  lastSystemStatsUpdate = new Date();
}

/**
 * NEU: Befüllt das Schuljahr-Dropdown
 */
function populateSchoolYearDropdown() {
  if (!elements.currentSchoolYear || elements.currentSchoolYear.tagName !== "SELECT") return;
  
  const currentYear = new Date().getFullYear();
  const currentValue = elements.currentSchoolYear.value;
  
  elements.currentSchoolYear.innerHTML = '<option value="">Bitte wählen...</option>';
  
  // Generiere Schuljahre (aktuelles Jahr ± 2 Jahre)
  for (let i = -2; i <= 2; i++) {
    const year = currentYear + i;
    const schoolYear = `${year}/${year + 1}`;
    
    const option = document.createElement("option");
    option.value = schoolYear;
    option.textContent = schoolYear;
    
    if (schoolYear === currentValue) {
      option.selected = true;
    }
    
    elements.currentSchoolYear.appendChild(option);
  }
}

/**
 * NEU: Prüft System-Deadline-Warnungen
 */
function checkSystemDeadlineWarnings() {
  const now = new Date();
  let warnings = [];
  
  // Prüfe Schuljahresende
  if (systemSettings.schoolYearEnd) {
    const schoolYearEnd = new Date(systemSettings.schoolYearEnd);
    const daysToEnd = Math.ceil((schoolYearEnd - now) / (1000 * 60 * 60 * 24));
    
    if (daysToEnd >= 0 && daysToEnd <= 30) {
      warnings.push({
        type: daysToEnd <= 7 ? "urgent" : "warning",
        message: `Schuljahresende in ${daysToEnd} Tagen (${formatDate(systemSettings.schoolYearEnd)})`
      });
    }
  }
  
  // Prüfe letzte Bewertungsfrist
  if (systemSettings.lastAssessmentDate) {
    const lastAssessmentDate = new Date(systemSettings.lastAssessmentDate);
    const daysToAssessment = Math.ceil((lastAssessmentDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysToAssessment >= 0 && daysToAssessment <= 14) {
      warnings.push({
        type: daysToAssessment <= 3 ? "urgent" : "warning",
        message: `Letzte Bewertungsfrist in ${daysToAssessment} Tagen (${formatDate(systemSettings.lastAssessmentDate)})`
      });
    }
  }
  
  // Warnungen anzeigen
  displaySystemWarnings(warnings);
}

/**
 * NEU: Zeigt System-Warnungen an
 */
function displaySystemWarnings(warnings) {
  // Entferne vorherige Warnungen
  const existingWarnings = document.querySelectorAll(".system-deadline-warning");
  existingWarnings.forEach(warning => warning.remove());
  
  if (warnings.length === 0) return;
  
  const systemTab = elements.systemTab;
  if (!systemTab) return;
  
  warnings.forEach(warning => {
    const warningDiv = document.createElement("div");
    warningDiv.className = `system-deadline-warning deadline-warning ${warning.type}`;
    warningDiv.innerHTML = `
      <span class="deadline-warning-icon">⚠️</span>
      <span class="deadline-warning-text">${warning.message}</span>
      <button class="deadline-warning-close">&times;</button>
    `;
    
    // Event-Listener für Schließen-Button
    warningDiv.querySelector(".deadline-warning-close").addEventListener("click", () => {
      warningDiv.remove();
    });
    
    // Warnung am Anfang des System-Tabs einfügen
    systemTab.insertBefore(warningDiv, systemTab.firstChild);
  });
}

/**
 * NEU: Behandelt Schuljahr-Änderungen
 */
async function handleSchoolYearChange() {
  if (!elements.currentSchoolYear) return;
  
  const newSchoolYear = elements.currentSchoolYear.value;
  
  if (newSchoolYear && newSchoolYear !== systemSettings.currentSchoolYear) {
    showLoader();
    try {
      const updated = await saveSystemSettings({
        ...systemSettings,
        currentSchoolYear: newSchoolYear
      });
      
      if (updated) {
        showNotification("Schuljahr erfolgreich aktualisiert.");
        
        // Event auslösen für andere Module
        document.dispatchEvent(new CustomEvent("systemSettingsUpdated", { 
          detail: { ...systemSettings, currentSchoolYear: newSchoolYear }
        }));
      } else {
        throw new Error("Fehler beim Speichern");
      }
    } catch (error) {
      console.error("Fehler beim Speichern des Schuljahres:", error);
      showNotification("Fehler beim Speichern des Schuljahres.", "error");
      
      // Wert zurücksetzen
      elements.currentSchoolYear.value = systemSettings.currentSchoolYear || "";
    } finally {
      hideLoader();
    }
  }
}

/**
 * NEU: Validiert das Schuljahresende
 */
function validateSchoolYearEnd() {
  if (!elements.schoolYearEnd) return;
  
  const schoolYearEnd = elements.schoolYearEnd.value;
  
  if (schoolYearEnd) {
    const endDate = new Date(schoolYearEnd);
    const now = new Date();
    
    // Prüfe, ob das Datum in der Vergangenheit liegt
    if (endDate < now) {
      showNotification("Das Schuljahresende sollte in der Zukunft liegen.", "warning");
    }
    
    // Prüfe, ob das Datum zu weit in der Zukunft liegt (mehr als 2 Jahre)
    const maxDate = new Date(now.getTime() + (2 * 365 * 24 * 60 * 60 * 1000));
    if (endDate > maxDate) {
      showNotification("Das Schuljahresende liegt sehr weit in der Zukunft.", "warning");
    }
  }
}

/**
 * NEU: Validiert die Bewertungsfrist
 */
function validateAssessmentDate() {
  if (!elements.lastAssessmentDate || !elements.schoolYearEnd) return;
  
  const assessmentDate = elements.lastAssessmentDate.value;
  const schoolYearEnd = elements.schoolYearEnd.value;
  
  if (assessmentDate && schoolYearEnd) {
    const assessment = new Date(assessmentDate);
    const schoolEnd = new Date(schoolYearEnd);
    
    // Bewertungsfrist sollte vor Schuljahresende liegen
    if (assessment > schoolEnd) {
      showNotification("Die Bewertungsfrist sollte vor dem Schuljahresende liegen.", "warning");
    }
  }
}

/**
 * NEU: Speichert alle Systemeinstellungen
 */
async function saveSystemSettingsHandler() {
  if (!elements.currentSchoolYear || !elements.schoolYearEnd || !elements.lastAssessmentDate) {
    showNotification("Nicht alle Systemeinstellungen verfügbar.", "error");
    return;
  }
  
  const currentSchoolYear = elements.currentSchoolYear.value;
  const schoolYearEnd = elements.schoolYearEnd.value;
  const lastAssessmentDate = elements.lastAssessmentDate.value;
  
  if (!currentSchoolYear) {
    showNotification("Bitte wählen Sie ein Schuljahr aus.", "warning");
    elements.currentSchoolYear.focus();
    return;
  }
  
  if (!schoolYearEnd) {
    showNotification("Bitte geben Sie das Schuljahresende an.", "warning");
    elements.schoolYearEnd.focus();
    return;
  }
  
  if (!lastAssessmentDate) {
    showNotification("Bitte geben Sie die letzte Bewertungsfrist an.", "warning");
    elements.lastAssessmentDate.focus();
    return;
  }
  
  // Validierung
  const endDate = new Date(schoolYearEnd);
  const assessmentDate = new Date(lastAssessmentDate);
  
  if (assessmentDate > endDate) {
    showNotification("Die Bewertungsfrist muss vor dem Schuljahresende liegen.", "error");
    return;
  }
  
  showLoader();
  
  try {
    const newSettings = {
      currentSchoolYear,
      schoolYearEnd,
      lastAssessmentDate
    };
    
    const success = await updateSystemDates(schoolYearEnd, lastAssessmentDate);
    
    if (success) {
      showNotification("Systemeinstellungen erfolgreich gespeichert.");
      
      // UI aktualisieren
      await updateSystemInfoTab();
      
      // Event auslösen
      document.dispatchEvent(new CustomEvent("systemSettingsUpdated", { 
        detail: newSettings
      }));
    } else {
      throw new Error("Fehler beim Speichern");
    }
  } catch (error) {
    console.error("Fehler beim Speichern der Systemeinstellungen:", error);
    showNotification("Fehler beim Speichern der Systemeinstellungen: " + error.message, "error");
  } finally {
    hideLoader();
  }
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
      [TEACHER_PERMISSIONS.CREATE_THEMES]: canCreateThemes
    };
    
    await addTeacher(name, code, password, permissions);
    
    // Eingabefelder zurücksetzen
    if (elements.newTeacherName) elements.newTeacherName.value = "";
    if (elements.newTeacherCode) elements.newTeacherCode.value = "";
    if (elements.newTeacherPassword) elements.newTeacherPassword.value = "";
    if (elements.canCreateThemes) elements.canCreateThemes.checked = false;
    
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
      [TEACHER_PERMISSIONS.CREATE_THEMES]: canCreateThemes
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
  
  if (!confirm("Sollen wirklich ALLE DATEN gelöscht werden?\n\n- Alle Lehrer (außer Standard-Lehrer)\n- Alle Themen und Gruppen\n- Alle Bewertungen\n- Alle Bewertungsraster\n- Kompletter System-Reset\n\nDieser Vorgang kann NICHT rückgängig gemacht werden!")) {
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
 * NEU: System-Daten exportieren (mit neuen Feldern)
 */
async function exportSystemData() {
  showLoader();
  try {
    const exportData = await exportAllData();
    
    // NEU: Erweitere Export-Daten mit zusätzlichen Informationen
    const enhancedExportData = {
      ...exportData,
      exportedBy: "Administrator",
      exportVersion: "2.0",
      systemInfo: {
        currentSchoolYear: systemSettings.currentSchoolYear,
        schoolYearEnd: systemSettings.schoolYearEnd,
        lastAssessmentDate: systemSettings.lastAssessmentDate,
        totalTeachers: allTeachers.length,
        totalTemplates: assessmentTemplates.length
      },
      statistics: await getSystemStats()
    };
    
    const jsonString = JSON.stringify(enhancedExportData, null, 2);
    
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
      
      // NEU: Validiere Import-Daten
      if (!validateImportData(importData)) {
        showNotification("Ungültiges oder inkompatibles Datenformat.", "error");
        return;
      }
      
      const confirmMessage = `Sollen die Daten wirklich importiert werden?\n\n` +
        `Exportiert am: ${importData.exportDate ? new Date(importData.exportDate).toLocaleString('de-DE') : 'Unbekannt'}\n` +
        `Version: ${importData.exportVersion || importData.version || 'Unbekannt'}\n` +
        `Lehrer: ${importData.teachers ? importData.teachers.length : 0}\n` +
        `Themen: ${importData.themes ? importData.themes.length : 0}\n` +
        `Bewertungsraster: ${importData.assessmentTemplates ? importData.assessmentTemplates.length : 0}\n\n` +
        `ACHTUNG: Bestehende Daten werden überschrieben!`;
      
      if (confirm(confirmMessage)) {
        showLoader();
        try {
          await importAllData(importData);
          
          updateTeachersAdminTab();
          updateSystemInfoTab();
          
          // Event auslösen, dass Lehrer aktualisiert wurden
          document.dispatchEvent(new CustomEvent("teachersUpdated", { detail: { teachers: allTeachers } }));
          
          showNotification("Systemdaten wurden erfolgreich importiert.");
        } catch (error) {
          console.error("Fehler beim Importieren:", error);
          showNotification("Fehler beim Importieren der Daten: " + error.message, "error");
        } finally {
          hideLoader();
        }
      }
    } catch (error) {
      console.error("Fehler beim Parsen der Import-Datei:", error);
      showNotification("Ungültiges Dateiformat oder beschädigte JSON-Datei.", "error");
    }
    
    // Zurücksetzen des Datei-Inputs
    if (elements.importFileInput) elements.importFileInput.value = "";
  };
  
  reader.readAsText(file);
}

/**
 * NEU: Validiert Import-Daten
 */
function validateImportData(data) {
  // Grundlegende Struktur prüfen
  if (!data || typeof data !== 'object') {
    return false;
  }
  
  // Prüfe auf erforderliche Felder
  const requiredFields = ['teachers'];
  for (const field of requiredFields) {
    if (!data[field] || !Array.isArray(data[field])) {
      console.error(`Fehlendes oder ungültiges Feld: ${field}`);
      return false;
    }
  }
  
  // Prüfe Lehrer-Struktur
  for (const teacher of data.teachers) {
    if (!teacher.name || !teacher.code || !teacher.password) {
      console.error("Ungültige Lehrer-Daten:", teacher);
      return false;
    }
  }
  
  // Prüfe Themen-Struktur (falls vorhanden)
  if (data.themes) {
    for (const theme of data.themes) {
      if (!theme.title || !theme.created_by) {
        console.error("Ungültige Themen-Daten:", theme);
        return false;
      }
    }
  }
  
  return true;
}
