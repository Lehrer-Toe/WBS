// Importieren Sie alle Module
import { initDatabase } from './database.js';
import { 
  DEFAULT_TEACHERS, 
  initTeacherGrid, 
  showPasswordModal, 
  login, 
  logout,
  getCurrentUser,
  setCurrentUser,
  getTeacherData,
  setTeacherData 
} from './auth.js';
import { 
  updateStudentsTab, 
  addNewStudent, 
  saveEditedStudent, 
  deleteStudent,
  ASSESSMENT_CATEGORIES
} from './students.js';
import { 
  populateAssessmentDateSelect, 
  updateAssessmentStudentList, 
  showAssessmentForm, 
  saveAssessment,
  showEditGradeModal,
  saveEditedGrade
} from './assessment.js';
import { 
  populateOverviewYearSelect, 
  populateOverviewDateSelect, 
  updateOverviewContent, 
  exportData 
} from './overview.js';
import {
  populateSettingsYearSelect,
  populateSettingsDateSelect,
  confirmDeleteAllData
} from './settings.js';
import { showNotification, showLoader, hideLoader, formatDate } from './utils.js';

// Warten auf geladenes Dokument
document.addEventListener("DOMContentLoaded", function() {
  console.log("WBS Bewertungssystem wird initialisiert...");
  // Hier wird der gesamte Initialisierungscode platziert
  
  // Supabase initialisieren und dann die App starten
  initDatabase()
    .then(() => {
      init();
    })
    .catch(error => {
      console.error("Fehler beim Initialisieren der Datenbank:", error);
      showNotification("Es gab Probleme beim Starten der Anwendung. Bitte laden Sie die Seite neu.", "error");
    });
});

// Hauptinitialisierungsfunktion
function init() {
  // DOM-Elemente
  setupDOMElements();
  
  // Event-Listener einrichten
  setupEventListeners();
  
  // Heutiges Datum als Standard für neue Prüflinge
  examDate.value = new Date().toISOString().split('T')[0];
  
  // Lehrer-Grid initialisieren
  initTeacherGrid(teacherGrid, handleShowPasswordModal);
  
  hideLoader();
  console.log("WBS Bewertungssystem erfolgreich initialisiert.");
}

// DOM-Elemente
let loginSection, appSection, teacherGrid, teacherAvatar, teacherName;
let passwordModal, passwordInput, loginPrompt, confirmLogin, cancelLogin, closePasswordModal, logoutBtn, mainLoader;
let newStudentName, examDate, addStudentBtn, studentsTable;
let assessmentDateSelect, assessmentStudentList, assessmentContent;
let overviewYearSelect, overviewDateSelect, overviewTable;
let settingsYearSelect, settingsDateSelect, exportDataBtn, deleteVerificationCode, deleteDataBtn;
let editStudentModal, closeEditStudentModal, editStudentName, editExamDate, saveStudentBtn, deleteStudentBtn;
let editGradeModal, closeEditGradeModal, editFinalGrade, saveGradeBtn;
let confirmDeleteModal, closeConfirmDeleteModal, deleteStudentName, cancelDeleteBtn, confirmDeleteBtn;
let tabs, tabContents;

// Hilfsvariablen
let selectedStudent = null;
let studentToDelete = null;
let selectedGradeStudent = null;

// DOM-Elemente einrichten
function setupDOMElements() {
  // Alle DOM-Elemente abrufen und in Variablen speichern
  loginSection = document.getElementById("loginSection");
  appSection = document.getElementById("appSection");
  teacherGrid = document.getElementById("teacherGrid");
  teacherAvatar = document.getElementById("teacherAvatar");
  teacherName = document.getElementById("teacherName");
  passwordModal = document.getElementById("passwordModal");
  passwordInput = document.getElementById("passwordInput");
  loginPrompt = document.getElementById("loginPrompt");
  confirmLogin = document.getElementById("confirmLogin");
  cancelLogin = document.getElementById("cancelLogin");
  closePasswordModal = document.getElementById("closePasswordModal");
  logoutBtn = document.getElementById("logoutBtn");
  mainLoader = document.getElementById("mainLoader");
  
  // Students tab elements
  newStudentName = document.getElementById("newStudentName");
  examDate = document.getElementById("examDate");
  addStudentBtn = document.getElementById("addStudentBtn");
  studentsTable = document.getElementById("studentsTable");
  
  // Assessment tab elements
  assessmentDateSelect = document.getElementById("assessmentDateSelect");
  assessmentStudentList = document.getElementById("assessmentStudentList");
  assessmentContent = document.getElementById("assessmentContent");
  
  // Overview tab elements
  overviewYearSelect = document.getElementById("overviewYearSelect");
  overviewDateSelect = document.getElementById("overviewDateSelect");
  overviewTable = document.getElementById("overviewTable");
  
  // Settings tab elements
  settingsYearSelect = document.getElementById("settingsYearSelect");
  settingsDateSelect = document.getElementById("settingsDateSelect");
  exportDataBtn = document.getElementById("exportDataBtn");
  deleteVerificationCode = document.getElementById("deleteVerificationCode");
  deleteDataBtn = document.getElementById("deleteDataBtn");
  
  // Modal elements
  editStudentModal = document.getElementById("editStudentModal");
  closeEditStudentModal = document.getElementById("closeEditStudentModal");
  editStudentName = document.getElementById("editStudentName");
  editExamDate = document.getElementById("editExamDate");
  saveStudentBtn = document.getElementById("saveStudentBtn");
  deleteStudentBtn = document.getElementById("deleteStudentBtn");
  
  editGradeModal = document.getElementById("editGradeModal");
  closeEditGradeModal = document.getElementById("closeEditGradeModal");
  editFinalGrade = document.getElementById("editFinalGrade");
  saveGradeBtn = document.getElementById("saveGradeBtn");
  
  confirmDeleteModal = document.getElementById("confirmDeleteModal");
  closeConfirmDeleteModal = document.getElementById("closeConfirmDeleteModal");
  deleteStudentName = document.getElementById("deleteStudentName");
  cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  
  // Tab elements
  tabs = document.querySelectorAll(".tab");
  tabContents = document.querySelectorAll(".tab-content");
}

// Event-Listener einrichten
function setupEventListeners() {
  // Login-Events
  closePasswordModal.addEventListener("click", () => {
    passwordModal.style.display = "none";
  });
  
  cancelLogin.addEventListener("click", () => {
    passwordModal.style.display = "none";
  });
  
  confirmLogin.addEventListener("click", handleLogin);
  
  passwordInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleLogin();
  });
  
  // Abmelden-Event
  logoutBtn.addEventListener("click", handleLogout);
  
  // Tab-Wechsel
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      
      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      
      tab.classList.add("active");
      document.getElementById(`${tabId}-tab`).classList.add("active");
      
      // Inhalt basierend auf Tab aktualisieren
      switch(tabId) {
        case 'students':
          handleUpdateStudentsTab();
          break;
        case 'assessment':
          handleUpdateAssessmentTab();
          break;
        case 'overview':
          handleUpdateOverviewTab();
          break;
        case 'settings':
          handleUpdateSettingsTab();
          break;
      }
    });
  });
  
  // Prüfling-hinzufügen-Button
  addStudentBtn.addEventListener("click", handleAddNewStudent);
  
  // Bewertungs-Datumsauswahl
  assessmentDateSelect.addEventListener("change", handleUpdateAssessmentStudentList);
  
  // Jahres- und Datumsauswahl für Übersicht
  overviewYearSelect.addEventListener("change", () => {
    handlePopulateOverviewDateSelect();
    handleUpdateOverviewContent();
  });
  
  overviewDateSelect.addEventListener("change", handleUpdateOverviewContent);
  
  // Jahres- und Datumsauswahl für Einstellungen
  settingsYearSelect.addEventListener("change", () => {
    handlePopulateSettingsDateSelect();
  });
  
  // Daten-exportieren-Button
  exportDataBtn.addEventListener("click", handleExportData);
  
  // Daten-löschen-Button
  deleteDataBtn.addEventListener("click", handleConfirmDeleteAllData);
  
  // Prüfling-bearbeiten-Modal-Events
  closeEditStudentModal.addEventListener("click", () => {
    editStudentModal.style.display = "none";
  });
  
  saveStudentBtn.addEventListener("click", handleSaveEditedStudent);
  deleteStudentBtn.addEventListener("click", handleShowDeleteConfirmation);
  
  // Noten-bearbeiten-Modal-Events
  closeEditGradeModal.addEventListener("click", () => {
    editGradeModal.style.display = "none";
  });
  
  saveGradeBtn.addEventListener("click", handleSaveEditedGrade);
  
  // Löschen-bestätigen-Modal-Events
  closeConfirmDeleteModal.addEventListener("click", () => {
    confirmDeleteModal.style.display = "none";
  });
  
  cancelDeleteBtn.addEventListener("click", () => {
    confirmDeleteModal.style.display = "none";
  });
  
  confirmDeleteBtn.addEventListener("click", handleDeleteStudent);
  
  // Benutzerdefinierte Event-Listener für editStudent-Event
  document.addEventListener('editStudent', (event) => {
    handleShowEditStudentModal(event.detail);
  });
}

// Event-Handler-Funktionen

// Passwort-Modal anzeigen
function handleShowPasswordModal(teacher) {
  showPasswordModal(teacher, passwordModal, loginPrompt, passwordInput, setCurrentUser);
}

// Anmelden
async function handleLogin() {
  await login(passwordInput, getCurrentUser(), 
           passwordModal, setTeacherData, loginSection, appSection, 
           teacherAvatar, teacherName, handleUpdateStudentsTab);
}

// Abmelden
function handleLogout() {
  logout(setCurrentUser, setTeacherData, loginSection, appSection);
}

// Prüflinge-Tab aktualisieren
function handleUpdateStudentsTab() {
  updateStudentsTab(studentsTable);
}

// Neuen Prüfling hinzufügen
async function handleAddNewStudent() {
  const name = newStudentName.value.trim();
  const date = examDate.value;
  
  const added = await addNewStudent(name, date, 
                                  handleUpdateStudentsTab, 
                                  handlePopulateAssessmentDateSelect);
  
  if (added) {
    // Eingabefelder leeren
    newStudentName.value = "";
    examDate.value = new Date().toISOString().split('T')[0];
  }
}

// Prüfling-bearbeiten-Modal anzeigen
function handleShowEditStudentModal(student) {
  editStudentName.value = student.name;
  editExamDate.value = student.examDate;
  selectedStudent = student;
  
  editStudentModal.style.display = "flex";
}

// Bearbeiteten Prüfling speichern
async function handleSaveEditedStudent() {
  const name = editStudentName.value.trim();
  const date = editExamDate.value;
  
  const saved = await saveEditedStudent(selectedStudent, name, date, 
                                      handleUpdateStudentsTab, 
                                      handlePopulateAssessmentDateSelect);
  
  if (saved) {
    editStudentModal.style.display = "none";
  }
}

// Löschen-Bestätigung anzeigen
function handleShowDeleteConfirmation() {
  studentToDelete = selectedStudent;
  deleteStudentName.textContent = selectedStudent.name;
  
  editStudentModal.style.display = "none";
  confirmDeleteModal.style.display = "flex";
}

// Prüfling löschen
async function handleDeleteStudent() {
  if (!studentToDelete) return;
  
  const deleted = await deleteStudent(studentToDelete, 
                                    handleUpdateStudentsTab, 
                                    handlePopulateAssessmentDateSelect, 
                                    handleUpdateOverviewTab);
  
  if (deleted) {
    confirmDeleteModal.style.display = "none";
    studentToDelete = null;
  }
}

// Bewertungs-Tab aktualisieren
function handleUpdateAssessmentTab() {
  handlePopulateAssessmentDateSelect();
  handleUpdateAssessmentStudentList();
}

// Bewertungs-Datumsauswahl befüllen
function handlePopulateAssessmentDateSelect() {
  populateAssessmentDateSelect(assessmentDateSelect);
}

// Bewertungs-Prüflingsliste aktualisieren
function handleUpdateAssessmentStudentList() {
  const selectedDate = assessmentDateSelect.value;
  updateAssessmentStudentList(selectedDate, assessmentStudentList, assessmentContent, handleShowAssessmentForm);
}

// Bewertungsformular anzeigen
function handleShowAssessmentForm(student) {
  selectedStudent = student;
  showAssessmentForm(student, assessmentContent, handleSaveAssessment, handleUpdateAssessmentStudentList);
}

// Bewertung speichern
async function handleSaveAssessment(student, category, value) {
  return await saveAssessment(student, category, value);
}

// Noten-bearbeiten-Modal anzeigen
function handleShowEditGradeModal(student) {
  selectedGradeStudent = showEditGradeModal(student, editGradeModal, editFinalGrade);
}

// Bearbeitete Note speichern
async function handleSaveEditedGrade() {
  const finalGradeValue = parseFloat(editFinalGrade.value);
  
  const saved = await saveEditedGrade(selectedGradeStudent, finalGradeValue,
                                   handleUpdateOverviewContent, 
                                   handleUpdateAssessmentStudentList);
  
  if (saved) {
    editGradeModal.style.display = "none";
    selectedGradeStudent = null;
  }
}

// Übersichts-Tab aktualisieren
function handleUpdateOverviewTab() {
  populateOverviewYearSelect(overviewYearSelect);
  handlePopulateOverviewDateSelect();
  handleUpdateOverviewContent();
}

// Übersichts-Datumsauswahl befüllen
function handlePopulateOverviewDateSelect() {
  const selectedYear = overviewYearSelect.value;
  populateOverviewDateSelect(selectedYear, overviewDateSelect);
}

// Übersichtsinhalt aktualisieren
function handleUpdateOverviewContent() {
  const selectedYear = overviewYearSelect.value;
  const selectedDate = overviewDateSelect.value;
  
  updateOverviewContent(selectedYear, selectedDate, overviewTable, handleShowEditGradeModal);
}

// Einstellungs-Tab aktualisieren
function handleUpdateSettingsTab() {
  populateSettingsYearSelect(settingsYearSelect);
  handlePopulateSettingsDateSelect();
}

// Einstellungs-Datumsauswahl befüllen
function handlePopulateSettingsDateSelect() {
  const selectedYear = settingsYearSelect.value;
  populateSettingsDateSelect(selectedYear, settingsDateSelect);
}

// Daten exportieren
function handleExportData() {
  const selectedYear = settingsYearSelect.value;
  const selectedDate = settingsDateSelect.value;
  
  exportData(selectedYear, selectedDate);
}

// Löschen aller Daten bestätigen
function handleConfirmDeleteAllData() {
  const verificationCode = deleteVerificationCode.value;
  
  confirmDeleteAllData(verificationCode, () => {
    // Rückruf-Funktion, die alle Tabs aktualisiert
    handleUpdateStudentsTab();
    handleUpdateAssessmentTab();
    handleUpdateOverviewTab();
    handleUpdateSettingsTab();
    
    // Bestätigungscode leeren
    deleteVerificationCode.value = "";
  });
}

// Alle Tabs aktualisieren
function updateAllTabs() {
  handleUpdateStudentsTab();
  handleUpdateAssessmentTab();
  handleUpdateOverviewTab();
  handleUpdateSettingsTab();
}