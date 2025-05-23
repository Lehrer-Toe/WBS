// js/main.js

import { initDatabase, ensureCollection } from "./firebaseClient.js";
import {
  teacherData,
  currentUser,
  loadTeacherData,
  saveTeacherData,
  createAssessmentTemplate,
  updateAssessmentTemplate,
  deleteAssessmentTemplate,
  getAssessmentTemplate,
  getAllAssessmentTemplates,
  getAssignedStudents,
  getAllStudents,
  createStudent
} from "./dataService.js";
import {
  showLoader,
  hideLoader,
  showNotification,
  formatDate,
  getAvailableDates,
  getAvailableTopics,
  getAvailableYears,
  calculateAverageGrade,
  initTeacherGrid
} from "./uiService.js";
import { DEFAULT_ASSESSMENT_CATEGORIES, DEFAULT_TEACHERS, APP_CONFIG } from "./constants.js";
import {
  loadAllTeachers,
  saveAllTeachers,
  loginAdmin,
  logoutAdmin,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  validateTeacher,
  currentAdmin,
  allTeachers,
  deleteAllTeachers,
  deleteAllTeacherData
} from "./adminService.js";

// Globale Zustände
let selectedStudent = null;
let studentToDelete = null;
let selectedGradeStudent = null;
let infoTextSaveTimer = null;
let lastSelectedDate = null;
let lastSelectedTopic = null;
let currentSelectedStudentId = null;
let stickyAverageElement = null;

// Admin-spezifische globale Variablen
let selectedTeacher = null;
let teacherToDelete = null;

// Template-spezifische globale Variablen
let selectedTemplate = null;
let templateToDelete = null;
let editingTemplate = null;

// DOM-Elemente
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

// Admin-Panel Elemente
const newTeacherName = document.getElementById("newTeacherName");
const newTeacherCode = document.getElementById("newTeacherCode");
const newTeacherPassword = document.getElementById("newTeacherPassword");
const addTeacherBtn = document.getElementById("addTeacherBtn");
const teachersAdminTable = document.getElementById("teachersAdminTable");
const totalTeachers = document.getElementById("totalTeachers");
const firebaseStatus = document.getElementById("firebaseStatus");
const lastUpdate = document.getElementById("lastUpdate");
const refreshSystemBtn = document.getElementById("refreshSystemBtn");
const exportTeachersBtn = document.getElementById("exportTeachersBtn");

// Admin-Lösch-Elemente
const deleteAllTeachersBtn = document.getElementById("deleteAllTeachersBtn");
const deleteAllDataBtn = document.getElementById("deleteAllDataBtn");
const adminDeleteVerificationCode = document.getElementById("adminDeleteVerificationCode");

// Edit Teacher Modal
const editTeacherModal = document.getElementById("editTeacherModal");
const closeEditTeacherModal = document.getElementById("closeEditTeacherModal");
const editTeacherName = document.getElementById("editTeacherName");
const editTeacherCode = document.getElementById("editTeacherCode");
const editTeacherPassword = document.getElementById("editTeacherPassword");
const saveTeacherBtn = document.getElementById("saveTeacherBtn");
const deleteTeacherBtn = document.getElementById("deleteTeacherBtn");

// Confirm Delete Teacher Modal
const confirmDeleteTeacherModal = document.getElementById("confirmDeleteTeacherModal");
const closeConfirmDeleteTeacherModal = document.getElementById("closeConfirmDeleteTeacherModal");
const deleteTeacherName = document.getElementById("deleteTeacherName");
const cancelDeleteTeacherBtn = document.getElementById("cancelDeleteTeacherBtn");
const confirmDeleteTeacherBtn = document.getElementById("confirmDeleteTeacherBtn");

// Schüler-Elemente
const newStudentName = document.getElementById("newStudentName");
const newStudentTopic = document.getElementById("newStudentTopic");
const examDate = document.getElementById("examDate");
const assignedTeacherSelect = document.getElementById("assignedTeacherSelect");
const templateSelect = document.getElementById("templateSelect");
const addStudentBtn = document.getElementById("addStudentBtn");
const studentsTable = document.getElementById("studentsTable");
const studentViewFilter = document.getElementById("studentViewFilter");

// Template-Elemente
const newTemplateName = document.getElementById("newTemplateName");
const newTemplateDescription = document.getElementById("newTemplateDescription");
const templateCriteriaContainer = document.getElementById("templateCriteriaContainer");
const addCriterionBtn = document.getElementById("addCriterionBtn");
const saveTemplateBtn = document.getElementById("saveTemplateBtn");
const templatesGrid = document.getElementById("templatesGrid");

// Edit Template Modal
const editTemplateModal = document.getElementById("editTemplateModal");
const closeEditTemplateModal = document.getElementById("closeEditTemplateModal");
const editTemplateName = document.getElementById("editTemplateName");
const editTemplateDescription = document.getElementById("editTemplateDescription");
const editTemplateCriteriaContainer = document.getElementById("editTemplateCriteriaContainer");
const addEditCriterionBtn = document.getElementById("addEditCriterionBtn");
const updateTemplateBtn = document.getElementById("updateTemplateBtn");
const deleteTemplateBtn = document.getElementById("deleteTemplateBtn");

// Bewertungs-Elemente
const assessmentDateSelect = document.getElementById("assessmentDateSelect");
const assessmentTopicSelect = document.getElementById("assessmentTopicSelect");
const assessmentStudentList = document.getElementById("assessmentStudentList");
const assessmentContent = document.getElementById("assessmentContent");

// Übersichts-Elemente
const overviewYearSelect = document.getElementById("overviewYearSelect");
const overviewDateSelect = document.getElementById("overviewDateSelect");
const overviewTopicSelect = document.getElementById("overviewTopicSelect");
const overviewTable = document.getElementById("overviewTable");
const printBtn = document.getElementById("printBtn");

// Einstellungs-Elemente
const settingsYearSelect = document.getElementById("settingsYearSelect");
const settingsDateSelect = document.getElementById("settingsDateSelect");
const defaultTemplateSelect = document.getElementById("defaultTemplateSelect");
const saveSettingsBtn = document.getElementById("saveSettingsBtn");
const exportDataBtn = document.getElementById("exportDataBtn");
const deleteVerificationCode = document.getElementById("deleteVerificationCode");
const deleteDataBtn = document.getElementById("deleteDataBtn");

// Modal-Elemente
const editStudentModal = document.getElementById("editStudentModal");
const closeEditStudentModal = document.getElementById("closeEditStudentModal");
const editStudentName = document.getElementById("editStudentName");
const editStudentTopic = document.getElementById("editStudentTopic");
const editExamDate = document.getElementById("editExamDate");
const editAssignedTeacher = document.getElementById("editAssignedTeacher");
const editTemplateSelect = document.getElementById("editTemplateSelect");
const saveStudentBtn = document.getElementById("saveStudentBtn");
const deleteStudentBtn = document.getElementById("deleteStudentBtn");

const editGradeModal = document.getElementById("editGradeModal");
const closeEditGradeModal = document.getElementById("closeEditGradeModal");
const editFinalGrade = document.getElementById("editFinalGrade");
const saveGradeBtn = document.getElementById("saveGradeBtn");

const confirmDeleteModal = document.getElementById("confirmDeleteModal");
const closeConfirmDeleteModal = document.getElementById("closeConfirmDeleteModal");
const deleteStudentName = document.getElementById("deleteStudentName");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");

const tabs = document.querySelectorAll(".tab");
const tabContents = document.querySelectorAll(".tab-content");

const today = new Date();
const defaultDate =
  today.getFullYear() +
  "-" +
  String(today.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(today.getDate()).padStart(2, "0");

// Start
document.addEventListener("DOMContentLoaded", async () => {
  console.log(`${APP_CONFIG.name} wird initialisiert...`);
  showLoader();
  try {
    // 1. Firebase initialisieren
    await initDatabase();
    await ensureCollection();
    
    // 2. Lehrer aus Firebase laden
    console.log("Lade Lehrer-Daten...");
    await loadAllTeachers();
    
    // 3. Globale Variable setzen für uiService
    window.allTeachers = allTeachers;
    console.log("Verfügbare Lehrer:", allTeachers.length);
    
    // 4. UI mit geladenen Lehrern initialisieren
    initTeacherGrid(teacherGrid, showPasswordModal, allTeachers);
    
    // 5. Event-Listener einrichten
    setupEventListeners();
    
    // 6. Standard-Datum setzen
    if (examDate) {
      examDate.value = defaultDate;
    }
    
    // 7. Sticky-Element erstellen
    createStickyAverageElement();
    
    console.log("Initialisierung abgeschlossen!");
  } catch (error) {
    console.error("Fehler bei der Initialisierung:", error);
    showNotification("Fehler bei der Initialisierung. Bitte Seite neu laden.", "error");
  } finally {
    hideLoader();
  }
});

// Erstellt das Element für die schwebende Durchschnittsanzeige
function createStickyAverageElement() {
  stickyAverageElement = document.createElement("div");
  stickyAverageElement.className = "sticky-average";
  stickyAverageElement.textContent = "Ø 0.0";
  document.body.appendChild(stickyAverageElement);

  window.addEventListener("scroll", () => {
    if (!assessmentContent) return;
    if (!assessmentContent.querySelector(".final-grade-display")) return;
    
    const rect = assessmentContent.querySelector(".final-grade-display").getBoundingClientRect();
    if (rect.top < 0) {
      stickyAverageElement.style.display = "block";
    } else {
      stickyAverageElement.style.display = "none";
    }
  });
}

// Zeigt den Passwortdialog
function showPasswordModal(teacher) {
  loginPrompt.textContent = `Bitte das Passwort für ${teacher.name} eingeben:`;
  passwordInput.value = "";
  passwordModal.style.display = "flex";
  passwordInput.focus();
  currentUser.name = teacher.name;
  currentUser.code = teacher.code;
  currentUser.password = teacher.password;
}

// Initialisiert alle nötigen Event-Listener
function setupEventListeners() {
  // Basis-Event-Listener
  if (closePasswordModal) {
    closePasswordModal.addEventListener("click", () => {
      passwordModal.style.display = "none";
    });
  }
  if (cancelLogin) {
    cancelLogin.addEventListener("click", () => {
      passwordModal.style.display = "none";
    });
  }
  if (confirmLogin) {
    confirmLogin.addEventListener("click", login);
  }
  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        login();
      }
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  // Tab-System
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`${tabId}-tab`).classList.add("active");
      
      switch (tabId) {
        case "students":
          updateStudentsTab();
          break;
        case "templates":
          updateTemplatesTab();
          break;
        case "assessment":
          updateAssessmentTab();
          break;
        case "overview":
          updateOverviewTab();
          break;
        case "settings":
          updateSettingsTab();
          break;
      }
    });
  });

  // Schüler-Event-Listener
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", addNewStudent);
  }
  if (studentViewFilter) {
    studentViewFilter.addEventListener("change", updateStudentsTab);
  }

  // Template-Event-Listener
  if (addCriterionBtn) {
    addCriterionBtn.addEventListener("click", addCriterionRow);
  }
  if (saveTemplateBtn) {
    saveTemplateBtn.addEventListener("click", saveNewTemplate);
  }
  if (addEditCriterionBtn) {
    addEditCriterionBtn.addEventListener("click", () => addCriterionRow(editTemplateCriteriaContainer));
  }

  // Bewertungs-Event-Listener
  if (assessmentDateSelect) {
    assessmentDateSelect.addEventListener("change", () => {
      lastSelectedDate = assessmentDateSelect.value;
      populateAssessmentTopicSelect();
      updateAssessmentStudentList();
    });
  }
  if (assessmentTopicSelect) {
    assessmentTopicSelect.addEventListener("change", () => {
      lastSelectedTopic = assessmentTopicSelect.value;
      updateAssessmentStudentList();
    });
  }

  // Übersichts-Event-Listener
  if (overviewYearSelect) {
    overviewYearSelect.addEventListener("change", () => {
      populateOverviewDateSelect();
      populateOverviewTopicSelect();
      updateOverviewContent();
    });
  }
  if (overviewDateSelect) {
    overviewDateSelect.addEventListener("change", updateOverviewContent);
  }
  if (overviewTopicSelect) {
    overviewTopicSelect.addEventListener("change", updateOverviewContent);
  }
  if (printBtn) {
    printBtn.addEventListener("click", printOverviewData);
  }

  // Einstellungs-Event-Listener
  if (settingsYearSelect) {
    settingsYearSelect.addEventListener("change", () => {
      populateSettingsDateSelect();
    });
  }
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener("click", saveAppSettings);
  }
  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", exportData);
  }
  if (deleteDataBtn) {
    deleteDataBtn.addEventListener("click", confirmDeleteAllData);
  }

  // Modal-Event-Listener
  setupModalEventListeners();
  
  // Admin-Event-Listener
  setupAdminEventListeners();
}

// Modal-Event-Listener Setup
function setupModalEventListeners() {
  // Edit Student Modal
  if (closeEditStudentModal) {
    closeEditStudentModal.addEventListener("click", () => {
      editStudentModal.style.display = "none";
    });
  }
  if (saveStudentBtn) {
    saveStudentBtn.addEventListener("click", saveEditedStudent);
  }
  if (deleteStudentBtn) {
    deleteStudentBtn.addEventListener("click", showDeleteConfirmation);
  }

  // Edit Template Modal
  if (closeEditTemplateModal) {
    closeEditTemplateModal.addEventListener("click", () => {
      editTemplateModal.style.display = "none";
    });
  }
  if (updateTemplateBtn) {
    updateTemplateBtn.addEventListener("click", saveEditedTemplate);
  }
  if (deleteTemplateBtn) {
    deleteTemplateBtn.addEventListener("click", confirmDeleteTemplate);
  }

  // Edit Grade Modal
  if (closeEditGradeModal) {
    closeEditGradeModal.addEventListener("click", () => {
      editGradeModal.style.display = "none";
    });
  }
  if (saveGradeBtn) {
    saveGradeBtn.addEventListener("click", saveEditedGrade);
  }

  // Confirm Delete Modal
  if (closeConfirmDeleteModal) {
    closeConfirmDeleteModal.addEventListener("click", () => {
      confirmDeleteModal.style.display = "none";
    });
  }
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", () => {
      confirmDeleteModal.style.display = "none";
    });
  }
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", deleteStudent);
  }
}

// Admin-Event-Listener Setup
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
      if (e.key === "Enter") {
        performAdminLogin();
      }
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
      } else if (tabId === "system") {
        updateSystemInfoTab();
      }
    });
  });

  // Weitere Admin-Event-Listener
  if (addTeacherBtn) {
    addTeacherBtn.addEventListener("click", addNewTeacher);
  }
  if (refreshSystemBtn) {
    refreshSystemBtn.addEventListener("click", refreshSystemInfo);
  }
  if (exportTeachersBtn) {
    exportTeachersBtn.addEventListener("click", exportAllTeachers);
  }
  if (deleteAllTeachersBtn) {
    deleteAllTeachersBtn.addEventListener("click", confirmDeleteAllTeachers);
  }
  if (deleteAllDataBtn) {
    deleteAllDataBtn.addEventListener("click", confirmDeleteAllSystemData);
  }

  // Edit Teacher Modal
  if (closeEditTeacherModal) {
    closeEditTeacherModal.addEventListener("click", () => {
      editTeacherModal.style.display = "none";
    });
  }
  if (saveTeacherBtn) {
    saveTeacherBtn.addEventListener("click", saveEditedTeacher);
  }
  if (deleteTeacherBtn) {
    deleteTeacherBtn.addEventListener("click", showDeleteTeacherConfirmation);
  }

  // Confirm Delete Teacher Modal
  if (closeConfirmDeleteTeacherModal) {
    closeConfirmDeleteTeacherModal.addEventListener("click", () => {
      confirmDeleteTeacherModal.style.display = "none";
    });
  }
  if (cancelDeleteTeacherBtn) {
    cancelDeleteTeacherBtn.addEventListener("click", () => {
      confirmDeleteTeacherModal.style.display = "none";
    });
  }
  if (confirmDeleteTeacherBtn) {
    confirmDeleteTeacherBtn.addEventListener("click", confirmDeleteTeacher);
  }
}

// Führt den Login aus
async function login() {
  if (passwordInput.value === currentUser.password) {
    passwordModal.style.display = "none";
    showLoader();
    await loadTeacherData();
    loginSection.style.display = "none";
    appSection.style.display = "block";
    teacherAvatar.textContent = currentUser.code.charAt(0);
    teacherName.textContent = currentUser.name;
    
    // Initialisiere alle Tabs
    updateStudentsTab();
    updateTemplatesTab();
    populateTeacherSelects();
    populateTemplateSelects();
    
    hideLoader();
    showNotification(`Willkommen, ${currentUser.name}!`);
  } else {
    showNotification("Falsches Passwort!", "error");
  }
}

// Logout
function logout() {
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
    infoTextSaveTimer = null;
  }
  currentUser.name = null;
  currentUser.code = null;
  currentUser.password = null;
  teacherData.students = [];
  teacherData.assessments = {};
  teacherData.assessmentTemplates = [];
  loginSection.style.display = "block";
  appSection.style.display = "none";
  showNotification("Abmeldung erfolgreich.");
}

// Populiert Lehrer-Auswahlfelder
function populateTeacherSelects() {
  const selects = [assignedTeacherSelect, editAssignedTeacher];
  
  selects.forEach(select => {
    if (!select) return;
    
    // Aktuelle Auswahl merken
    const currentValue = select.value;
    
    // Optionen löschen (außer der ersten)
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }
    
    // Erste Option aktualisieren
    if (select.children[0]) {
      select.children[0].textContent = `Aktueller Lehrer (${currentUser.name})`;
      select.children[0].value = currentUser.code;
    }
    
    // Alle anderen Lehrer hinzufügen
    allTeachers.forEach(teacher => {
      if (teacher.code !== currentUser.code) {
        const option = document.createElement("option");
        option.value = teacher.code;
        option.textContent = teacher.name;
        select.appendChild(option);
      }
    });
    
    // Auswahl wiederherstellen
    if (currentValue) {
      select.value = currentValue;
    }
  });
}

// Populiert Template-Auswahlfelder
function populateTemplateSelects() {
  const selects = [templateSelect, editTemplateSelect, defaultTemplateSelect];
  
  selects.forEach(select => {
    if (!select) return;
    
    const currentValue = select.value;
    
    // Optionen löschen (außer der ersten)
    while (select.children.length > 1) {
      select.removeChild(select.lastChild);
    }
    
    // Alle Templates hinzufügen
    const templates = getAllAssessmentTemplates();
    templates.forEach(template => {
      const option = document.createElement("option");
      option.value = template.id;
      option.textContent = template.name + (template.isDefault ? " (Standard)" : "");
      select.appendChild(option);
    });
    
    // Auswahl wiederherstellen
    if (currentValue) {
      select.value = currentValue;
    } else if (teacherData.settings && teacherData.settings.defaultTemplate) {
      select.value = teacherData.settings.defaultTemplate;
    }
  });
}

// Speichert App-Einstellungen
async function saveAppSettings() {
  if (!teacherData.settings) {
    teacherData.settings = {};
  }
  
  teacherData.settings.defaultTemplate = defaultTemplateSelect.value;
  
  showLoader();
  const saved = await saveTeacherData();
  hideLoader();
  
  if (saved) {
    showNotification("Einstellungen gespeichert.");
  }
}

// === SCHÜLER-VERWALTUNG ===

// Aktualisiert den "Schüler anlegen"-Tab
function updateStudentsTab() {
  if (!studentsTable) return;
  
  const tbody = studentsTable.querySelector("tbody");
  tbody.innerHTML = "";
  
  let studentsToShow = [];
  const filter = studentViewFilter ? studentViewFilter.value : "assigned";
  
  switch (filter) {
    case "assigned":
      studentsToShow = getAssignedStudents();
      break;
    case "created":
      studentsToShow = teacherData.students.filter(student => 
        student.createdBy === currentUser.code
      );
      break;
    case "all":
      studentsToShow = getAllStudents();
      break;
  }
  
  if (studentsToShow.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="6">Keine Schüler vorhanden</td>';
    tbody.appendChild(tr);
    return;
  }
  
  const sorted = [...studentsToShow].sort(
    (a, b) => new Date(b.examDate) - new Date(a.examDate)
  );
  
  sorted.forEach((student) => {
    const tr = document.createElement("tr");
    const assignedTeacher = allTeachers.find(t => t.code === student.assignedTeacher);
    const createdByTeacher = allTeachers.find(t => t.code === student.createdBy);
    const template = getAssessmentTemplate(student.templateId);
    
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${formatDate(student.examDate)}</td>
      <td>${student.topic || "-"}</td>
      <td class="assigned-teacher-col">${assignedTeacher ? assignedTeacher.name : student.assignedTeacher}</td>
      <td class="created-by-col">${createdByTeacher ? createdByTeacher.name : student.createdBy}</td>
      <td>
        <button class="edit-btn" data-id="${student.id}">✏️</button>
      </td>
    `;
    tr.querySelector(".edit-btn").addEventListener("click", () => {
      showEditStudentModal(student);
    });
    tbody.appendChild(tr);
  });
}

// Neuen Schüler hinzufügen
async function addNewStudent() {
  const name = newStudentName.value.trim();
  const date = examDate.value;
  const topic = newStudentTopic ? newStudentTopic.value.trim() : "";
  const assignedTeacher = assignedTeacherSelect.value || currentUser.code;
  const templateId = templateSelect.value || teacherData.settings.defaultTemplate;
  
  lastSelectedDate = date;
  if (topic) {
    lastSelectedTopic = topic;
  }
  
  if (!name) {
    showNotification("Bitte einen Namen eingeben.", "warning");
    return;
  }
  
  const existing = teacherData.students.find(
    (s) => s.name.toLowerCase() === name.toLowerCase() && s.examDate === date
  );
  
  if (existing) {
    showNotification(`Schüler "${name}" existiert bereits für dieses Datum.`, "warning");
    return;
  }
  
  showLoader();
  
  try {
    const newStudent = createStudent(name, date, topic, assignedTeacher, templateId);
    const saved = await saveTeacherData();
    
    if (saved) {
      newStudentName.value = "";
      if (newStudentTopic) newStudentTopic.value = "";
      examDate.value = lastSelectedDate;
      assignedTeacherSelect.value = "";
      templateSelect.value = "";
      
      updateStudentsTab();
      populateAssessmentDateSelect();
      populateAssessmentTopicSelect();
      populateOverviewTopicSelect();
      showNotification(`Schüler "${name}" wurde hinzugefügt.`);
    }
  } catch (error) {
    console.error("Fehler beim Erstellen des Schülers:", error);
    showNotification("Fehler beim Erstellen des Schülers.", "error");
  } finally {
    hideLoader();
  }
}

// Zeigt das Modal zum Bearbeiten eines Schülers
function showEditStudentModal(student) {
  editStudentName.value = student.name;
  editExamDate.value = student.examDate;
  if (editStudentTopic) {
    editStudentTopic.value = student.topic || "";
  }
  if (editAssignedTeacher) {
    editAssignedTeacher.value = student.assignedTeacher || "";
  }
  if (editTemplateSelect) {
    editTemplateSelect.value = student.templateId || "";
  }
  selectedStudent = student;
  editStudentModal.style.display = "flex";
}

// Speichert Änderungen am Schüler
async function saveEditedStudent() {
  if (!selectedStudent) return;
  
  const name = editStudentName.value.trim();
  const date = editExamDate.value;
  const topic = editStudentTopic ? editStudentTopic.value.trim() : "";
  const assignedTeacher = editAssignedTeacher ? editAssignedTeacher.value : selectedStudent.assignedTeacher;
  const templateId = editTemplateSelect ? editTemplateSelect.value : selectedStudent.templateId;
  
  if (date !== selectedStudent.examDate) {
    lastSelectedDate = date;
  }
  if (topic && topic !== selectedStudent.topic) {
    lastSelectedTopic = topic;
  }
  
  if (!name) {
    showNotification("Bitte einen Namen eingeben.", "warning");
    return;
  }
  
  const existing = teacherData.students.find(
    (s) =>
      s.id !== selectedStudent.id &&
      s.name.toLowerCase() === name.toLowerCase() &&
      s.examDate === date
  );
  
  if (existing) {
    showNotification(`Schüler "${name}" existiert bereits für dieses Datum.`, "warning");
    return;
  }
  
  showLoader();
  
  selectedStudent.name = name;
  selectedStudent.examDate = date;
  selectedStudent.topic = topic;
  selectedStudent.assignedTeacher = assignedTeacher;
  
  // Template-Wechsel behandeln
  if (templateId !== selectedStudent.templateId) {
    selectedStudent.templateId = templateId;
    // Bewertung neu initialisieren
    const template = getAssessmentTemplate(templateId);
    const assessment = teacherData.assessments[selectedStudent.id];
    
    if (template && assessment) {
      // Alte Bewertungen löschen, aber Info-Text und Endnote behalten
      const savedInfo = assessment.infoText || "";
      const savedGrade = assessment.finalGrade;
      
      teacherData.assessments[selectedStudent.id] = {
        templateId: templateId,
        infoText: savedInfo,
        finalGrade: savedGrade
      };
      
      // Neue Kategorien initialisieren
      template.categories.forEach(category => {
        teacherData.assessments[selectedStudent.id][category.id] = 2;
      });
    }
  }
  
  const saved = await saveTeacherData();
  hideLoader();
  
  if (saved) {
    updateStudentsTab();
    populateAssessmentDateSelect();
    populateAssessmentTopicSelect();
    populateOverviewTopicSelect();
    showNotification(`Schüler "${name}" wurde aktualisiert.`);
    editStudentModal.style.display = "none";
  }
}

// Bestätigung zum Löschen
function showDeleteConfirmation() {
  studentToDelete = selectedStudent;
  deleteStudentName.textContent = studentToDelete.name;
  editStudentModal.style.display = "none";
  confirmDeleteModal.style.display = "flex";
}

// Löscht einen Schüler
async function deleteStudent() {
  if (!studentToDelete) return;
  showLoader();
  teacherData.students = teacherData.students.filter((s) => s.id !== studentToDelete.id);
  delete teacherData.assessments[studentToDelete.id];
  const saved = await saveTeacherData();
  hideLoader();
  if (saved) {
    updateStudentsTab();
    populateAssessmentDateSelect();
    populateAssessmentTopicSelect();
    updateOverviewTab();
    showNotification(`Schüler "${studentToDelete.name}" wurde gelöscht.`);
    confirmDeleteModal.style.display = "none";
    studentToDelete = null;
  }
}

// === TEMPLATE-VERWALTUNG ===

// Aktualisiert den Templates-Tab
function updateTemplatesTab() {
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
  
  // Template-Selects aktualisieren
  populateTemplateSelects();
}

// Fügt eine neue Kriterium-Zeile hinzu
function addCriterionRow(container = templateCriteriaContainer) {
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

// Sammelt Kriterien aus einem Container
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

// Speichert ein neues Template
async function saveNewTemplate() {
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
      // Alle Kriterium-Zeilen löschen außer der ersten
      const rows = templateCriteriaContainer.querySelectorAll(".criterion-row");
      for (let i = 1; i < rows.length; i++) {
        rows[i].remove();
      }
      // Erste Zeile leeren
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

// Zeigt das Edit-Template Modal
function showEditTemplateModal(template) {
  editingTemplate = template;
  editTemplateName.value = template.name;
  editTemplateDescription.value = template.description;
  
  // Kriterien laden
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

// Speichert bearbeitetes Template
async function saveEditedTemplate() {
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
      editTemplateModal.style.display = "none";
      editingTemplate = null;
    }
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoader();
  }
}

// Bestätigt das Löschen eines Templates
function confirmDeleteTemplate(template = editingTemplate) {
  if (!template) return;
  
  if (!confirm(`Soll das Bewertungsraster "${template.name}" wirklich gelöscht werden?`)) {
    return;
  }
  
  performDeleteTemplate(template);
}

// Löscht ein Template
async function performDeleteTemplate(template) {
  showLoader();
  
  try {
    deleteAssessmentTemplate(template.id);
    const saved = await saveTeacherData();
    
    if (saved) {
      updateTemplatesTab();
      showNotification(`Bewertungsraster "${template.name}" wurde gelöscht.`);
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

// === BEWERTUNGS-TAB ===

function updateAssessmentTab() {
  populateAssessmentDateSelect();
  populateAssessmentTopicSelect();
  updateAssessmentStudentList();
}

function populateAssessmentDateSelect() {
  if (!assessmentDateSelect) return;
  const dates = getAvailableDates();
  assessmentDateSelect.innerHTML = '<option value="">Alle Termine</option>';
  if (dates.length === 0) return;
  
  let defaultVal = null;
  if (lastSelectedDate && dates.includes(lastSelectedDate)) {
    defaultVal = lastSelectedDate;
  } else if (dates.includes(defaultDate)) {
    defaultVal = defaultDate;
  } else if (dates.length > 0) {
    defaultVal = dates[0];
  }
  
  dates.forEach((date) => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = formatDate(date);
    if (date === defaultVal) {
      option.selected = true;
    }
    assessmentDateSelect.appendChild(option);
  });
  
  if (assessmentDateSelect.value) {
    lastSelectedDate = assessmentDateSelect.value;
  }
}

function populateAssessmentTopicSelect() {
  if (!assessmentTopicSelect) return;
  const selectedDate = assessmentDateSelect.value;
  const topics = getAvailableTopics(selectedDate);
  assessmentTopicSelect.innerHTML = '<option value="">Alle Themen</option>';
  if (topics.length === 0) return;
  
  let defaultTopic = null;
  if (lastSelectedTopic && topics.includes(lastSelectedTopic)) {
    defaultTopic = lastSelectedTopic;
  }
  
  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    if (topic === defaultTopic) {
      option.selected = true;
    }
    assessmentTopicSelect.appendChild(option);
  });
  
  if (assessmentTopicSelect.value) {
    lastSelectedTopic = assessmentTopicSelect.value;
  }
}

function updateAssessmentStudentList() {
  if (!assessmentStudentList || !assessmentContent) return;
  const selectedDate = assessmentDateSelect.value;
  const selectedTopic = assessmentTopicSelect ? assessmentTopicSelect.value : "";
  
  assessmentStudentList.innerHTML = "";
  
  if (!selectedDate && !selectedTopic) {
    assessmentStudentList.innerHTML = "<li>Bitte Datum oder Thema wählen</li>";
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Willkommen bei der Bewertungsapp</h2>
        <p>Bitte einen Prüfungstag oder ein Thema wählen und anschließend einen Schüler aus der Liste auswählen.</p>
      </div>
    `;
    currentSelectedStudentId = null;
    return;
  }
  
  // Nur zugewiesene Schüler anzeigen
  let filtered = getAssignedStudents();
  
  if (selectedDate) {
    filtered = filtered.filter((s) => s.examDate === selectedDate);
  }
  if (selectedTopic) {
    filtered = filtered.filter((s) => s.topic === selectedTopic);
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
    const dateComp = new Date(b.examDate) - new Date(a.examDate);
    if (dateComp !== 0) return dateComp;
    return a.name.localeCompare(b.name);
  });
  
  filtered.forEach((student) => {
    const li = document.createElement("li");
    li.className = "student-item";
    li.dataset.id = student.id;
    const assessment = teacherData.assessments[student.id] || {};
    const finalGrade = assessment.finalGrade || "-";
    
    li.innerHTML = `
      <div class="student-name">${student.name}${student.topic ? ` (${student.topic})` : ""}</div>
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
  
  // Schüler auswählen
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

function showAssessmentForm(student) {
  selectedStudent = student;
  const assessment = teacherData.assessments[student.id] || {};
  const template = getAssessmentTemplate(student.templateId);
  
  if (!template) {
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Fehler</h2>
        <p>Bewertungsraster für diesen Schüler nicht gefunden.</p>
      </div>
    `;
    return;
  }
  
  const avgGrade = calculateAverageGradeWithTemplate(assessment, template);
  const finalGrade = assessment.finalGrade || avgGrade || "-";
  const infoText = assessment.infoText || "";
  
  let html = `
    <div class="assessment-container">
      <div class="student-header">
        <h2>${student.name}</h2>
        <p>Prüfungsdatum: ${formatDate(student.examDate)}</p>
        ${student.topic ? `<p>Thema: ${student.topic}</p>` : ""}
        <p>Bewertungsraster: <strong>${template.name}</strong></p>
      </div>
      
      <div class="info-text-container">
        <h3>Informationen zum Schüler</h3>
        <textarea id="studentInfoText" rows="4" placeholder="Notizen zum Schüler...">${infoText}</textarea>
      </div>
      
      <div class="final-grade-display">Ø ${avgGrade || "0.0"}</div>
      
      <div class="final-grade-input">
        <label for="finalGrade">Endnote:</label>
        <input type="number" id="finalGrade" min="1" max="6" step="0.5" value="${finalGrade !== "-" ? finalGrade : ""}">
        <button id="saveFinalGradeBtn">Speichern</button>
        <button id="useAverageBtn">Durchschnitt übernehmen</button>
      </div>
  `;
  
  // Template-Kategorien
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
  
  html += `</div>`;
  assessmentContent.innerHTML = html;
  
  // Sticky-Anzeige aktualisieren
  if (stickyAverageElement) {
    stickyAverageElement.textContent = `Ø ${avgGrade || "0.0"}`;
  }
  
  // Event-Listener für die Note-Buttons
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
        teacherData.assessments[student.id] = { templateId: student.templateId };
      }
      teacherData.assessments[student.id][categoryId] = gradeValue;
      
      const newAvg = calculateAverageGradeWithTemplate(teacherData.assessments[student.id], template);
      const avgDisplay = document.querySelector(".final-grade-display");
      avgDisplay.textContent = `Ø ${newAvg || "0.0"}`;
      
      // Sticky-Anzeige aktualisieren
      if (stickyAverageElement) {
        stickyAverageElement.textContent = `Ø ${newAvg || "0.0"}`;
      }
      
      if (!teacherData.assessments[student.id].finalGrade) {
        teacherData.assessments[student.id].finalGrade = parseFloat(newAvg);
        const fgInput = document.getElementById("finalGrade");
        if (fgInput) fgInput.value = newAvg;
      }
      
      try {
        await saveTeacherData();
        updateStudentGradeInList(student.id, teacherData.assessments[student.id].finalGrade);
      } catch (error) {
        console.error("Fehler beim Speichern:", error);
        showNotification("Fehler beim Speichern.", "error");
      }
    });
  });
  
  // Event-Listener für weitere Aktionen
  const saveFinalGradeBtn = document.getElementById("saveFinalGradeBtn");
  if (saveFinalGradeBtn) {
    saveFinalGradeBtn.addEventListener("click", async () => {
      const inputVal = parseFloat(document.getElementById("finalGrade").value);
      if (isNaN(inputVal) || inputVal < 1 || inputVal > 6) {
        showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
        return;
      }
      teacherData.assessments[student.id].finalGrade = inputVal;
      try {
        await saveTeacherData();
        updateStudentGradeInList(student.id, inputVal);
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
      const avgGrade = calculateAverageGradeWithTemplate(teacherData.assessments[student.id], template);
      if (!avgGrade) {
        showNotification("Es ist kein Durchschnitt vorhanden.", "warning");
        return;
      }
      document.getElementById("finalGrade").value = avgGrade;
      teacherData.assessments[student.id].finalGrade = parseFloat(avgGrade);
      try {
        await saveTeacherData();
        updateStudentGradeInList(student.id, parseFloat(avgGrade));
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

// Berechnet Durchschnitt mit Template-Gewichtung
function calculateAverageGradeWithTemplate(assessment, template) {
  if (!assessment || !template) return null;
  
  let sum = 0;
  let totalWeight = 0;
  
  template.categories.forEach((category) => {
    if (assessment[category.id] && assessment[category.id] > 0) {
      sum += assessment[category.id] * (category.weight || 1);
      totalWeight += (category.weight || 1);
    }
  });
  
  if (totalWeight === 0) return null;
  return (sum / totalWeight).toFixed(1);
}

function setupInfoTextAutoSave(studentId) {
  if (infoTextSaveTimer) clearInterval(infoTextSaveTimer);
  infoTextSaveTimer = setInterval(async () => {
    const area = document.getElementById("studentInfoText");
    if (area && area.dataset.changed === "true") {
      teacherData.assessments[studentId].infoText = area.value;
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

// === ÜBERSICHTS-TAB ===

function updateOverviewTab() {
  populateOverviewYearSelect();
  populateOverviewDateSelect();
  populateOverviewTopicSelect();
  updateOverviewContent();
}

function populateOverviewYearSelect() {
  if (!overviewYearSelect) return;
  const years = getAvailableYears();
  
  overviewYearSelect.innerHTML = '<option value="">Alle Jahre</option>';
  years.forEach((year) => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    overviewYearSelect.appendChild(opt);
  });
}

function populateOverviewDateSelect() {
  if (!overviewDateSelect) return;
  const year = overviewYearSelect.value;
  const dates = getAvailableDates(year);
  overviewDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  dates.forEach((date) => {
    const opt = document.createElement("option");
    opt.value = date;
    opt.textContent = formatDate(date);
    overviewDateSelect.appendChild(opt);
  });
}

function populateOverviewTopicSelect() {
  if (!overviewTopicSelect) return;
  overviewTopicSelect.innerHTML = '<option value="">Alle Themen</option>';
  let filtered = getAssignedStudents(); // Nur zugewiesene Schüler
  const year = overviewYearSelect.value;
  if (year) {
    filtered = filtered.filter((s) => getYearFromDate(s.examDate) === year);
  }
  const d = overviewDateSelect.value;
  if (d) {
    filtered = filtered.filter((s) => s.examDate === d);
  }
  const topics = new Set();
  filtered.forEach((s) => {
    if (s.topic) topics.add(s.topic);
  });
  Array.from(topics)
    .sort()
    .forEach((topic) => {
      const opt = document.createElement("option");
      opt.value = topic;
      opt.textContent = topic;
      overviewTopicSelect.appendChild(opt);
    });
}

function updateOverviewContent() {
  if (!overviewTable) return;
  const tbody = overviewTable.querySelector("tbody");
  tbody.innerHTML = "";
  
  let filtered = getAssignedStudents(); // Nur zugewiesene Schüler
  const year = overviewYearSelect.value;
  if (year) {
    filtered = filtered.filter((s) => getYearFromDate(s.examDate) === year);
  }
  const d = overviewDateSelect.value;
  if (d) {
    filtered = filtered.filter((s) => s.examDate === d);
  }
  const t = overviewTopicSelect.value;
  if (t) {
    filtered = filtered.filter((s) => s.topic === t);
  }
  
  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="8">Keine Schüler gefunden</td>';
    tbody.appendChild(tr);
    return;
  }
  
  filtered.sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
  
  filtered.forEach((student) => {
    const assessment = teacherData.assessments[student.id] || {};
    const template = getAssessmentTemplate(student.templateId);
    const assignedTeacher = allTeachers.find(t => t.code === student.assignedTeacher);
    
    // Bewertungen dynamisch anzeigen
    let ratingsHtml = "";
    if (template && template.categories) {
      const ratings = template.categories.map(cat => 
        assessment[cat.id] || "-"
      ).join(", ");
      ratingsHtml = ratings.length > 50 ? ratings.substring(0, 50) + "..." : ratings;
    }
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${formatDate(student.examDate)}</td>
      <td>${student.topic || "-"}</td>
      <td class="assigned-teacher-col">${assignedTeacher ? assignedTeacher.name : student.assignedTeacher}</td>
      <td class="template-name-col">${template ? template.name : "Unbekannt"}</td>
      <td title="${ratingsHtml}">${ratingsHtml || "-"}</td>
      <td><strong>${assessment.finalGrade !== undefined ? assessment.finalGrade : "-"}</strong></td>
      <td>
        <button class="edit-btn" data-id="${student.id}">✏️</button>
      </td>
    `;
    tr.querySelector(".edit-btn").addEventListener("click", () => {
      openEditGradeModal(student);
    });
    tbody.appendChild(tr);
  });
}

function printOverviewData() {
  window.print();
}

function openEditGradeModal(student) {
  selectedGradeStudent = student;
  const assessment = teacherData.assessments[student.id] || {};
  editFinalGrade.value = assessment.finalGrade || "";
  editGradeModal.style.display = "flex";
}

async function saveEditedGrade() {
  if (!selectedGradeStudent) return;
  const val = parseFloat(editFinalGrade.value);
  if (isNaN(val) || val < 1 || val > 6) {
    showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
    return;
  }
  teacherData.assessments[selectedGradeStudent.id].finalGrade = val;
  showLoader();
  const saved = await saveTeacherData();
  hideLoader();
  if (saved) {
    updateOverviewContent();
    // Bei geöffnetem Bewertungs-Tab die Notendarstellung aktualisieren
    if (selectedGradeStudent.id === currentSelectedStudentId) {
      const finalGradeInput = document.getElementById("finalGrade");
      if (finalGradeInput) finalGradeInput.value = val;
    }
    updateStudentGradeInList(selectedGradeStudent.id, val);
    showNotification("Note aktualisiert.");
    editGradeModal.style.display = "none";
  }
}

// === EINSTELLUNGEN ===

function updateSettingsTab() {
  populateSettingsYearSelect();
  populateSettingsDateSelect();
  populateTemplateSelects();
}

function populateSettingsYearSelect() {
  if (!settingsYearSelect) return;
  const years = getAvailableYears();
  settingsYearSelect.innerHTML = '<option value="">Alle Jahre</option>';
  years.forEach((year) => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    settingsYearSelect.appendChild(opt);
  });
}

function populateSettingsDateSelect() {
  if (!settingsDateSelect) return;
  const year = settingsYearSelect.value;
  const dates = getAvailableDates(year);
  settingsDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  dates.forEach((date) => {
    const opt = document.createElement("option");
    opt.value = date;
    opt.textContent = formatDate(date);
    settingsDateSelect.appendChild(opt);
  });
}

function exportData() {
  const useTxt = document.getElementById("exportTXT") && document.getElementById("exportTXT").checked;
  const year = settingsYearSelect.value;
  const day = settingsDateSelect.value;
  
  let filtered = getAssignedStudents(); // Nur zugewiesene Schüler
  
  if (year) {
    filtered = filtered.filter((s) => getYearFromDate(s.examDate) === year);
  }
  if (day) {
    filtered = filtered.filter((s) => s.examDate === day);
  }
  
  if (useTxt) {
    let txtContent = `Export ${APP_CONFIG.name}\n\n`;
    filtered.forEach((student) => {
      const assessment = teacherData.assessments[student.id] || {};
      const template = getAssessmentTemplate(student.templateId);
      
      txtContent += `Name: ${student.name}\n`;
      txtContent += `Datum: ${formatDate(student.examDate)}\n`;
      txtContent += `Thema: ${student.topic || '-'}\n`;
      txtContent += `Bewertungsraster: ${template ? template.name : 'Unbekannt'}\n`;
      txtContent += `Endnote: ${assessment.finalGrade || '-'}\n`;
      txtContent += `Kategorien:\n`;
      
      if (template && template.categories) {
        template.categories.forEach(cat => {
          txtContent += `  ${cat.name}: ${assessment[cat.id] || '-'}\n`;
        });
      }
      
      txtContent += `Info-Text: ${assessment.infoText || ''}\n\n`;
      txtContent += "--------------------------------\n\n";
    });
    downloadFile(`${APP_CONFIG.name}_Export.txt`, txtContent, "text/plain");
  } else {
    // JSON-Export
    const exportData = [];
    filtered.forEach((student) => {
      const assessment = teacherData.assessments[student.id] || {};
      const template = getAssessmentTemplate(student.templateId);
      const entry = {
        name: student.name,
        examDate: formatDate(student.examDate),
        topic: student.topic || '',
        templateName: template ? template.name : 'Unbekannt',
        finalGrade: assessment.finalGrade || '',
        categories: {}
      };
      
      if (template && template.categories) {
        template.categories.forEach(cat => {
          entry.categories[cat.name] = assessment[cat.id] || '-';
        });
      }
      
      entry.infoText = assessment.infoText || '';
      exportData.push(entry);
    });
    const jsonString = JSON.stringify(exportData, null, 2);
    downloadFile(`${APP_CONFIG.name}_Export.json`, jsonString, "application/json");
  }
}

function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function confirmDeleteAllData() {
  if (!deleteVerificationCode) return;
  if (deleteVerificationCode.value.trim() !== (currentUser.code || "")) {
    showNotification("Bestätigungscode ist falsch.", "error");
    return;
  }
  if (!confirm("Sollen wirklich alle Daten gelöscht werden? Das kann nicht rückgängig gemacht werden!")) {
    return;
  }
  deleteAllData();
}

async function deleteAllData() {
  if (!currentUser.code) return;
  try {
    showLoader();
    teacherData.students = [];
    teacherData.assessments = {};
    teacherData.assessmentTemplates = [];
    await saveTeacherData();
    updateStudentsTab();
    updateTemplatesTab();
    updateAssessmentTab();
    updateOverviewTab();
    showNotification("Alle Daten wurden gelöscht.");
  } catch (error) {
    console.error("Fehler beim Löschen aller Daten:", error);
    showNotification("Fehler beim Löschen.", "error");
  } finally {
    hideLoader();
  }
}

// === ADMIN-FUNKTIONEN ===

async function performAdminLogin() {
  const username = adminUsername ? adminUsername.value.trim() : "";
  const password = adminPassword ? adminPassword.value.trim() : "";

  if (!username || !password) {
    showNotification("Bitte alle Felder ausfüllen.", "warning");
    return;
  }

  showLoader();
  
  try {
    const loaded = await loadAllTeachers();
    if (!loaded) {
      showNotification("Fehler beim Laden der Lehrerdaten.", "error");
      hideLoader();
      return;
    }

    const loginSuccess = loginAdmin(username, password);
    if (loginSuccess) {
      adminLoginSection.style.display = "none";
      adminSection.style.display = "block";
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

function performAdminLogout() {
  logoutAdmin();
  adminSection.style.display = "none";
  loginSection.style.display = "block";
  if (adminUsername) adminUsername.value = "";
  if (adminPassword) adminPassword.value = "";
  showNotification("Admin-Abmeldung erfolgreich.");
}

async function addNewTeacher() {
  const name = newTeacherName ? newTeacherName.value.trim() : "";
  const code = newTeacherCode ? newTeacherCode.value.trim() : "";
  const password = newTeacherPassword ? newTeacherPassword.value.trim() : "";

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
    await addTeacher(name, code, password);
    if (newTeacherName) newTeacherName.value = "";
    if (newTeacherCode) newTeacherCode.value = "";
    if (newTeacherPassword) newTeacherPassword.value = "";
    updateTeachersAdminTab();
    updateSystemInfoTab();
    window.allTeachers = allTeachers;
    initTeacherGrid(teacherGrid, showPasswordModal, allTeachers);
    showNotification(`Lehrer "${name}" wurde hinzugefügt.`);
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoader();
  }
}

function updateTeachersAdminTab() {
  if (!teachersAdminTable) return;
  
  const tbody = teachersAdminTable.querySelector("tbody");
  tbody.innerHTML = "";

  if (allTeachers.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="4">Keine Lehrer vorhanden</td>';
    tbody.appendChild(tr);
    return;
  }

  const sortedTeachers = [...allTeachers].sort((a, b) => a.name.localeCompare(b.name));

  sortedTeachers.forEach((teacher) => {
    const tr = document.createElement("tr");
    const createdDate = teacher.createdAt ? formatDate(teacher.createdAt.split('T')[0]) : '-';
    
    tr.innerHTML = `
      <td>${teacher.name}</td>
      <td><span class="teacher-code">${teacher.code}</span></td>
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

function updateSystemInfoTab() {
  if (totalTeachers) {
    totalTeachers.textContent = allTeachers.length;
  }
  
  if (firebaseStatus) {
    import("./firebaseClient.js").then(({ db }) => {
      firebaseStatus.textContent = db ? "Online" : "Offline";
      firebaseStatus.className = db ? "stat-value status-online" : "stat-value status-offline";
    });
  }
  
  if (lastUpdate) {
    lastUpdate.textContent = new Date().toLocaleString("de-DE");
  }
}

async function refreshSystemInfo() {
  showLoader();
  try {
    await loadAllTeachers();
    window.allTeachers = allTeachers;
    initTeacherGrid(teacherGrid, showPasswordModal, allTeachers);
    updateSystemInfoTab();
    showNotification("System-Informationen aktualisiert.");
  } catch (error) {
    showNotification("Fehler beim Aktualisieren.", "error");
  } finally {
    hideLoader();
  }
}

function exportAllTeachers() {
  const exportData = allTeachers.map(teacher => ({
    name: teacher.name,
    code: teacher.code,
    createdAt: teacher.createdAt || '',
    updatedAt: teacher.updatedAt || ''
  }));

  const jsonString = JSON.stringify(exportData, null, 2);
  downloadFile(`${APP_CONFIG.name}_Lehrer_Export_${new Date().toISOString().split('T')[0]}.json`, jsonString, "application/json");
  showNotification("Lehrer exportiert.");
}

function confirmDeleteAllTeachers() {
  if (!adminDeleteVerificationCode) return;
  
  const code = adminDeleteVerificationCode.value.trim().toLowerCase();
  if (code !== "delete teachers") {
    showNotification('Bitte "delete teachers" eingeben, um zu bestätigen.', "error");
    return;
  }
  
  if (!confirm("Sollen wirklich ALLE Lehrer gelöscht werden?\n\nDas System wird auf Standard-Lehrer zurückgesetzt!\n\nDieser Vorgang kann nicht rückgängig gemacht werden!")) {
    return;
  }
  
  performDeleteAllTeachers();
}

async function performDeleteAllTeachers() {
  showLoader();
  try {
    await deleteAllTeachers();
    window.allTeachers = allTeachers;
    initTeacherGrid(teacherGrid, showPasswordModal, allTeachers);
    updateTeachersAdminTab();
    updateSystemInfoTab();
    if (adminDeleteVerificationCode) adminDeleteVerificationCode.value = "";
    showNotification("Alle Lehrer wurden gelöscht. Standard-Lehrer wiederhergestellt.");
  } catch (error) {
    showNotification("Fehler beim Löschen der Lehrer: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

function confirmDeleteAllSystemData() {
  if (!adminDeleteVerificationCode) return;
  
  const code = adminDeleteVerificationCode.value.trim().toLowerCase();
  if (code !== "delete everything") {
    showNotification('Bitte "delete everything" eingeben, um zu bestätigen.', "error");
    return;
  }
  
  if (!confirm("Sollen wirklich ALLE DATEN gelöscht werden?\n\n- Alle Lehrer (außer Standard-Lehrer)\n- Alle Bewertungsdaten aller Lehrer\n- Kompletter System-Reset\n\nDieser Vorgang kann NICHT rückgängig gemacht werden!")) {
    return;
  }
  
  performDeleteAllSystemData();
}

async function performDeleteAllSystemData() {
  showLoader();
  try {
    await deleteAllTeacherData();
    await deleteAllTeachers();
    
    window.allTeachers = allTeachers;
    initTeacherGrid(teacherGrid, showPasswordModal, allTeachers);
    updateTeachersAdminTab();
    updateSystemInfoTab();
    if (adminDeleteVerificationCode) adminDeleteVerificationCode.value = "";
    
    showNotification("Kompletter System-Reset durchgeführt. Alle Daten gelöscht.");
  } catch (error) {
    showNotification("Fehler beim System-Reset: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

function showEditTeacherModal(teacher) {
  if (editTeacherName) editTeacherName.value = teacher.name;
  if (editTeacherCode) editTeacherCode.value = teacher.code;
  if (editTeacherPassword) editTeacherPassword.value = teacher.password;
  selectedTeacher = teacher;
  if (editTeacherModal) editTeacherModal.style.display = "flex";
}

async function saveEditedTeacher() {
  if (!selectedTeacher) return;

  const name = editTeacherName ? editTeacherName.value.trim() : "";
  const code = editTeacherCode ? editTeacherCode.value.trim() : "";
  const password = editTeacherPassword ? editTeacherPassword.value.trim() : "";

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
    await updateTeacher(selectedTeacher.code, name, code, password);
    updateTeachersAdminTab();
    updateSystemInfoTab();
    window.allTeachers = allTeachers;
    initTeacherGrid(teacherGrid, showPasswordModal, allTeachers);
    showNotification(`Lehrer "${name}" wurde aktualisiert.`);
    if (editTeacherModal) editTeacherModal.style.display = "none";
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoader();
  }
}

function showDeleteTeacherConfirmation() {
  teacherToDelete = selectedTeacher;
  if (deleteTeacherName) deleteTeacherName.textContent = teacherToDelete.name;
  if (editTeacherModal) editTeacherModal.style.display = "none";
  if (confirmDeleteTeacherModal) confirmDeleteTeacherModal.style.display = "flex";
}

async function confirmDeleteTeacher() {
  if (!teacherToDelete) return;
  
  showLoader();
  
  try {
    await deleteTeacher(teacherToDelete.code);
    updateTeachersAdminTab();
    updateSystemInfoTab();
    window.allTeachers = allTeachers;
    initTeacherGrid(teacherGrid, showPasswordModal, allTeachers);
    showNotification(`Lehrer "${teacherToDelete.name}" wurde gelöscht.`);
    if (confirmDeleteTeacherModal) confirmDeleteTeacherModal.style.display = "none";
    teacherToDelete = null;
  } catch (error) {
    showNotification(error.message, "error");
  } finally {
    hideLoader();
  }
}

// === HILFSFUNKTIONEN ===

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function getYearFromDate(isoDateString) {
  return isoDateString.split("-")[0];
}
