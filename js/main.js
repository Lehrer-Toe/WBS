// js/main.js - KOMPLETT ÜBERARBEITET für Gruppen-System

import { initDatabase, ensureCollection }

function openEditGradeModal(student) {
  selectedGradeStudent = student;
  const assessment = teacherData.assessments[student.id] || {};
  const editFinalGrade = document.getElementById("editFinalGrade");
  const editGradeModal = document.getElementById("editGradeModal");
  
  if (editFinalGrade) editFinalGrade.value = assessment.finalGrade || "";
  if (editGradeModal) editGradeModal.style.display = "flex";
}

async function saveEditedGrade() {
  if (!selectedGradeStudent) return;
  const editFinalGrade = document.getElementById("editFinalGrade");
  const val = parseFloat(editFinalGrade.value);
  
  if (isNaN(val) || val < 1 || val > 6) {
    showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
    return;
  }
  
  if (!teacherData.assessments[selectedGradeStudent.id]) {
    teacherData.assessments[selectedGradeStudent.id] = {
      templateId: selectedGradeStudent.templateId || "wbs_standard",
      status: ASSESSMENT_STATUS.NOT_STARTED
    };
  }
  
  teacherData.assessments[selectedGradeStudent.id].finalGrade = val;
  updateAssessmentStatus(selectedGradeStudent.id);
  
  showLoader();
  const saved = await saveTeacherData();
  hideLoader();
  
  if (saved) {
    updateOverviewContent();
    updateDashboard();
    
    if (selectedGradeStudent.id === currentSelectedStudentId) {
      const finalGradeInput = document.getElementById("finalGrade");
      if (finalGradeInput) finalGradeInput.value = val;
    }
    updateStudentGradeInList(selectedGradeStudent.id, val);
    showNotification("Note aktualisiert.");
    const editGradeModal = document.getElementById("editGradeModal");
    if (editGradeModal) editGradeModal.style.display = "none";
  }
}

function printOverviewData() {
  window.print();
} from "./firebaseClient.js";
import {
  teacherData, currentUser, loadTeacherData, saveTeacherData,
  createGroup, addStudentToGroup, getResponsibleGroups, getAssignedStudents, getAccessibleStudents,
  getDashboardStats, getCurrentSchoolYear, getSortedGroups, setPreferredSorting, setThemeSortOrder,
  updateAssessmentStatus, canAssessStudent, hasAccessToStudent, canEditGroup, ASSESSMENT_STATUS,
  createAssessmentTemplate, updateAssessmentTemplate, deleteAssessmentTemplate,
  getAssessmentTemplate, getAllAssessmentTemplates
} from "./dataService.js";
import {
  showLoader, hideLoader, showNotification, formatDate, calculateWeightedAverageGrade, initTeacherGrid
} from "./uiService.js";
import { DEFAULT_ASSESSMENT_CATEGORIES, DEFAULT_TEACHERS, APP_CONFIG } from "./constants.js";
import {
  loadAllTeachers, saveAllTeachers, loginAdmin, logoutAdmin, addTeacher, updateTeacher, deleteTeacher,
  validateTeacher, currentAdmin, allTeachers, deleteAllTeachers, deleteAllTeacherData,
  loadSystemSettings, saveSystemSettings, startNewSchoolYear, setCurrentSchoolYear, getSystemStats, systemSettings
} from "./adminService.js";

// Globale Zustände
let selectedGroup = null;
let selectedStudent = null;
let groupToDelete = null;
let selectedGradeStudent = null;
let infoTextSaveTimer = null;
let lastSelectedTheme = null;
let lastSelectedDate = null;
let currentSelectedStudentId = null;
let stickyAverageElement = null;
let dashboardSortOrder = 'theme';

// Admin-spezifische globale Variablen
let selectedTeacher = null;
let teacherToDelete = null;

// Template-spezifische globale Variablen
let selectedTemplate = null;
let templateToDelete = null;
let editingTemplate = null;

// Dashboard-spezifische Variablen
let dashboardStats = null;
let dashboardUpdateTimer = null;

// DOM-Elemente - Basis
const loginSection = document.getElementById("loginSection");
const appSection = document.getElementById("appSection");
const teacherGrid = document.getElementById("teacherGrid");
const teacherAvatar = document.getElementById("teacherAvatar");
const teacherName = document.getElementById("teacherName");
const passwordModal = document.getElementById("passwordModal");
const passwordInput = document.getElementById("passwordInput");
const loginPrompt = document.getElementById("loginPrompt");
const confirmLogin = document.getElementById("confirmLogin");
const cancelLogin = document.getElementById("cancelLogin");
const closePasswordModal = document.getElementById("closePasswordModal");
const logoutBtn = document.getElementById("logoutBtn");

// Admin DOM-Elemente
const showAdminLoginBtn = document.getElementById("showAdminLoginBtn");
const adminLoginSection = document.getElementById("adminLoginSection");
const backToLoginBtn = document.getElementById("backToLoginBtn");
const adminUsername = document.getElementById("adminUsername");
const adminPassword = document.getElementById("adminPassword");
const adminLoginBtn = document.getElementById("adminLoginBtn");
const adminSection = document.getElementById("adminSection");
const adminLogoutBtn = document.getElementById("adminLogoutBtn");

// Tabs
const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

// Standard-Datum
const today = new Date();
const defaultDate = today.getFullYear() + "-" + String(today.getMonth() + 1).padStart(2, "0") + "-" + String(today.getDate()).padStart(2, "0");

// === HAUPT-INITIALISIERUNG ===

document.addEventListener("DOMContentLoaded", async () => {
  console.log(`${APP_CONFIG.name} wird initialisiert...`);
  showLoader();
  try {
    await initDatabase();
    await ensureCollection();
    
    console.log("Lade Lehrer-Daten...");
    await loadAllTeachers();
    await loadSystemSettings();
    
    window.allTeachers = allTeachers;
    console.log("Verfügbare Lehrer:", allTeachers.length);
    
    initTeacherGrid(teacherGrid, showPasswordModal, allTeachers);
    setupEventListeners();
    createStickyAverageElement();
    
    console.log("Initialisierung abgeschlossen!");
  } catch (error) {
    console.error("Fehler bei der Initialisierung:", error);
    showNotification("Fehler bei der Initialisierung. Bitte Seite neu laden.", "error");
  } finally {
    hideLoader();
  }
});

function createStickyAverageElement() {
  stickyAverageElement = document.createElement("div");
  stickyAverageElement.className = "sticky-average";
  stickyAverageElement.textContent = "Ø 0.0";
  document.body.appendChild(stickyAverageElement);

  window.addEventListener("scroll", () => {
    const assessmentContent = document.getElementById("assessmentContent");
    if (!assessmentContent) return;
    
    const finalGradeDisplay = assessmentContent.querySelector(".final-grade-display");
    if (!finalGradeDisplay) return;
    
    const rect = finalGradeDisplay.getBoundingClientRect();
    if (rect.top < 0) {
      stickyAverageElement.style.display = "block";
    } else {
      stickyAverageElement.style.display = "none";
    }
  });
}

function showPasswordModal(teacher) {
  loginPrompt.textContent = `Bitte das Passwort für ${teacher.name} eingeben:`;
  passwordInput.value = "";
  passwordModal.style.display = "flex";
  passwordInput.focus();
  currentUser.name = teacher.name;
  currentUser.code = teacher.code;
  currentUser.password = teacher.password;
}

// === EVENT-LISTENER SETUP ===

function setupEventListeners() {
  // Basis-Event-Listener
  if (closePasswordModal) {
    closePasswordModal.addEventListener("click", () => passwordModal.style.display = "none");
  }
  if (cancelLogin) {
    cancelLogin.addEventListener("click", () => passwordModal.style.display = "none");
  }
  if (confirmLogin) {
    confirmLogin.addEventListener("click", login);
  }
  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") login();
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Tab-System
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      switchTab(tabId);
    });
  });

  setupDashboardEventListeners();
  setupGroupEventListeners();
  setupTemplateEventListeners();
  setupAssessmentEventListeners();
  setupOverviewEventListeners();
  setupSettingsEventListeners();
  setupModalEventListeners();
  setupAdminEventListeners();
}

// Dashboard Event-Listener
function setupDashboardEventListeners() {
  const dashboardSchoolYearSelect = document.getElementById("dashboardSchoolYearSelect");
  const dashboardSortSelect = document.getElementById("dashboardSortSelect");
  const dashboardViewToggle = document.getElementById("dashboardViewToggle");
  
  if (dashboardSchoolYearSelect) {
    dashboardSchoolYearSelect.addEventListener("change", updateDashboardContent);
  }
  
  if (dashboardSortSelect) {
    dashboardSortSelect.addEventListener("change", (e) => {
      dashboardSortOrder = e.target.value;
      setPreferredSorting(dashboardSortOrder);
      updateDashboardContent();
    });
  }
  
  if (dashboardViewToggle) {
    dashboardViewToggle.addEventListener("click", toggleDashboardView);
  }

  // Dashboard-Statistik-Karten anklickbar machen
  document.addEventListener('click', (e) => {
    if (e.target.closest('.stat-card')) {
      const statCard = e.target.closest('.stat-card');
      const cardType = statCard.dataset.type;
      if (cardType) showQuickOverview(cardType);
    }
  });
}

// Gruppen Event-Listener
function setupGroupEventListeners() {
  const newGroupTheme = document.getElementById("newGroupTheme");
  const newGroupDate = document.getElementById("newGroupDate");
  const addGroupBtn = document.getElementById("addGroupBtn");
  const groupViewFilter = document.getElementById("groupViewFilter");

  if (addGroupBtn) {
    addGroupBtn.addEventListener("click", addNewGroup);
  }
  
  if (groupViewFilter) {
    groupViewFilter.addEventListener("change", updateGroupsTab);
  }

  if (newGroupDate) {
    newGroupDate.value = defaultDate;
  }
}

// Assessment Event-Listener
function setupAssessmentEventListeners() {
  const assessmentThemeSelect = document.getElementById("assessmentThemeSelect");
  const assessmentDateSelect = document.getElementById("assessmentDateSelect");
  const assessmentStatusFilter = document.getElementById("assessmentStatusFilter");
  
  if (assessmentThemeSelect) {
    assessmentThemeSelect.addEventListener("change", () => {
      lastSelectedTheme = assessmentThemeSelect.value;
      populateAssessmentDateSelect();
      updateAssessmentStudentList();
    });
  }
  if (assessmentDateSelect) {
    assessmentDateSelect.addEventListener("change", () => {
      lastSelectedDate = assessmentDateSelect.value;
      updateAssessmentStudentList();
    });
  }
  if (assessmentStatusFilter) {
    assessmentStatusFilter.addEventListener("change", updateAssessmentStudentList);
  }
}

// Template Event-Listener
function setupTemplateEventListeners() {
  const addCriterionBtn = document.getElementById("addCriterionBtn");
  const saveTemplateBtn = document.getElementById("saveTemplateBtn");
  const addEditCriterionBtn = document.getElementById("addEditCriterionBtn");
  
  if (addCriterionBtn) {
    addCriterionBtn.addEventListener("click", addCriterionRow);
  }
  if (saveTemplateBtn) {
    saveTemplateBtn.addEventListener("click", saveNewTemplate);
  }
  if (addEditCriterionBtn) {
    addEditCriterionBtn.addEventListener("click", () => addCriterionRow(document.getElementById("editTemplateCriteriaContainer")));
  }
}

// Overview Event-Listener
function setupOverviewEventListeners() {
  const overviewYearSelect = document.getElementById("overviewYearSelect");
  const overviewThemeSelect = document.getElementById("overviewThemeSelect");
  const overviewDateSelect = document.getElementById("overviewDateSelect");
  const overviewStatusSelect = document.getElementById("overviewStatusSelect");
  const printBtn = document.getElementById("printBtn");
  
  if (overviewYearSelect) {
    overviewYearSelect.addEventListener("change", () => {
      populateOverviewThemeSelect();
      populateOverviewDateSelect();
      updateOverviewContent();
    });
  }
  if (overviewThemeSelect) {
    overviewThemeSelect.addEventListener("change", updateOverviewContent);
  }
  if (overviewDateSelect) {
    overviewDateSelect.addEventListener("change", updateOverviewContent);
  }
  if (overviewStatusSelect) {
    overviewStatusSelect.addEventListener("change", updateOverviewContent);
  }
  if (printBtn) {
    printBtn.addEventListener("click", printOverviewData);
  }
}

// Settings Event-Listener
function setupSettingsEventListeners() {
  const settingsYearSelect = document.getElementById("settingsYearSelect");
  const saveSettingsBtn = document.getElementById("saveSettingsBtn");
  const saveSortingBtn = document.getElementById("saveSortingBtn");
  const exportDataBtn = document.getElementById("exportDataBtn");
  const deleteDataBtn = document.getElementById("deleteDataBtn");
  
  if (settingsYearSelect) {
    settingsYearSelect.addEventListener("change", () => {
      populateSettingsDateSelect();
    });
  }
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", saveAppSettings);
  }
  if (saveSortingBtn) {
    saveSortingBtn.addEventListener("click", saveSortingSettings);
  }
  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", exportData);
  }
  if (deleteDataBtn) {
    deleteDataBtn.addEventListener("click", confirmDeleteAllData);
  }
}

// Modal Event-Listener
function setupModalEventListeners() {
  // Edit Group Modal
  const editGroupModal = document.getElementById("editGroupModal");
  const closeEditGroupModal = document.getElementById("closeEditGroupModal");
  const saveGroupBtn = document.getElementById("saveGroupBtn");
  const deleteGroupBtn = document.getElementById("deleteGroupBtn");
  
  if (closeEditGroupModal) {
    closeEditGroupModal.addEventListener("click", () => {
      editGroupModal.style.display = "none";
    });
  }
  if (saveGroupBtn) {
    saveGroupBtn.addEventListener("click", saveEditedGroup);
  }
  if (deleteGroupBtn) {
    deleteGroupBtn.addEventListener("click", showDeleteGroupConfirmation);
  }
  
  // Confirm Delete Group Modal
  const confirmDeleteGroupModal = document.getElementById("confirmDeleteGroupModal");
  const closeConfirmDeleteGroupModal = document.getElementById("closeConfirmDeleteGroupModal");
  const cancelDeleteGroupBtn = document.getElementById("cancelDeleteGroupBtn");
  const confirmDeleteGroupBtn = document.getElementById("confirmDeleteGroupBtn");
  
  if (closeConfirmDeleteGroupModal) {
    closeConfirmDeleteGroupModal.addEventListener("click", () => {
      confirmDeleteGroupModal.style.display = "none";
    });
  }
  if (cancelDeleteGroupBtn) {
    cancelDeleteGroupBtn.addEventListener("click", () => {
      confirmDeleteGroupModal.style.display = "none";
    });
  }
  if (confirmDeleteGroupBtn) {
    confirmDeleteGroupBtn.addEventListener("click", deleteGroup);
  }
  
  // Quick Overview Modal
  const quickOverviewModal = document.getElementById("quickOverviewModal");
  const closeQuickOverviewModal = document.getElementById("closeQuickOverviewModal");
  
  if (closeQuickOverviewModal) {
    closeQuickOverviewModal.addEventListener("click", () => {
      quickOverviewModal.style.display = "none";
    });
  }
  
  // Edit Grade Modal
  const editGradeModal = document.getElementById("editGradeModal");
  const closeEditGradeModal = document.getElementById("closeEditGradeModal");
  const saveGradeBtn = document.getElementById("saveGradeBtn");
  
  if (closeEditGradeModal) {
    closeEditGradeModal.addEventListener("click", () => {
      editGradeModal.style.display = "none";
    });
  }
  if (saveGradeBtn) {
    saveGradeBtn.addEventListener("click", saveEditedGrade);
  }
  
  // Edit Template Modal
  const editTemplateModal = document.getElementById("editTemplateModal");
  const closeEditTemplateModal = document.getElementById("closeEditTemplateModal");
  const updateTemplateBtn = document.getElementById("updateTemplateBtn");
  const deleteTemplateBtn = document.getElementById("deleteTemplateBtn");
  
  if (closeEditTemplateModal) {
    closeEditTemplateModal.addEventListener("click", () => {
      editTemplateModal.style.display = "none";
    });
  }
  if (updateTemplateBtn) {
    updateTemplateBtn.addEventListener("click", saveEditedTemplate);
  }
  if (deleteTemplateBtn) {
    deleteTemplateBtn.addEventListener("click", () => confirmDeleteTemplate(editingTemplate));
  }
}

// Admin Event-Listener
function setupAdminEventListeners() {
  // Admin Login anzeigen
  if (showAdminLoginBtn) {
    showAdminLoginBtn.addEventListener("click", () => {
      loginSection.style.display = "none";
      adminLoginSection.style.display = "block";
    });
  }

  // Zurück zur normalen Anmeldung
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener("click", () => {
      adminLoginSection.style.display = "none"; 
      loginSection.style.display = "block";
      if (adminUsername) adminUsername.value = "";
      if (adminPassword) adminPassword.value = "";
    });
  }

  // Admin Login
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener("click", performAdminLogin);
  }
  if (adminPassword) {
    adminPassword.addEventListener("keypress", (e) => {
      if (e.key === "Enter") performAdminLogin();
    });
  }

  // Admin Logout
  if (adminLogoutBtn) {
    adminLogoutBtn.addEventListener("click", performAdminLogout);
  }

  // Admin Tab switching
  const adminTabs = document.querySelectorAll("#adminSection .tab");
  const adminTabContents = document.querySelectorAll("#adminSection .tab-content");
  
  adminTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      adminTabs.forEach((t) => t.classList.remove("active"));
      adminTabContents.forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`${tabId}-tab`).classList.add("active");
      
      if (tabId === "teachers") {
        updateTeachersAdminTab();
      } else if (tabId === "schoolyear") {
        updateSchoolYearTab();
      } else if (tabId === "system") {
        updateSystemInfoTab();
      }
    });
  });

  // Admin-Funktionen
  const addTeacherBtn = document.getElementById("addTeacherBtn");
  const refreshSystemBtn = document.getElementById("refreshSystemBtn");
  const exportTeachersBtn = document.getElementById("exportTeachersBtn");
  const deleteAllTeachersBtn = document.getElementById("deleteAllTeachersBtn");
  const deleteAllDataBtn = document.getElementById("deleteAllDataBtn");
  const setSchoolYearBtn = document.getElementById("setSchoolYearBtn");
  const startNewSchoolYearBtn = document.getElementById("startNewSchoolYearBtn");
  
  if (addTeacherBtn) addTeacherBtn.addEventListener("click", addNewTeacher);
  if (refreshSystemBtn) refreshSystemBtn.addEventListener("click", refreshSystemInfo);
  if (exportTeachersBtn) exportTeachersBtn.addEventListener("click", exportAllTeachers);
  if (deleteAllTeachersBtn) deleteAllTeachersBtn.addEventListener("click", confirmDeleteAllTeachers);
  if (deleteAllDataBtn) deleteAllDataBtn.addEventListener("click", confirmDeleteAllSystemData);
  if (setSchoolYearBtn) setSchoolYearBtn.addEventListener("click", setSchoolYearManually);
  if (startNewSchoolYearBtn) startNewSchoolYearBtn.addEventListener("click", confirmStartNewSchoolYear);
  
  // Lehrer bearbeiten/löschen Eventlistener
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-teacher-btn')) {
      const teacherCode = e.target.dataset.code;
      if (teacherCode) showEditTeacherModal(teacherCode);
    }
    if (e.target.classList.contains('delete-teacher-btn')) {
      const teacherCode = e.target.dataset.code;
      if (teacherCode) showDeleteTeacherConfirmation(teacherCode);
    }
  });
}

// === TAB-WECHSEL & LOGIN ===

function switchTab(tabId) {
  tabs.forEach((t) => t.classList.remove("active"));
  tabContents.forEach((c) => c.classList.remove("active"));
  
  const targetTab = document.querySelector(`[data-tab="${tabId}"]`);
  const targetContent = document.getElementById(`${tabId}-tab`);
  
  if (targetTab && targetContent) {
    targetTab.classList.add("active");
    targetContent.classList.add("active");
    
    switch (tabId) {
      case "dashboard": updateDashboard(); break;
      case "groups": updateGroupsTab(); break;
      case "templates": updateTemplatesTab(); break;
      case "assessment": updateAssessmentTab(); break;
      case "overview": updateOverviewTab(); break;
      case "settings": updateSettingsTab(); break;
    }
  }
}

async function login() {
  if (passwordInput.value === currentUser.password) {
    passwordModal.style.display = "none";
    showLoader();
    await loadTeacherData();
    loginSection.style.display = "none";
    appSection.style.display = "block";
    teacherAvatar.textContent = currentUser.code.charAt(0);
    teacherName.textContent = currentUser.name;
    
    updateDashboard();
    populateTeacherSelects();
    populateTemplateSelects();
    startDashboardTimer();
    
    hideLoader();
    showNotification(`Willkommen, ${currentUser.name}!`);
  } else {
    showNotification("Falsches Passwort!", "error");
  }
}

function logout() {
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
    infoTextSaveTimer = null;
  }
  if (dashboardUpdateTimer) {
    clearInterval(dashboardUpdateTimer);
    dashboardUpdateTimer = null;
  }
  
  currentUser.name = null;
  currentUser.code = null;
  currentUser.password = null;
  teacherData.groups = [];
  teacherData.assessments = {};
  teacherData.assessmentTemplates = [];
  loginSection.style.display = "block";
  appSection.style.display = "none";
  showNotification("Abmeldung erfolgreich.");
}

function startDashboardTimer() {
  dashboardUpdateTimer = setInterval(() => {
    if (document.querySelector('.tab[data-tab="dashboard"]').classList.contains('active')) {
      updateDashboard();
    }
  }, 300000); // 5 Minuten
}

// === DASHBOARD ===

function updateDashboard() {
  dashboardStats = getDashboardStats();
  updateDashboardStats();
  updateDashboardStatusBar();
  updateDashboardSchoolYearSelect();
  updateDashboardContent();
}

function updateDashboardStats() {
  if (!dashboardStats) return;
  
  const elements = {
    totalAccessibleStudents: document.getElementById("totalAccessibleStudents"),
    totalAssignedStudents: document.getElementById("totalAssignedStudents"),
    totalGroups: document.getElementById("totalGroups"),
    studentsThisYear: document.getElementById("studentsThisYear"),
    completedAssessments: document.getElementById("completedAssessments"),
    currentSchoolYear: document.getElementById("currentSchoolYear")
  };
  
  if (elements.totalAccessibleStudents) elements.totalAccessibleStudents.textContent = dashboardStats.totalAccessible;
  if (elements.totalAssignedStudents) elements.totalAssignedStudents.textContent = dashboardStats.totalAssigned;
  if (elements.totalGroups) elements.totalGroups.textContent = dashboardStats.totalGroups;
  if (elements.studentsThisYear) elements.studentsThisYear.textContent = dashboardStats.studentsThisYear;
  if (elements.completedAssessments) elements.completedAssessments.textContent = dashboardStats.assessmentStats.completed;
  if (elements.currentSchoolYear) elements.currentSchoolYear.textContent = dashboardStats.currentSchoolYear;
}

function updateDashboardStatusBar() {
  if (!dashboardStats) return;
  
  const { assessmentStats } = dashboardStats;
  const total = assessmentStats.completed + assessmentStats.inProgress + assessmentStats.notStarted;
  
  const elements = {
    statusCompleted: document.getElementById("statusCompleted"),
    statusInProgress: document.getElementById("statusInProgress"),
    statusNotStarted: document.getElementById("statusNotStarted"),
    completedCount: document.getElementById("completedCount"),
    inProgressCount: document.getElementById("inProgressCount"),
    notStartedCount: document.getElementById("notStartedCount")
  };
  
  if (total === 0) {
    if (elements.statusCompleted) elements.statusCompleted.style.width = "0%";
    if (elements.statusInProgress) elements.statusInProgress.style.width = "0%";
    if (elements.statusNotStarted) elements.statusNotStarted.style.width = "100%";
  } else {
    const completedPercent = (assessmentStats.completed / total) * 100;
    const inProgressPercent = (assessmentStats.inProgress / total) * 100;
    const notStartedPercent = (assessmentStats.notStarted / total) * 100;
    
    if (elements.statusCompleted) elements.statusCompleted.style.width = `${completedPercent}%`;
    if (elements.statusInProgress) elements.statusInProgress.style.width = `${inProgressPercent}%`;
    if (elements.statusNotStarted) elements.statusNotStarted.style.width = `${notStartedPercent}%`;
  }
  
  if (elements.completedCount) elements.completedCount.textContent = assessmentStats.completed;
  if (elements.inProgressCount) elements.inProgressCount.textContent = assessmentStats.inProgress;
  if (elements.notStartedCount) elements.notStartedCount.textContent = assessmentStats.notStarted;
}

function updateDashboardSchoolYearSelect() {
  const dashboardSchoolYearSelect = document.getElementById("dashboardSchoolYearSelect");
  if (!dashboardSchoolYearSelect) return;
  
  const currentValue = dashboardSchoolYearSelect.value;
  dashboardSchoolYearSelect.innerHTML = '<option value="">Alle Schuljahre</option>';
  
  const schoolYears = new Set();
  teacherData.groups.forEach(group => {
    if (group.schoolYear) schoolYears.add(group.schoolYear);
  });
  schoolYears.add(getCurrentSchoolYear());
  
  Array.from(schoolYears).sort().reverse().forEach(year => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    if (year === getCurrentSchoolYear() && !currentValue) {
      option.selected = true;
    }
    dashboardSchoolYearSelect.appendChild(option);
  });
  
  if (currentValue) {
    dashboardSchoolYearSelect.value = currentValue;
  }
}

function updateDashboardContent() {
  const dashboardStudentCards = document.getElementById("dashboardStudentCards");
  if (!dashboardStudentCards) return;
  
  const dashboardSchoolYearSelect = document.getElementById("dashboardSchoolYearSelect");
  const selectedYear = dashboardSchoolYearSelect ? dashboardSchoolYearSelect.value : "";
  
  let groups = getResponsibleGroups();
  if (selectedYear) {
    groups = groups.filter(group => group.schoolYear === selectedYear);
  }
  
  const sortedGroups = getSortedGroups(groups);
  
  dashboardStudentCards.innerHTML = "";
  
  if (sortedGroups.length === 0) {
    dashboardStudentCards.innerHTML = `
      <div class="welcome-card" style="grid-column: 1 / -1;">
        <h3>Keine Gruppen gefunden</h3>
        <p>Für das gewählte Schuljahr sind keine Gruppen vorhanden.</p>
      </div>
    `;
    return;
  }
  
  sortedGroups.forEach(group => {
    const card = createGroupCard(group);
    dashboardStudentCards.appendChild(card);
  });
}

function createGroupCard(group) {
  const card = document.createElement("div");
  card.className = "group-card";
  
  const studentsWithStatus = group.students.map(student => {
    const assessment = teacherData.assessments[student.id] || {};
    const status = assessment.status || ASSESSMENT_STATUS.NOT_STARTED;
    return { ...student, status };
  });
  
  const completedStudents = studentsWithStatus.filter(s => s.status === ASSESSMENT_STATUS.COMPLETED).length;
  const totalStudents = group.students.length;
  
  card.innerHTML = `
    <div class="group-card-header">
      <h3 class="group-card-title">${group.theme}</h3>
      <div class="group-progress">
        <span class="progress-text">${completedStudents}/${totalStudents}</span>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${totalStudents > 0 ? (completedStudents/totalStudents)*100 : 0}%"></div>
        </div>
      </div>
    </div>
    <div class="group-card-info">
      <p><strong>Schuljahr:</strong> ${group.schoolYear}</p>
      <p><strong>Schüler:</strong> ${group.students.map(s => s.name).join(', ')}</p>
      ${group.examDate ? `<p><strong>Prüfungsdatum:</strong> ${formatDate(group.examDate)}</p>` : ''}
    </div>
    <div class="group-card-footer">
      <button class="edit-btn" data-group-id="${group.id}" title="Bearbeiten">✏️</button>
    </div>
  `;
  
  const editBtn = card.querySelector(".edit-btn");
  if (editBtn) {
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showEditGroupModal(group);
    });
  }
  
  return card;
}

function showQuickOverview(cardType) {
  const quickOverviewModal = document.getElementById("quickOverviewModal");
  const quickOverviewContent = document.getElementById("quickOverviewContent");
  
  if (!quickOverviewModal || !quickOverviewContent) return;
  
  let students = [];
  let title = "";
  
  switch (cardType) {
    case "accessible":
      students = getAccessibleStudents();
      title = "Alle zugänglichen Schüler";
      break;
    case "assigned":
      students = getAssignedStudents();
      title = "Mir zugewiesene Schüler";
      break;
    case "groups":
      const groups = getResponsibleGroups();
      quickOverviewContent.innerHTML = `
        <div class="quick-overview-header">
          <h3>Meine Gruppen</h3>
        </div>
        <div class="groups-overview-list">
          ${groups.map(group => `
            <div class="group-overview-item">
              <h4>${group.theme}</h4>
              <p><strong>Schüler:</strong> ${group.students.length}/4</p>
              <p><strong>Schuljahr:</strong> ${group.schoolYear}</p>
              ${group.examDate ? `<p><strong>Datum:</strong> ${formatDate(group.examDate)}</p>` : ''}
            </div>
          `).join('')}
        </div>
      `;
      quickOverviewModal.style.display = "flex";
      return;
    case "thisyear":
      students = getAccessibleStudents().filter(s => s.schoolYear === getCurrentSchoolYear());
      title = "Schüler dieses Schuljahr";
      break;
    case "completed":
      students = getAssignedStudents().filter(s => {
        const assessment = teacherData.assessments[s.id];
        return assessment && assessment.status === ASSESSMENT_STATUS.COMPLETED;
      });
      title = "Abgeschlossene Bewertungen";
      break;
  }
  
  quickOverviewContent.innerHTML = `
    <div class="quick-overview-header">
      <h3>${title}</h3>
      <div class="sort-options">
        <label>Sortieren nach:</label>
        <select id="quickOverviewSort">
          <option value="theme">Thema</option>
          <option value="alphabetical">Alphabetisch</option>
          <option value="date">Datum</option>
          <option value="status">Status</option>
        </select>
      </div>
    </div>
    <div class="quick-overview-list" id="quickOverviewList"></div>
  `;
  
  const sortSelect = quickOverviewContent.querySelector("#quickOverviewSort");
  const updateList = () => {
    const sortBy = sortSelect.value;
    const sortedStudents = sortStudentsBy(students, sortBy);
    renderQuickOverviewList(sortedStudents);
  };
  
  sortSelect.addEventListener("change", updateList);
  updateList();
  
  quickOverviewModal.style.display = "flex";
}

function sortStudentsBy(students, sortBy) {
  const sorted = [...students];
  
  switch (sortBy) {
    case "theme":
      sorted.sort((a, b) => a.theme.localeCompare(b.theme));
      break;
    case "alphabetical":
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "date":
      sorted.sort((a, b) => {
        if (!a.examDate && !b.examDate) return 0;
        if (!a.examDate) return 1;
        if (!b.examDate) return -1;
        return new Date(b.examDate) - new Date(a.examDate);
      });
      break;
    case "status":
      sorted.sort((a, b) => {
        const statusA = teacherData.assessments[a.id]?.status || ASSESSMENT_STATUS.NOT_STARTED;
        const statusB = teacherData.assessments[b.id]?.status || ASSESSMENT_STATUS.NOT_STARTED;
        const statusOrder = {
          [ASSESSMENT_STATUS.NOT_STARTED]: 0,
          [ASSESSMENT_STATUS.IN_PROGRESS]: 1,
          [ASSESSMENT_STATUS.COMPLETED]: 2
        };
        return statusOrder[statusA] - statusOrder[statusB];
      });
      break;
  }
  
  return sorted;
}

function renderQuickOverviewList(students) {
  const quickOverviewList = document.getElementById("quickOverviewList");
  if (!quickOverviewList) return;
  
  if (students.length === 0) {
    quickOverviewList.innerHTML = '<p class="no-data">Keine Schüler gefunden</p>';
    return;
  }
  
  quickOverviewList.innerHTML = students.map(student => {
    const assessment = teacherData.assessments[student.id] || {};
    const status = assessment.status || ASSESSMENT_STATUS.NOT_STARTED;
    const assignedTeacher = allTeachers.find(t => t.code === student.assignedTeacher);
    
    return `
      <div class="quick-overview-item ${status}">
        <div class="student-info">
          <h4>${student.name}</h4>
          <p><strong>Thema:</strong> ${student.theme}</p>
          <p><strong>Zugewiesen an:</strong> ${assignedTeacher ? assignedTeacher.name : student.assignedTeacher}</p>
          ${student.examDate ? `<p><strong>Datum:</strong> ${formatDate(student.examDate)}</p>` : ''}
        </div>
        <div class="student-status">
          <div class="status-indicator ${status}">
            <div class="status-dot ${status}"></div>
            ${getStatusText(status)}
          </div>
          ${assessment.finalGrade ? `<div class="final-grade">${assessment.finalGrade}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');
}

function getStatusText(status) {
  switch (status) {
    case ASSESSMENT_STATUS.NOT_STARTED: return "Nicht begonnen";
    case ASSESSMENT_STATUS.IN_PROGRESS: return "In Bearbeitung";
    case ASSESSMENT_STATUS.COMPLETED: return "Abgeschlossen";
    default: return "Unbekannt";
  }
}

function toggleDashboardView() {
  const dashboardStudentCards = document.getElementById("dashboardStudentCards");
  const dashboardViewToggle = document.getElementById("dashboardViewToggle");
  
  if (dashboardStudentCards.classList.contains("reorder-mode")) {
    // Speichern der neuen Themen-Reihenfolge
    const cards = dashboardStudentCards.querySelectorAll(".group-card");
    const themeOrder = {};
    
    cards.forEach((card, index) => {
      const themeElement = card.querySelector(".group-card-title");
      if (themeElement) {
        const theme = themeElement.textContent;
        themeOrder[theme] = index;
      }
    });
    
    setThemeSortOrder(themeOrder);
    dashboardStudentCards.classList.remove("reorder-mode");
    dashboardViewToggle.textContent = "🔧 Reihenfolge anpassen";
    updateDashboardContent();
  } else {
    // Aktiviere Drag & Drop für Reihenfolge
    dashboardStudentCards.classList.add("reorder-mode");
    dashboardViewToggle.textContent = "✅ Reihenfolge speichern";
    
    // Mache Cards sortierbar
    const cards = dashboardStudentCards.querySelectorAll(".group-card");
    cards.forEach(card => {
      card.setAttribute("draggable", "true");
      card.addEventListener("dragstart", handleDragStart);
      card.addEventListener("dragover", handleDragOver);
      card.addEventListener("drop", handleDrop);
      card.addEventListener("dragend", handleDragEnd);
    });
  }
}

// Drag & Drop Funktionalität für Dashboard-Karten
let draggedCard = null;

function handleDragStart(e) {
  draggedCard = this;
  this.style.opacity = "0.4";
  e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = "move";
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }
  
  if (draggedCard !== this) {
    const dashboardStudentCards = document.getElementById("dashboardStudentCards");
    const cards = Array.from(dashboardStudentCards.querySelectorAll(".group-card"));
    const draggedIndex = cards.indexOf(draggedCard);
    const targetIndex = cards.indexOf(this);
    
    if (draggedIndex < targetIndex) {
      dashboardStudentCards.insertBefore(draggedCard, this.nextSibling);
    } else {
      dashboardStudentCards.insertBefore(draggedCard, this);
    }
  }
  
  return false;
}

function handleDragEnd() {
  this.style.opacity = "1";
  
  const dashboardStudentCards = document.getElementById("dashboardStudentCards");
  const cards = dashboardStudentCards.querySelectorAll(".group-card");
  cards.forEach(card => {
    card.classList.remove("over");
  });
}

// === GRUPPEN-VERWALTUNG ===

function updateGroupsTab() {
  const groupsTable = document.getElementById("groupsTable");
  if (!groupsTable) return;
  
  const tbody = groupsTable.querySelector("tbody");
  tbody.innerHTML = "";
  
  let groupsToShow = [];
  const groupViewFilter = document.getElementById("groupViewFilter");
  const filter = groupViewFilter ? groupViewFilter.value : "responsible";
  
  switch (filter) {
    case "responsible":
      groupsToShow = getResponsibleGroups();
      break;
    case "accessible":
      groupsToShow = teacherData.groups.filter(group => 
        group.responsibleTeacher === currentUser.code || 
        group.createdBy === currentUser.code ||
        group.students.some(s => s.assignedTeacher === currentUser.code)
      );
      break;
  }
  
  if (groupsToShow.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="8">Keine Gruppen vorhanden</td>';
    tbody.appendChild(tr);
    return;
  }
  
  const sortedGroups = getSortedGroups(groupsToShow);
  
  sortedGroups.forEach((group) => {
    const tr = document.createElement("tr");
    const responsibleTeacher = allTeachers.find(t => t.code === group.responsibleTeacher);
    const createdByTeacher = allTeachers.find(t => t.code === group.createdBy);
    
    const studentsWithStatus = group.students.map(student => {
      const assessment = teacherData.assessments[student.id] || {};
      return assessment.status || ASSESSMENT_STATUS.NOT_STARTED;
    });
    
    const completedCount = studentsWithStatus.filter(s => s === ASSESSMENT_STATUS.COMPLETED).length;
    const inProgressCount = studentsWithStatus.filter(s => s === ASSESSMENT_STATUS.IN_PROGRESS).length;
    const totalCount = group.students.length;
    
    let groupStatus = "not-started";
    if (completedCount === totalCount && totalCount > 0) {
      groupStatus = "completed";
    } else if (completedCount > 0 || inProgressCount > 0) {
      groupStatus = "in-progress";
    }
    
    tr.innerHTML = `
      <td class="status-cell">
        <div class="status-indicator ${groupStatus}">
          <div class="status-dot ${groupStatus}"></div>
          ${getGroupStatusText(groupStatus)}
        </div>
      </td>
      <td><strong>${group.theme}</strong></td>
      <td>${group.examDate ? formatDate(group.examDate) : "-"}</td>
      <td>
        <div class="students-in-group">
          ${group.students.map(s => `
            <span class="student-chip" title="Zugewiesen an: ${allTeachers.find(t => t.code === s.assignedTeacher)?.name || s.assignedTeacher}">
              ${s.name}
            </span>
          `).join('')}
        </div>
      </td>
      <td class="assigned-teacher-col">${responsibleTeacher ? responsibleTeacher.name : group.responsibleTeacher}</td>
      <td class="created-by-col">${createdByTeacher ? createdByTeacher.name : group.createdBy}</td>
      <td>${group.schoolYear || "-"}</td>
      <td>
        ${canEditGroup(group) ? `
          <button class="edit-btn" data-id="${group.id}" title="Bearbeiten">✏️</button>
        ` : `
          <span style="color: #999;" title="Keine Berechtigung">🔒</span>
        `}
      </td>
    `;
    
    const editBtn = tr.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        showEditGroupModal(group);
      });
    }
    
    tbody.appendChild(tr);
  });
}

function getGroupStatusText(status) {
  switch (status) {
    case "completed": return "Abgeschlossen";
    case "in-progress": return "In Bearbeitung";
    case "not-started": return "Nicht begonnen";
    default: return "Unbekannt";
  }
}

async function addNewGroup() {
  const newGroupTheme = document.getElementById("newGroupTheme");
  const newGroupDate = document.getElementById("newGroupDate");
  
  const theme = newGroupTheme ? newGroupTheme.value.trim() : "";
  const date = newGroupDate ? newGroupDate.value : "";
  
  if (!theme) {
    showNotification("Bitte ein Thema eingeben.", "warning");
    return;
  }
  
  showLoader();
  
  try {
    const newGroup = createGroup(theme, currentUser.code);
    if (date) {
      newGroup.examDate = date;
    }
    
    const saved = await saveTeacherData();
    
    if (saved) {
      if (newGroupTheme) newGroupTheme.value = "";
      if (newGroupDate) newGroupDate.value = defaultDate;
      
      updateGroupsTab();
      updateDashboard();
      showNotification(`Gruppe "${theme}" wurde erstellt.`);
    }
  } catch (error) {
    console.error("Fehler beim Erstellen der Gruppe:", error);
    showNotification("Fehler beim Erstellen der Gruppe.", "error");
  } finally {
    hideLoader();
  }
}

function showEditGroupModal(group) {
  const editGroupModal = document.getElementById("editGroupModal");
  const editGroupTheme = document.getElementById("editGroupTheme");
  const editGroupDate = document.getElementById("editGroupDate");
  const editGroupResponsibleTeacher = document.getElementById("editGroupResponsibleTeacher");
  const editGroupStudentsContainer = document.getElementById("editGroupStudentsContainer");
  
  if (!editGroupModal) return;
  
  selectedGroup = group;
  
  if (editGroupTheme) editGroupTheme.value = group.theme;
  if (editGroupDate) editGroupDate.value = group.examDate || "";
  if (editGroupResponsibleTeacher) {
    // Lehrer-Optionen erstellen
    editGroupResponsibleTeacher.innerHTML = "";
    allTeachers.forEach(teacher => {
      const option = document.createElement("option");
      option.value = teacher.code;
      option.textContent = teacher.name;
      if (teacher.code === group.responsibleTeacher) {
        option.selected = true;
      }
      editGroupResponsibleTeacher.appendChild(option);
    });
  }
  
  if (editGroupStudentsContainer) {
    editGroupStudentsContainer.innerHTML = "";
    
    group.students.forEach((student, index) => {
      const studentRow = document.createElement("div");
      studentRow.className = "student-row";
      
      studentRow.innerHTML = `
        <div class="student-row-info">
          <input type="text" class="student-name-input" value="${student.name}" data-student-id="${student.id}">
          <select class="student-teacher-select" data-student-id="${student.id}">
            ${allTeachers.map(teacher => 
              `<option value="${teacher.code}" ${teacher.code === student.assignedTeacher ? 'selected' : ''}>
                ${teacher.name}
              </option>`
            ).join('')}
          </select>
          <input type="date" class="student-assessment-date" value="${student.assessmentDate || ''}" data-student-id="${student.id}">
        </div>
        <div class="student-row-actions">
          <button type="button" class="btn-danger remove-student-btn" data-student-id="${student.id}">✕</button>
        </div>
      `;
      
      editGroupStudentsContainer.appendChild(studentRow);
    });
    
    if (group.students.length < 4) {
      const addStudentRow = document.createElement("div");
      addStudentRow.className = "add-student-row";
      addStudentRow.innerHTML = `
        <input type="text" id="newStudentInGroupName" placeholder="Neuer Schüler" maxlength="50">
        <select id="newStudentInGroupTeacher">
          ${allTeachers.map(teacher => 
            `<option value="${teacher.code}" ${teacher.code === currentUser.code ? 'selected' : ''}>
              ${teacher.name}
            </option>`
          ).join('')}
        </select>
        <button type="button" id="addStudentToGroupBtn" class="btn-secondary">+ Hinzufügen</button>
      `;
      editGroupStudentsContainer.appendChild(addStudentRow);
      
      const addStudentBtn = addStudentRow.querySelector("#addStudentToGroupBtn");
      if (addStudentBtn) {
        addStudentBtn.addEventListener("click", () => {
          const nameInput = addStudentRow.querySelector("#newStudentInGroupName");
          const teacherSelect = addStudentRow.querySelector("#newStudentInGroupTeacher");
          
          if (nameInput && teacherSelect && nameInput.value.trim()) {
            addStudentToCurrentGroup(nameInput.value.trim(), teacherSelect.value);
          }
        });
      }
    }
    
    editGroupStudentsContainer.querySelectorAll(".remove-student-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const studentId = e.target.dataset.studentId;
        if (confirm("Schüler aus Gruppe entfernen?")) {
          removeStudentFromGroup(studentId);
        }
      });
    });
  }
  
  editGroupModal.style.display = "flex";
}

async function addStudentToCurrentGroup(studentName, assignedTeacher) {
  if (!selectedGroup) return;
  
  try {
    const newStudent = addStudentToGroup(selectedGroup.id, studentName, assignedTeacher);
    const saved = await saveTeacherData();
    
    if (saved) {
      showNotification(`Schüler "${studentName}" zur Gruppe hinzugefügt.`);
      showEditGroupModal(selectedGroup);
      updateGroupsTab();
      updateDashboard();
    }
  } catch (error) {
    showNotification(error.message, "error");
  }
}

async function removeStudentFromGroup(studentId) {
  if (!selectedGroup) return;
  
  try {
    selectedGroup.students = selectedGroup.students.filter(s => s.id !== studentId);
    delete teacherData.assessments[studentId];
    
    const saved = await saveTeacherData();
    
    if (saved) {
      showNotification("Schüler aus Gruppe entfernt.");
      showEditGroupModal(selectedGroup);
      updateGroupsTab();
      updateDashboard();
    }
  } catch (error) {
    showNotification("Fehler beim Entfernen des Schülers.", "error");
  }
}

async function saveEditedGroup() {
  if (!selectedGroup) return;
  
  const editGroupTheme = document.getElementById("editGroupTheme");
  const editGroupDate = document.getElementById("editGroupDate");
  const editGroupResponsibleTeacher = document.getElementById("editGroupResponsibleTeacher");
  
  const theme = editGroupTheme ? editGroupTheme.value.trim() : selectedGroup.theme;
  const date = editGroupDate ? editGroupDate.value : selectedGroup.examDate;
  const responsibleTeacher = editGroupResponsibleTeacher ? editGroupResponsibleTeacher.value : selectedGroup.responsibleTeacher;
  
  if (!theme) {
    showNotification("Bitte ein Thema eingeben.", "warning");
    return;
  }
  
  showLoader();
  
  selectedGroup.theme = theme;
  selectedGroup.examDate = date || null;
  selectedGroup.responsibleTeacher = responsibleTeacher;
  
  const studentRows = document.querySelectorAll(".student-row");
  studentRows.forEach(row => {
    const nameInput = row.querySelector(".student-name-input");
    const teacherSelect = row.querySelector(".student-teacher-select");
    const dateInput = row.querySelector(".student-assessment-date");
    
    if (nameInput && teacherSelect) {
      const studentId = nameInput.dataset.studentId;
      const student = selectedGroup.students.find(s => s.id === studentId);
      
      if (student) {
        student.name = nameInput.value.trim();
        student.assignedTeacher = teacherSelect.value;
        student.assessmentDate = dateInput ? dateInput.value : null;
      }
    }
  });
  
  const saved = await saveTeacherData();
  hideLoader();
  
  if (saved) {
    updateGroupsTab();
    updateDashboard();
    showNotification(`Gruppe "${theme}" wurde aktualisiert.`);
    const editGroupModal = document.getElementById("editGroupModal");
    if (editGroupModal) editGroupModal.style.display = "none";
  }
}

function showDeleteGroupConfirmation() {
  groupToDelete = selectedGroup;
  const deleteGroupName = document.getElementById("deleteGroupName");
  if (deleteGroupName) deleteGroupName.textContent = groupToDelete.theme;
  
  const editGroupModal = document.getElementById("editGroupModal");
  const confirmDeleteGroupModal = document.getElementById("confirmDeleteGroupModal");
  
  if (editGroupModal) editGroupModal.style.display = "none";
  if (confirmDeleteGroupModal) confirmDeleteGroupModal.style.display = "flex";
}

async function deleteGroup() {
  if (!groupToDelete) return;
  
  showLoader();
  
  groupToDelete.students.forEach(student => {
    delete teacherData.assessments[student.id];
  });
  
  teacherData.groups = teacherData.groups.filter(g => g.id !== groupToDelete.id);
  
  const saved = await saveTeacherData();
  hideLoader();
  
  if (saved) {
    updateGroupsTab();
    updateDashboard();
    showNotification(`Gruppe "${groupToDelete.theme}" wurde gelöscht.`);
    
    const confirmDeleteGroupModal = document.getElementById("confirmDeleteGroupModal");
    if (confirmDeleteGroupModal) confirmDeleteGroupModal.style.display = "none";
    
    groupToDelete = null;
  }
}

// === BEWERTUNGS-TAB ===

function updateAssessmentTab() {
  populateAssessmentThemeSelect();
  populateAssessmentDateSelect();
  updateAssessmentStudentList();
}

function populateAssessmentThemeSelect() {
  const assessmentThemeSelect = document.getElementById("assessmentThemeSelect");
  if (!assessmentThemeSelect) return;
  
  const themes = new Set();
  const assignedStudents = getAssignedStudents();
  
  assignedStudents.forEach(student => {
    if (student.theme) themes.add(student.theme);
  });
  
  assessmentThemeSelect.innerHTML = '<option value="">Alle Themen</option>';
  
  let defaultTheme = null;
  if (lastSelectedTheme && themes.has(lastSelectedTheme)) {
    defaultTheme = lastSelectedTheme;
  }
  
  Array.from(themes).sort().forEach(theme => {
    const option = document.createElement("option");
    option.value = theme;
    option.textContent = theme;
    if (theme === defaultTheme) {
      option.selected = true;
    }
    assessmentThemeSelect.appendChild(option);
  });
  
  if (assessmentThemeSelect.value) {
    lastSelectedTheme = assessmentThemeSelect.value;
  }
}

function populateAssessmentDateSelect() {
  const assessmentDateSelect = document.getElementById("assessmentDateSelect");
  if (!assessmentDateSelect) return;
  
  const selectedTheme = document.getElementById("assessmentThemeSelect")?.value;
  const dates = new Set();
  let filteredStudents = getAssignedStudents();
  
  if (selectedTheme) {
    filteredStudents = filteredStudents.filter(s => s.theme === selectedTheme);
  }
  
  filteredStudents.forEach(student => {
    if (student.assessmentDate) dates.add(student.assessmentDate);
    if (student.examDate) dates.add(student.examDate);
  });
  
  assessmentDateSelect.innerHTML = '<option value="">Alle Termine</option>';
  
  if (dates.size === 0) return;
  
  let defaultDate = null;
  if (lastSelectedDate && dates.has(lastSelectedDate)) {
    defaultDate = lastSelectedDate;
  }
  
  Array.from(dates).sort().reverse().forEach(date => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = formatDate(date);
    if (date === defaultDate) {
      option.selected = true;
    }
    assessmentDateSelect.appendChild(option);
  });
  
  if (assessmentDateSelect.value) {
    lastSelectedDate = assessmentDateSelect.value;
  }
}

function updateAssessmentStudentList() {
  const assessmentStudentList = document.getElementById("assessmentStudentList");
  const assessmentContent = document.getElementById("assessmentContent");
  
  if (!assessmentStudentList || !assessmentContent) return;
  
  const selectedTheme = document.getElementById("assessmentThemeSelect")?.value;
  const selectedDate = document.getElementById("assessmentDateSelect")?.value;
  const selectedStatus = document.getElementById("assessmentStatusFilter")?.value;
  
  assessmentStudentList.innerHTML = "";
  
  if (!selectedTheme && !selectedDate && !selectedStatus) {
    assessmentStudentList.innerHTML = "<li>Bitte Filter auswählen</li>";
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Willkommen bei der Bewertungsapp</h2>
        <p>Bitte wählen Sie Filter aus und anschließend einen Schüler aus der Liste.</p>
      </div>
    `;
    currentSelectedStudentId = null;
    return;
  }
  
  let filtered = getAssignedStudents();
  
  if (selectedTheme) {
    filtered = filtered.filter(s => s.theme === selectedTheme);
  }
  if (selectedDate) {
    filtered = filtered.filter(s => s.assessmentDate === selectedDate || s.examDate === selectedDate);
  }
  if (selectedStatus) {
    filtered = filtered.filter(s => {
      const assessment = teacherData.assessments[s.id];
      const status = assessment ? assessment.status : ASSESSMENT_STATUS.NOT_STARTED;
      return status === selectedStatus;
    });
  }
  
  if (filtered.length === 0) {
    assessmentStudentList.innerHTML = "<li>Keine Schüler gefunden</li>";
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Keine Schüler</h2>
        <p>Für diese Auswahl gibt es keine Ihnen zugewiesenen Schüler.</p>
      </div>
    `;
    currentSelectedStudentId = null;
    return;
  }
  
  filtered.sort((a, b) => {
    const dateComp = new Date(b.examDate || b.assessmentDate) - new Date(a.examDate || a.assessmentDate);
    if (dateComp !== 0) return dateComp;
    return a.name.localeCompare(b.name);
  });
  
  filtered.forEach((student) => {
    const li = document.createElement("li");
    li.className = "student-item";
    li.dataset.id = student.id;
    const assessment = teacherData.assessments[student.id] || {};
    const finalGrade = assessment.finalGrade || "-";
    const status = assessment.status || ASSESSMENT_STATUS.NOT_STARTED;
    
    li.classList.add(status);
    
    li.innerHTML = `
      <div class="student-name">
        ${student.name} (${student.theme})
        <div class="student-meta">${getStatusText(status)}</div>
      </div>
      <div class="average-grade grade-${Math.round(finalGrade)}">${finalGrade}</div>
    `;
    
    li.addEventListener("click", () => {
      document.querySelectorAll(".student-item").forEach((item) => {
        item.classList.remove("active");
      });
      li.classList.add("active");
      currentSelectedStudentId = student.id;
      showAssessmentForm(student);
    });
    
    assessmentStudentList.appendChild(li);
  });
  
  let studentToSelect = null;
  
  if (currentSelectedStudentId) {
    studentToSelect = document.querySelector(`.student-item[data-id="${currentSelectedStudentId}"]`);
  }
  
  if (!studentToSelect && filtered.length > 0) {
    studentToSelect = document.querySelector(".student-item");
  }
  
  if (studentToSelect) {
    studentToSelect.click();
  }
}

function showAssessmentForm(student) {
  selectedStudent = student;
  const assessment = teacherData.assessments[student.id] || {};
  const template = getAssessmentTemplate(student.templateId);
  
  if (!template) {
    const assessmentContent = document.getElementById("assessmentContent");
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Fehler</h2>
        <p>Bewertungsraster für diesen Schüler nicht gefunden.</p>
      </div>
    `;
    return;
  }
  
  const avgGrade = calculateWeightedAverageGrade(assessment, template);
  const finalGrade = assessment.finalGrade || avgGrade || "-";
  
  let html = `
    <div class="assessment-container">
      <div class="student-header">
        <h2>${student.name}</h2>
        <p>Thema: ${student.theme}</p>
        ${student.examDate ? `<p>Prüfungsdatum: ${formatDate(student.examDate)}</p>` : ""}
        ${student.assessmentDate ? `<p>Bewertungsdatum: ${formatDate(student.assessmentDate)}</p>` : ""}
        <p>Bewertungsraster: <strong>${template.name}</strong></p>
      </div>
      
      <div class="final-grade-display">Ø ${avgGrade || "0.0"}</div>
      
      <div class="final-grade-input">
        <label for="finalGrade">Endnote:</label>
        <input type="number" id="finalGrade" min="1" max="6" step="0.5" value="${finalGrade !== "-" ? finalGrade : ""}">
        <button id="saveFinalGradeBtn">Speichern</button>
        <button id="useAverageBtn">Durchschnitt übernehmen</button>
      </div>
  `;
  
  template.categories.forEach((category) => {
    const grade = assessment[category.id] || 0;
    html += `
      <div class="assessment-category">
        <div class="category-header">
          <h3>${category.name}${category.weight > 1 ? ` (Gewichtung: ${category.weight})` : ''}</h3>
        </div>
        <div class="category-grade">${grade > 0 ? grade.toFixed(1) : "-"}</div>
        <div class="grade-buttons" data-category="${category.id}">
    `;
    
    for (let i = 1; i <= 6; i++) {
      for (let decimal of [0, 0.5]) {
        const currentGrade = i + decimal;
        if (currentGrade <= 6) {
          const isSelected = (grade === currentGrade);
          html += `
            <button class="grade-button grade-${Math.floor(currentGrade)}${isSelected ? ' selected' : ''}" 
                    data-grade="${currentGrade}">
              ${currentGrade.toFixed(1)}
            </button>
          `;
        }
      }
    }
    
    const isZeroSelected = (grade === 0);
    html += `
          <button class="grade-button grade-0${isZeroSelected ? ' selected' : ''}" data-grade="0">-</button>
        </div>
      </div>
    `;
  });
  
  const infoText = assessment.infoText || "";
  html += `
      <div class="info-text-container">
        <h3>Informationen zum Schüler</h3>
        <textarea id="studentInfoText" rows="4" placeholder="Notizen zum Schüler...">${infoText}</textarea>
      </div>
    </div>
  `;
  
  const assessmentContent = document.getElementById("assessmentContent");
  assessmentContent.innerHTML = html;
  
  if (stickyAverageElement) {
    stickyAverageElement.textContent = `Ø ${avgGrade || "0.0"}`;
  }
  
  document.querySelectorAll(".grade-buttons .grade-button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const categoryId = btn.parentElement.dataset.category;
      const gradeValue = parseFloat(btn.dataset.grade);
      const buttons = btn.parentElement.querySelectorAll("button");
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      
      const gradeDisplay = btn.parentElement.previousElementSibling;
      gradeDisplay.textContent = gradeValue > 0 ? gradeValue.toFixed(1) : "-";
      
      if (!teacherData.assessments[student.id]) {
        teacherData.assessments[student.id] = { 
          templateId: student.templateId,
          status: ASSESSMENT_STATUS.NOT_STARTED,
          lastModified: new Date().toISOString()
        };
      }
      teacherData.assessments[student.id][categoryId] = gradeValue;
      
      const newAvg = calculateWeightedAverageGrade(teacherData.assessments[student.id], template);
      const avgDisplay = document.querySelector(".final-grade-display");
      avgDisplay.textContent = `Ø ${newAvg || "0.0"}`;
      
      if (stickyAverageElement) {
        stickyAverageElement.textContent = `Ø ${newAvg || "0.0"}`;
      }
      
      if (!teacherData.assessments[student.id].finalGrade) {
        teacherData.assessments[student.id].finalGrade = parseFloat(newAvg);
        const fgInput = document.getElementById("finalGrade");
        if (fgInput) fgInput.value = newAvg;
      }
      
      const newStatus = updateAssessmentStatus(student.id);
      
      const listItem = document.querySelector(`.student-item[data-id="${student.id}"]`);
      if (listItem) {
        listItem.classList.remove(ASSESSMENT_STATUS.NOT_STARTED, ASSESSMENT_STATUS.IN_PROGRESS, ASSESSMENT_STATUS.COMPLETED);
        listItem.classList.add(newStatus);
        
        const metaElement = listItem.querySelector(".student-meta");
        if (metaElement) {
          metaElement.textContent = getStatusText(newStatus);
        }
      }
      
      try {
        await saveTeacherData();
        updateStudentGradeInList(student.id, teacherData.assessments[student.id].finalGrade);
        updateDashboard();
      } catch (error) {
        console.error("Fehler beim Speichern:", error);
        showNotification("Fehler beim Speichern.", "error");
      }
    });
  });
  
  const saveFinalGradeBtn = document.getElementById("saveFinalGradeBtn");
  if (saveFinalGradeBtn) {
    saveFinalGradeBtn.addEventListener("click", async () => {
      const inputVal = parseFloat(document.getElementById("finalGrade").value);
      if (isNaN(inputVal) || inputVal < 1 || inputVal > 6) {
        showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
        return;
      }
      teacherData.assessments[student.id].finalGrade = inputVal;
      
      updateAssessmentStatus(student.id);
      
      try {
        await saveTeacherData();
        updateStudentGradeInList(student.id, inputVal);
        updateDashboard();
        showNotification("Endnote gespeichert.");
      } catch (error) {
        console.error(error);
        showNotification("Fehler beim Speichern.", "error");
      }
    });
  }
  
  const useAverageBtn = document.getElementById("useAverageBtn");
  if (useAverageBtn) {
    useAverageBtn.addEventListener("click", async () => {
      const avgGrade = calculateWeightedAverageGrade(teacherData.assessments[student.id], template);
      if (!avgGrade) {
        showNotification("Es ist kein Durchschnitt vorhanden.", "warning");
        return;
      }
      document.getElementById("finalGrade").value = avgGrade;
      teacherData.assessments[student.id].finalGrade = parseFloat(avgGrade);
      
      updateAssessmentStatus(student.id);
      
      try {
        await saveTeacherData();
        updateStudentGradeInList(student.id, parseFloat(avgGrade));
        updateDashboard();
        showNotification("Durchschnitt als Endnote übernommen.");
      } catch (error) {
        console.error(error);
        showNotification("Fehler beim Speichern.", "error");
      }
    });
  }
  
  const infoTextArea = document.getElementById("studentInfoText");
  if (infoTextArea) {
    infoTextArea.addEventListener("input", () => {
      infoTextArea.dataset.changed = "true";
    });
    setupInfoTextAutoSave(student.id);
  }
}

function updateStudentGradeInList(studentId, finalGrade) {
  const studentItem = document.querySelector(`.student-item[data-id="${studentId}"]`);
  if (studentItem) {
    const gradeElement = studentItem.querySelector(".average-grade");
    if (gradeElement) {
      gradeElement.textContent = finalGrade;
      gradeElement.className = `average-grade grade-${Math.round(finalGrade)}`;
    }
  }
}

function setupInfoTextAutoSave(studentId) {
  if (infoTextSaveTimer) clearInterval(infoTextSaveTimer);
  infoTextSaveTimer = setInterval(async () => {
    const area = document.getElementById("studentInfoText");
    if (area && area.dataset.changed === "true") {
      teacherData.assessments[studentId].infoText = area.value;
      
      updateAssessmentStatus(studentId);
      
      await saveTeacherData();
      area.dataset.changed = "false";
      
      showNotification("Informationstext automatisch gespeichert.");
      area.classList.add("save-flash");
      setTimeout(() => {
        area.classList.remove("save-flash");
      }, 1000);
    }
  }, 60000);
}

// === TEMPLATE-VERWALTUNG ===

function updateTemplatesTab() {
  const templatesGrid = document.getElementById("templatesGrid");
  if (!templatesGrid) return;
  
  templatesGrid.innerHTML = "";
  
  const templates = getAllAssessmentTemplates();
  
  templates.forEach(template => {
    const card = document.createElement("div");
    card.className = `template-card ${template.isDefault ? 'default' : ''}`;
    
    const criteriaHtml = template.categories.map(cat => 
      `<span class="criterion-tag">${cat.name}${cat.weight > 1 ? ` (×${cat.weight})` : ''}</span>`
    ).join('');
    
    const canEdit = !template.isDefault;
    
    card.innerHTML = `
      <div class="template-header">
        <h3 class="template-title">${template.name}</h3>
        <span class="template-badge ${template.isDefault ? 'default' : 'custom'}">
          ${template.isDefault ? 'Standard' : 'Benutzerdefiniert'}
        </span>
      </div>
      <p class="template-description">${template.description}</p>
      <div class="template-criteria">
        <h4>Bewertungskriterien (${template.categories.length})</h4>
        <div class="criteria-list">${criteriaHtml}</div>
      </div>
      <div class="template-actions">
        ${canEdit ? `
          <button class="btn-secondary edit-template-btn" data-id="${template.id}">
            ✏️ Bearbeiten
          </button>
          <button class="btn-danger delete-template-btn" data-id="${template.id}">
            🗑️ Löschen
          </button>
        ` : `
          <button disabled>Standard-Raster</button>
        `}
      </div>
    `;
    
    if (canEdit) {
      card.querySelector(".edit-template-btn").addEventListener("click", () => {
        showEditTemplateModal(template);
      });
      
      card.querySelector(".delete-template-btn").addEventListener("click", () => {
        confirmDeleteTemplate(template);
      });
    }
    
    templatesGrid.appendChild(card);
  });
  
  populateTemplateSelects();
}

function addCriterionRow(container = document.getElementById("templateCriteriaContainer")) {
  if (!container) return;
  
  const row = document.createElement("div");
  row.className = "criterion-row";
  row.innerHTML = `
    <input type="text" placeholder="Kriterium" class="criterion-name">
    <input type="number" min="1" max="5" value="1" class="criterion-weight" title="Gewichtung">
    <button type="button" class="remove-criterion btn-danger">✕</button>
  `;
  
  row.querySelector(".remove-criterion").addEventListener("click", () => {
    row.remove();
  });
  
  container.appendChild(row);
}

function collectCriteria(container) {
  const rows = container.querySelectorAll(".criterion-row");
  const criteria = [];
  
  rows.forEach(row => {
    const name = row.querySelector(".criterion-name").value.trim();
    const weight = parseInt(row.querySelector(".criterion-weight").value) || 1;
    
    if (name) {
      criteria.push({ name, weight });
    }
  });
  
  return criteria;
}

async function saveNewTemplate() {
  const newTemplateName = document.getElementById("newTemplateName");
  const newTemplateDescription = document.getElementById("newTemplateDescription");
  const templateCriteriaContainer = document.getElementById("templateCriteriaContainer");
  
  const name = newTemplateName.value.trim();
  const description = newTemplateDescription.value.trim();
  const criteria = collectCriteria(templateCriteriaContainer);
  
  if (!name) {
    showNotification("Bitte einen Namen eingeben.", "warning");
    return;
  }
  
  if (criteria.length === 0) {
    showNotification("Bitte mindestens ein Kriterium hinzufügen.", "warning");
    return;
  }
  
  showLoader();
  
  try {
    createAssessmentTemplate(name, description, criteria);
    const saved = await saveTeacherData();
    
    if (saved) {
      newTemplateName.value = "";
      newTemplateDescription.value = "";
      
      const rows = templateCriteriaContainer.querySelectorAll(".criterion-row");
      for (let i = 1; i < rows.length; i++) {
        rows[i].remove();
      }
      if (rows[0]) {
        rows[0].querySelector(".criterion-name").value = "";
        rows[0].querySelector(".criterion-weight").value = "1";
      }
      
      updateTemplatesTab();
      showNotification(`Bewertungsraster "${name}" wurde erstellt.`);
    }
  } catch (error) {
    showNotification("Fehler beim Erstellen des Bewertungsrasters.", "error");
  } finally {
    hideLoader();
  }
}

function showEditTemplateModal(template) {
  const editTemplateModal = document.getElementById("editTemplateModal");
  const editTemplateName = document.getElementById("editTemplateName");
  const editTemplateDescription = document.getElementById("editTemplateDescription");
  const editTemplateCriteriaContainer = document.getElementById("editTemplateCriteriaContainer");
  
  if (!editTemplateModal) return;
  
  editingTemplate = template;
  editTemplateName.value = template.name;
  editTemplateDescription.value = template.description;
  
  editTemplateCriteriaContainer.innerHTML = "";
  template.categories.forEach(category => {
    const row = document.createElement("div");
    row.className = "criterion-row";
    row.innerHTML = `
      <input type="text" placeholder="Kriterium" class="criterion-name" value="${category.name}">
      <input type="number" min="1" max="5" value="${category.weight}" class="criterion-weight" title="Gewichtung">
      <button type="button" class="remove-criterion btn-danger">✕</button>
    `;
    
    row.querySelector(".remove-criterion").addEventListener("click", () => {
      row.remove();
    });
    
    editTemplateCriteriaContainer.appendChild(row);
  });
  
  editTemplateModal.style.display = "flex";
}

async function saveEditedTemplate() {
  const editTemplateName = document.getElementById("editTemplateName");
  const editTemplateDescription = document.getElementById("editTemplateDescription");
  const editTemplateCriteriaContainer = document.getElementById("editTemplateCriteriaContainer");
  
  if (!editingTemplate) return;
  
  const name = editTemplateName.value.trim();
  const description = editTemplateDescription.value.trim();
  const criteria = collectCriteria(editTemplateCriteriaContainer);
  
  if (!name) {
    showNotification("Bitte einen Namen eingeben.", "warning");
    return;
  }
  
  if (criteria.length === 0) {
    showNotification("Bitte mindestens ein Kriterium hinzufügen.", "warning");
    return;
  }
  
  showLoader();
  
  try {
    updateAssessmentTemplate(editingTemplate.id, name, description, criteria);
    const saved = await saveTeacherData();
    
    if (saved) {
      updateTemplatesTab();
      showNotification(`Bewertungsraster "${name}" wurde aktualisiert.`);
      const editTemplateModal = document.getElementById("editTemplateModal");
      if (editTemplateModal) editTemplateModal.style.display = "none";
      editingTemplate = null;
    }
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoader();
  }
}

function confirmDeleteTemplate(template = editingTemplate) {
  if (!template) return;
  
  if (!confirm(`Soll das Bewertungsraster "${template.name}" wirklich gelöscht werden?`)) {
    return;
  }
  
  performDeleteTemplate(template);
}

async function performDeleteTemplate(template) {
  showLoader();
  
  try {
    deleteAssessmentTemplate(template.id);
    const saved = await saveTeacherData();
    
    if (saved) {
      updateTemplatesTab();
      showNotification(`Bewertungsraster "${template.name}" wurde gelöscht.`);
      const editTemplateModal = document.getElementById("editTemplateModal");
      if (editTemplateModal && editTemplateModal.style.display === "flex") {
        editTemplateModal.style.display = "none";
      }
      editingTemplate = null;
    }
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoader();
  }
}

// === ÜBERSICHTS-TAB ===

function updateOverviewTab() {
  populateOverviewYearSelect();
  populateOverviewThemeSelect();
  populateOverviewDateSelect();
  updateOverviewContent();
}

function populateOverviewYearSelect() {
  const overviewYearSelect = document.getElementById("overviewYearSelect");
  if (!overviewYearSelect) return;
  
  const years = new Set();
  const accessibleStudents = getAccessibleStudents();
  
  accessibleStudents.forEach(student => {
    if (student.examDate) {
      years.add(student.examDate.split("-")[0]);
    }
    if (student.assessmentDate) {
      years.add(student.assessmentDate.split("-")[0]);
    }
  });
  
  overviewYearSelect.innerHTML = '<option value="">Alle Jahre</option>';
  Array.from(years).sort().reverse().forEach(year => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    overviewYearSelect.appendChild(opt);
  });
}

function populateOverviewThemeSelect() {
  const overviewThemeSelect = document.getElementById("overviewThemeSelect");
  if (!overviewThemeSelect) return;
  
  overviewThemeSelect.innerHTML = '<option value="">Alle Themen</option>';
  let filtered = getAccessibleStudents();
  const year = document.getElementById("overviewYearSelect")?.value;
  
  if (year) {
    filtered = filtered.filter(s => 
      (s.examDate && s.examDate.startsWith(year)) || 
      (s.assessmentDate && s.assessmentDate.startsWith(year))
    );
  }
  
  const themes = new Set();
  filtered.forEach(s => {
    if (s.theme) themes.add(s.theme);
  });
  
  Array.from(themes).sort().forEach(theme => {
    const opt = document.createElement("option");
    opt.value = theme;
    opt.textContent = theme;
    overviewThemeSelect.appendChild(opt);
  });
}

function populateOverviewDateSelect() {
  const overviewDateSelect = document.getElementById("overviewDateSelect");
  if (!overviewDateSelect) return;
  
  const year = document.getElementById("overviewYearSelect")?.value;
  const theme = document.getElementById("overviewThemeSelect")?.value;
  
  overviewDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  let filtered = getAccessibleStudents();
  
  if (year) {
    filtered = filtered.filter(s => 
      (s.examDate && s.examDate.startsWith(year)) || 
      (s.assessmentDate && s.assessmentDate.startsWith(year))
    );
  }
  if (theme) {
    filtered = filtered.filter(s => s.theme === theme);
  }
  
  const dates = new Set();
  filtered.forEach(s => {
    if (s.examDate) dates.add(s.examDate);
    if (s.assessmentDate) dates.add(s.assessmentDate);
  });
  
  Array.from(dates).sort().reverse().forEach(date => {
    const opt = document.createElement("option");
    opt.value = date;
    opt.textContent = formatDate(date);
    overviewDateSelect.appendChild(opt);
  });
}

function updateOverviewContent() {
  const overviewTable = document.getElementById("overviewTable");
  if (!overviewTable) return;
  
  const tbody = overviewTable.querySelector("tbody");
  tbody.innerHTML = "";
  
  let filtered = getAccessibleStudents();
  const year = document.getElementById("overviewYearSelect")?.value;
  const theme = document.getElementById("overviewThemeSelect")?.value;
  const date = document.getElementById("overviewDateSelect")?.value;
  const statusFilter = document.getElementById("overviewStatusSelect")?.value;
  
  if (year) {
    filtered = filtered.filter(s => 
      (s.examDate && s.examDate.startsWith(year)) || 
      (s.assessmentDate && s.assessmentDate.startsWith(year))
    );
  }
  if (theme) {
    filtered = filtered.filter(s => s.theme === theme);
  }
  if (date) {
    filtered = filtered.filter(s => s.examDate === date || s.assessmentDate === date);
  }
  if (statusFilter) {
    filtered = filtered.filter(s => {
      const assessment = teacherData.assessments[s.id];
      const status = assessment ? assessment.status : ASSESSMENT_STATUS.NOT_STARTED;
      return status === statusFilter;
    });
  }
  
  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="9">Keine Schüler gefunden</td>';
    tbody.appendChild(tr);
    return;
  }
  
  filtered.sort((a, b) => new Date(b.examDate || b.assessmentDate) - new Date(a.examDate || a.assessmentDate));
  
  filtered.forEach((student) => {
    const assessment = teacherData.assessments[student.id] || {};
    const template = getAssessmentTemplate(student.templateId);
    const assignedTeacher = allTeachers.find(t => t.code === student.assignedTeacher);
    const status = assessment.status || ASSESSMENT_STATUS.NOT_STARTED;
    
    let ratingsHtml = "";
    if (template && template.categories) {
      const ratings = template.categories.map(cat => 
        assessment[cat.id] || "-"
      ).join(", ");
      ratingsHtml = ratings.length > 50 ? ratings.substring(0, 50) + "..." : ratings;
    }
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="status-cell">
        <div class="status-indicator ${status}">
          <div class="status-dot ${status}"></div>
          ${getStatusText(status)}
        </div>
      </td>
      <td>${student.name}</td>
      <td><strong>${student.theme}</strong></td>
      <td>${formatDate(student.examDate || student.assessmentDate)}</td>
      <td class="assigned-teacher-col">${assignedTeacher ? assignedTeacher.name : student.assignedTeacher}</td>
      <td class="template-name-col">${template ? template.name : "Unbekannt"}</td>
      <td title="${ratingsHtml}" style="max-width: 150px; overflow: hidden; text-overflow: ellipsis;">${ratingsHtml || "-"}</td>
      <td><strong>${assessment.finalGrade !== undefined ? assessment.finalGrade : "-"}</strong></td>
      <td>
        ${canAssessStudent(student) ? `
          <button class="edit-btn" data-id="${student.id}" title="Bearbeiten">✏️</button>
        ` : `
          <span style="color: #999;" title="Nur ansehen">👁️</span>
        `}
      </td>
    `;
    
    const editBtn = tr.querySelector(".edit-btn");
    if (editBtn) {
      editBtn.addEventListener("click", () => {
        openEditGradeModal(student);
      });
    }
    
    tbody.appendChild(tr);
  });
