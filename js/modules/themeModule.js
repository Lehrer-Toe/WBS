// ==== FÜR js/modules/themeModule.js ====
// Ersetzen Sie die Imports am Anfang der Datei mit:

import { 
  showLoader, 
  hideLoader, 
  showNotification,
  formatDate,
  getDaysRemaining,
  formatRemainingDays,
  createStatusBadge,
  createStudentStatusBadge,
  createThemeProgressHTML,
  populateSchoolYearSelect,
  populateAssessmentTemplateSelect,
  populateTeacherSelect
} from "../uiService.js";
import {
  allThemes,
  loadAllThemes,
  createTheme,
  updateTheme,
  deleteTheme,
  addStudentToTheme,
  updateStudent,
  removeStudentFromTheme,
  updateStudentAssessment,
  calculateStudentAverage,
  filterThemes,
  getThemesForAssessment,
  getThemesCreatedByTeacher
} from "../themeService.js";
import { currentUser } from "../dataService.js";
import { allTeachers, systemSettings } from "../adminService.js";
import { assessmentTemplates } from "../assessmentService.js";
import { THEMES_CONFIG, STUDENT_STATUS, THEME_STATUS } from "../constants.js";

/**
 * Referenz auf die DOM-Elemente
 */
let elements = {
  // Tabs
  themesTab: null,
  assessmentTab: null,
  overviewTab: null,
  
  // Themen-Verwaltung
  themesContainer: null,
  themesList: null,
  newThemeBtn: null,
  themeFilterSelect: null,
  
  // Thema-Modal
  themeModal: null,
  themeModalTitle: null,
  themeForm: null,
  themeNameInput: null,
  themeDescriptionInput: null,
  themeDeadlineInput: null,
  themeSchoolYearSelect: null,
  themeTemplateSelect: null,
  saveThemeBtn: null,
  cancelThemeBtn: null,
  
  // Schüler-Verwaltung
  studentsContainer: null,
  studentsList: null,
  addStudentBtn: null,
  
  // Schüler-Modal
  studentModal: null,
  studentModalTitle: null,
  studentForm: null,
  studentNameInput: null,
  studentTeacherSelect: null,
  saveStudentBtn: null,
  cancelStudentBtn: null,
  
  // Bewertungs-Tab
  assessmentContainer: null,
  assessmentStudentList: null,
  assessmentContent: null,
  
  // Übersichts-Tab
  overviewContainer: null,
  overviewSchoolYearSelect: null,
  overviewStatusSelect: null,
  overviewTable: null,
  exportDataBtn: null
};

/**
 * Zustand für die Themen-/Schülerbearbeitung
 */
let selectedTheme = null;
let selectedStudent = null;
let editMode = false;
let currentSelectedStudentId = null;
let infoTextSaveTimer = null;

/**
 * Initialisiert das Themen-Modul
 */
export async function initThemeModule() {
  // DOM-Elemente abrufen
  loadDOMElements();
  
  // Event-Listener hinzufügen
  setupEventListeners();
  
  // Themen laden
  await loadAllThemes();
  
  // Wenn der Benutzer eingeloggt ist, aktualisiere die Ansicht
  document.addEventListener("userLoggedIn", (event) => {
    updateUI();
  });
}

/**
 * Lädt alle benötigten DOM-Elemente
 */
function loadDOMElements() {
  // Tabs
  elements.themesTab = document.getElementById("themes-tab");
  elements.assessmentTab = document.getElementById("assessment-tab");
  elements.overviewTab = document.getElementById("overview-tab");
  
  // Themen-Verwaltung
  elements.themesContainer = document.getElementById("themesContainer");
  elements.themesList = document.getElementById("themesList");
  elements.newThemeBtn = document.getElementById("newThemeBtn");
  elements.themeFilterSelect = document.getElementById("themeFilterSelect");
  
  // Thema-Modal
  elements.themeModal = document.getElementById("themeModal");
  elements.themeModalTitle = document.getElementById("themeModalTitle");
  elements.themeForm = document.getElementById("themeForm");
  elements.themeNameInput = document.getElementById("themeNameInput");
  elements.themeDescriptionInput = document.getElementById("themeDescriptionInput");
  elements.themeDeadlineInput = document.getElementById("themeDeadlineInput");
  elements.themeSchoolYearSelect = document.getElementById("themeSchoolYearSelect");
  elements.themeTemplateSelect = document.getElementById("themeTemplateSelect");
  elements.saveThemeBtn = document.getElementById("saveThemeBtn");
  elements.cancelThemeBtn = document.getElementById("cancelThemeBtn");
  
  // Schüler-Verwaltung
  elements.studentsContainer = document.getElementById("studentsContainer");
  elements.studentsList = document.getElementById("studentsList");
  elements.addStudentBtn = document.getElementById("addStudentBtn");
  
  // Schüler-Modal
  elements.studentModal = document.getElementById("studentModal");
  elements.studentModalTitle = document.getElementById("studentModalTitle");
  elements.studentForm = document.getElementById("studentForm");
  elements.studentNameInput = document.getElementById("studentNameInput");
  elements.studentTeacherSelect = document.getElementById("studentTeacherSelect");
  elements.saveStudentBtn = document.getElementById("saveStudentBtn");
  elements.cancelStudentBtn = document.getElementById("cancelStudentBtn");
  
  // Bewertungs-Tab
  elements.assessmentContainer = document.getElementById("assessmentContainer");
  elements.assessmentStudentList = document.getElementById("assessmentStudentList");
  elements.assessmentContent = document.getElementById("assessmentContent");
  
  // Übersichts-Tab
  elements.overviewContainer = document.getElementById("overviewContainer");
  elements.overviewSchoolYearSelect = document.getElementById("overviewSchoolYearSelect");
  elements.overviewStatusSelect = document.getElementById("overviewStatusSelect");
  elements.overviewTable = document.getElementById("overviewTable");
  elements.exportDataBtn = document.getElementById("exportDataBtn");
}

/**
 * Richtet die Event-Listener ein
 */
function setupEventListeners() {
  // Tab-Wechsel
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", function() {
      const tabId = this.dataset.tab;
      
      // Wenn der Tab gewechselt wird, aktualisiere die Ansicht
      if (tabId === "themes") {
        updateThemesTab();
      } else if (tabId === "assessment") {
        updateAssessmentTab();
      } else if (tabId === "overview") {
        updateOverviewTab();
      }
    });
  });
  
  // Neues Thema erstellen
  if (elements.newThemeBtn) {
    elements.newThemeBtn.addEventListener("click", showNewThemeModal);
  }
  
  // Themen filtern
  if (elements.themeFilterSelect) {
    elements.themeFilterSelect.addEventListener("change", updateThemesList);
  }
  
  // Thema-Modal
  if (elements.cancelThemeBtn) {
    elements.cancelThemeBtn.addEventListener("click", () => {
      elements.themeModal.style.display = "none";
    });
  }
  if (elements.themeForm) {
    elements.themeForm.addEventListener("submit", saveTheme);
  }
  
  // Schüler-Modal
  if (elements.cancelStudentBtn) {
    elements.cancelStudentBtn.addEventListener("click", () => {
      elements.studentModal.style.display = "none";
    });
  }
  if (elements.studentForm) {
    elements.studentForm.addEventListener("submit", saveStudent);
  }
  
  // Daten exportieren
  if (elements.exportDataBtn) {
    elements.exportDataBtn.addEventListener("click", exportData);
  }
}

/**
 * Aktualisiert die Benutzeroberfläche basierend auf den Berechtigungen
 */
function updateUI() {
  // Prüfen, ob der Benutzer Themen erstellen darf
  const canCreateThemes = currentUser.permissions && 
                         currentUser.permissions.canCreateThemes === true;
  
  // Neue-Thema-Button anzeigen/verstecken
  if (elements.newThemeBtn) {
    elements.newThemeBtn.style.display = canCreateThemes ? "block" : "none";
  }
  
  // Tabs aktualisieren
  updateThemesTab();
  updateAssessmentTab();
  updateOverviewTab();
}

/**
 * Aktualisiert den Themen-Tab
 */
function updateThemesTab() {
  if (!elements.themesTab) return;
  
  // Lade nur Themen, die der Benutzer erstellt hat
  const themes = getThemesCreatedByTeacher(currentUser.code);
  
  // Themen in der Liste anzeigen
  updateThemesList(themes);
}

/**
 * Aktualisiert die Themenliste
 */
function updateThemesList(themes = null) {
  if (!elements.themesList) return;
  
  // Wenn keine Themen übergeben wurden, hole alle für den aktuellen Benutzer
  if (!themes) {
    themes = getThemesCreatedByTeacher(currentUser.code);
  }
  
  // Filter anwenden, wenn ausgewählt
  if (elements.themeFilterSelect && elements.themeFilterSelect.value) {
    const filterValue = elements.themeFilterSelect.value;
    
    if (filterValue === "active") {
      themes = themes.filter(theme => theme.status === THEME_STATUS.ACTIVE);
    } else if (filterValue === "completed") {
      themes = themes.filter(theme => theme.status === THEME_STATUS.COMPLETED);
    } else if (filterValue === "overdue") {
      themes = themes.filter(theme => theme.status === THEME_STATUS.OVERDUE);
    }
  }
  
  // Liste leeren
  elements.themesList.innerHTML = "";
  
  // Wenn keine Themen vorhanden sind
  if (themes.length === 0) {
    elements.themesList.innerHTML = `
      <div class="empty-state">
        <p>Keine Themen gefunden</p>
        ${currentUser.permissions && currentUser.permissions.canCreateThemes ? 
          '<button id="emptyNewThemeBtn" class="btn-primary">Neues Thema erstellen</button>' : 
          '<p>Sie haben keine Berechtigung, um Themen zu erstellen.</p>'}
      </div>
    `;
    
    // Event-Listener für den Button in der Empty State
    const emptyNewThemeBtn = document.getElementById("emptyNewThemeBtn");
    if (emptyNewThemeBtn) {
      emptyNewThemeBtn.addEventListener("click", showNewThemeModal);
    }
    
    return;
  }
  
  // Themen sortieren (neueste zuerst)
  themes.sort((a, b) => {
    // Priorität: Überfällige Themen, dann aktive, dann abgeschlossene
    if (a.status !== b.status) {
      if (a.status === THEME_STATUS.OVERDUE) return -1;
      if (b.status === THEME_STATUS.OVERDUE) return 1;
      if (a.status === THEME_STATUS.ACTIVE) return -1;
      if (b.status === THEME_STATUS.ACTIVE) return 1;
    }
    
    // Nach Deadline sortieren
    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    } else if (a.deadline) {
      return -1;
    } else if (b.deadline) {
      return 1;
    }
    
    // Fallback: Nach Erstellungsdatum
    return new Date(b.created_at) - new Date(a.created_at);
  });
  
  // Themen in der Liste anzeigen
  themes.forEach(theme => {
    const themeCard = document.createElement("div");
    themeCard.className = `theme-card ${theme.status}`;
    themeCard.dataset.id = theme.id;
    
    // Fortschrittsbalken erstellen
    const progressHTML = createThemeProgressHTML(theme);
    
    // Deadline-Info
    let deadlineHTML = "";
    if (theme.deadline) {
      const daysRemaining = getDaysRemaining(theme.deadline);
      const { text, className } = formatRemainingDays(daysRemaining);
      
      deadlineHTML = `
        <div class="theme-deadline ${className}">
          <span class="deadline-icon">⏰</span>
          <span class="deadline-text">${text}</span>
          <span class="deadline-date">${formatDate(theme.deadline)}</span>
        </div>
      `;
    }
    
    themeCard.innerHTML = `
      <div class="theme-header">
        <h3 class="theme-title">${theme.title}</h3>
        ${createStatusBadge(theme.status)}
      </div>
      <div class="theme-description">
        ${theme.description || "Keine Beschreibung"}
      </div>
      ${deadlineHTML}
      <div class="theme-meta">
        <span class="theme-school-year">${theme.school_year || systemSettings.currentSchoolYear || ""}</span>
        <span class="theme-students-count">${theme.students ? theme.students.length : 0}/${THEMES_CONFIG.maxStudentsPerTheme} Schüler</span>
      </div>
      ${progressHTML}
      <div class="theme-actions">
        <button class="btn-edit" data-id="${theme.id}">Bearbeiten</button>
        <button class="btn-manage-students" data-id="${theme.id}">Schüler verwalten</button>
        <button class="btn-delete" data-id="${theme.id}">Löschen</button>
      </div>
    `;
    
    // Event-Listener für die Buttons
    themeCard.querySelector(".btn-edit").addEventListener("click", () => {
      showEditThemeModal(theme);
    });
    
    themeCard.querySelector(".btn-manage-students").addEventListener("click", () => {
      showStudentsManagement(theme);
    });
    
    themeCard.querySelector(".btn-delete").addEventListener("click", () => {
      confirmDeleteTheme(theme);
    });
    
    elements.themesList.appendChild(themeCard);
  });
}

/**
 * Zeigt den Modal für ein neues Thema
 */
function showNewThemeModal() {
  editMode = false;
  selectedTheme = null;
  
  // Modal-Titel setzen
  elements.themeModalTitle.textContent = "Neues Thema erstellen";
  
  // Formular zurücksetzen
  elements.themeForm.reset();
  
  // Standardwerte setzen
  const today = new Date();
  const twoWeeksLater = new Date(today);
  twoWeeksLater.setDate(today.getDate() + 14);
  
  elements.themeDeadlineInput.value = twoWeeksLater.toISOString().split('T')[0];
  
  // Schuljahr-Dropdown befüllen
  populateSchoolYearSelect(elements.themeSchoolYearSelect, systemSettings.currentSchoolYear);
  
  // Bewertungsraster-Dropdown befüllen
  populateAssessmentTemplateSelect(elements.themeTemplateSelect, "standard");
  
  // Modal anzeigen
  elements.themeModal.style.display = "flex";
}

/**
 * Zeigt den Modal zum Bearbeiten eines Themas
 */
function showEditThemeModal(theme) {
  editMode = true;
  selectedTheme = theme;
  
  // Modal-Titel setzen
  elements.themeModalTitle.textContent = "Thema bearbeiten";
  
  // Formular mit Daten füllen
  elements.themeNameInput.value = theme.title;
  elements.themeDescriptionInput.value = theme.description || "";
  elements.themeDeadlineInput.value = theme.deadline || "";
  
  // Schuljahr-Dropdown befüllen
  populateSchoolYearSelect(elements.themeSchoolYearSelect, theme.school_year || systemSettings.currentSchoolYear);
  
  // Bewertungsraster-Dropdown befüllen
  populateAssessmentTemplateSelect(elements.themeTemplateSelect, theme.assessment_template_id || "standard");
  
  // Modal anzeigen
  elements.themeModal.style.display = "flex";
}

/**
 * Speichert ein Thema (neu oder bearbeitet)
 */
async function saveTheme(event) {
  event.preventDefault();
  
  const title = elements.themeNameInput.value.trim();
  const description = elements.themeDescriptionInput.value.trim();
  const deadline = elements.themeDeadlineInput.value;
  const schoolYear = elements.themeSchoolYearSelect.value;
  const templateId = elements.themeTemplateSelect.value;
  
  if (!title) {
    showNotification("Bitte geben Sie einen Titel ein.", "warning");
    return;
  }
  
  showLoader();
  
  try {
    if (editMode && selectedTheme) {
      // Thema aktualisieren
      await updateTheme(selectedTheme.id, {
        title,
        description,
        deadline,
        school_year: schoolYear,
        assessment_template_id: templateId,
        updated_at: new Date().toISOString()
      });
      
      showNotification("Thema erfolgreich aktualisiert.");
    } else {
      // Neues Thema erstellen
      await createTheme({
        title,
        description,
        deadline,
        created_by: currentUser.code,
        school_year: schoolYear,
        assessment_template_id: templateId
      });
      
      showNotification("Thema erfolgreich erstellt.");
    }
    
    // Modal schließen
    elements.themeModal.style.display = "none";
    
    // Themenliste aktualisieren
    updateThemesList();
  } catch (error) {
    console.error("Fehler beim Speichern des Themas:", error);
    showNotification("Fehler beim Speichern des Themas: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

/**
 * Bestätigt das Löschen eines Themas
 */
function confirmDeleteTheme(theme) {
  if (confirm(`Möchten Sie das Thema "${theme.title}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
    deleteThemeConfirmed(theme.id);
  }
}

/**
 * Löscht ein Thema nach Bestätigung
 */
async function deleteThemeConfirmed(themeId) {
  showLoader();
  
  try {
    await deleteTheme(themeId);
    
    showNotification("Thema erfolgreich gelöscht.");
    
    // Themenliste aktualisieren
    updateThemesList();
  } catch (error) {
    console.error("Fehler beim Löschen des Themas:", error);
    showNotification("Fehler beim Löschen des Themas: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

/**
 * Zeigt die Schüler-Verwaltung für ein Thema
 */
function showStudentsManagement(theme) {
  selectedTheme = theme;
  
  // Studenten-Container anzeigen, Themen-Container ausblenden
  elements.themesContainer.style.display = "none";
  elements.studentsContainer.style.display = "block";
  
  // Überschrift aktualisieren
  const studentsHeading = document.querySelector("#studentsContainer h2");
  if (studentsHeading) {
    studentsHeading.textContent = `Schüler für Thema: ${theme.title}`;
  }
  
  // Zurück-Button hinzufügen, falls noch nicht vorhanden
  if (!document.getElementById("backToThemesBtn")) {
    const backBtn = document.createElement("button");
    backBtn.id = "backToThemesBtn";
    backBtn.className = "btn-secondary";
    backBtn.textContent = "Zurück zur Themenübersicht";
    backBtn.addEventListener("click", () => {
      elements.themesContainer.style.display = "block";
      elements.studentsContainer.style.display = "none";
    });
    
    // Button am Anfang des Containers einfügen
    elements.studentsContainer.insertBefore(backBtn, elements.studentsContainer.firstChild);
  }
  
  // Schüler-Liste aktualisieren
  updateStudentsList();
  
  // Add-Student-Button aktualisieren (deaktivieren, wenn Maximum erreicht)
  if (elements.addStudentBtn) {
    const maxReached = theme.students && theme.students.length >= THEMES_CONFIG.maxStudentsPerTheme;
    elements.addStudentBtn.disabled = maxReached;
    elements.addStudentBtn.title = maxReached ? 
      `Maximal ${THEMES_CONFIG.maxStudentsPerTheme} Schüler pro Thema erlaubt` : 
      "Neuen Schüler hinzufügen";
    
    // Event-Listener für den Add-Button
    elements.addStudentBtn.onclick = showNewStudentModal;
  }
}

/**
 * Aktualisiert die Schülerliste
 */
function updateStudentsList() {
  if (!elements.studentsList || !selectedTheme) return;
  
  // Liste leeren
  elements.studentsList.innerHTML = "";
  
  // Wenn keine Schüler vorhanden sind
  if (!selectedTheme.students || selectedTheme.students.length === 0) {
    elements.studentsList.innerHTML = `
      <div class="empty-state">
        <p>Keine Schüler für dieses Thema</p>
        <button id="emptyAddStudentBtn" class="btn-primary">Schüler hinzufügen</button>
      </div>
    `;
    
    // Event-Listener für den Button in der Empty State
    const emptyAddStudentBtn = document.getElementById("emptyAddStudentBtn");
    if (emptyAddStudentBtn) {
      emptyAddStudentBtn.addEventListener("click", showNewStudentModal);
    }
    
    return;
  }
  
  // Schüler sortieren (alphabetisch)
  const students = [...selectedTheme.students].sort((a, b) => a.name.localeCompare(b.name));
  
  // Schüler in der Liste anzeigen
  students.forEach(student => {
    const studentCard = document.createElement("div");
    studentCard.className = `student-card ${student.status}`;
    studentCard.dataset.id = student.id;
    
    // Lehrer-Info
    const assignedTeacher = allTeachers.find(t => t.code === student.assigned_teacher);
    const teacherName = assignedTeacher ? assignedTeacher.name : "Kein Lehrer zugewiesen";
    
    // Note (falls vorhanden)
    const grade = student.assessment && student.assessment.finalGrade ? 
      student.assessment.finalGrade : 
      (student.status === STUDENT_STATUS.COMPLETED ? "Bewertet" : "-");
    
    studentCard.innerHTML = `
      <div class="student-header">
        <h3 class="student-name">${student.name}</h3>
        ${createStudentStatusBadge(student.status)}
      </div>
      <div class="student-details">
        <div class="student-teacher">
          <span class="label">Prüfungslehrer:</span>
          <span class="value">${teacherName}</span>
        </div>
        <div class="student-grade">
          <span class="label">Note:</span>
          <span class="value grade-${Math.round(grade) || 0}">${grade}</span>
        </div>
      </div>
      <div class="student-actions">
        <button class="btn-edit" data-id="${student.id}">Bearbeiten</button>
        <button class="btn-delete" data-id="${student.id}">Entfernen</button>
      </div>
    `;
    
    // Event-Listener für die Buttons
    studentCard.querySelector(".btn-edit").addEventListener("click", () => {
      showEditStudentModal(student);
    });
    
    studentCard.querySelector(".btn-delete").addEventListener("click", () => {
      confirmRemoveStudent(student);
    });
    
    elements.studentsList.appendChild(studentCard);
  });
}

/**
 * Zeigt den Modal für einen neuen Schüler
 */
function showNewStudentModal() {
  editMode = false;
  selectedStudent = null;
  
  // Modal-Titel setzen
  elements.studentModalTitle.textContent = "Neuen Schüler hinzufügen";
  
  // Formular zurücksetzen
  elements.studentForm.reset();
  
  // Lehrer-Dropdown befüllen
  populateTeacherSelect(elements.studentTeacherSelect, allTeachers);
  
  // Modal anzeigen
  elements.studentModal.style.display = "flex";
}

/**
 * Zeigt den Modal zum Bearbeiten eines Schülers
 */
function showEditStudentModal(student) {
  editMode = true;
  selectedStudent = student;
  
  // Modal-Titel setzen
  elements.studentModalTitle.textContent = "Schüler bearbeiten";
  
  // Formular mit Daten füllen
  elements.studentNameInput.value = student.name;
  
  // Lehrer-Dropdown befüllen
  populateTeacherSelect(elements.studentTeacherSelect, allTeachers, student.assigned_teacher);
  
  // Modal anzeigen
  elements.studentModal.style.display = "flex";
}

/**
 * Speichert einen Schüler (neu oder bearbeitet)
 */
async function saveStudent(event) {
  event.preventDefault();
  
  if (!selectedTheme) {
    showNotification("Kein Thema ausgewählt.", "error");
    return;
  }
  
  const name = elements.studentNameInput.value.trim();
  const assignedTeacher = elements.studentTeacherSelect.value;
  
  if (!name) {
    showNotification("Bitte geben Sie einen Namen ein.", "warning");
    return;
  }
  
  if (!assignedTeacher) {
    showNotification("Bitte wählen Sie einen Prüfungslehrer aus.", "warning");
    return;
  }
  
  showLoader();
  
  try {
    if (editMode && selectedStudent) {
      // Schüler aktualisieren
      await updateStudent(selectedTheme.id, selectedStudent.id, {
        name,
        assigned_teacher: assignedTeacher
      });
      
      showNotification("Schüler erfolgreich aktualisiert.");
    } else {
      // Prüfen, ob Maximum erreicht ist
      if (selectedTheme.students && selectedTheme.students.length >= THEMES_CONFIG.maxStudentsPerTheme) {
        throw new Error(`Maximal ${THEMES_CONFIG.maxStudentsPerTheme} Schüler pro Thema erlaubt`);
      }
      
      // Neuen Schüler hinzufügen
      await addStudentToTheme(selectedTheme.id, {
        name,
        assigned_teacher: assignedTeacher
      });
      
      showNotification("Schüler erfolgreich hinzugefügt.");
    }
    
    // Modal schließen
    elements.studentModal.style.display = "none";
    
    // Schülerliste aktualisieren
    updateStudentsList();
  } catch (error) {
    console.error("Fehler beim Speichern des Schülers:", error);
    showNotification("Fehler beim Speichern des Schülers: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

/**
 * Bestätigt das Entfernen eines Schülers
 */
function confirmRemoveStudent(student) {
  if (confirm(`Möchten Sie den Schüler "${student.name}" wirklich entfernen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
    removeStudentConfirmed(selectedTheme.id, student.id);
  }
}

/**
 * Entfernt einen Schüler nach Bestätigung
 */
async function removeStudentConfirmed(themeId, studentId) {
  showLoader();
  
  try {
    await removeStudentFromTheme(themeId, studentId);
    
    showNotification("Schüler erfolgreich entfernt.");
    
    // Schülerliste aktualisieren
    updateStudentsList();
  } catch (error) {
    console.error("Fehler beim Entfernen des Schülers:", error);
    showNotification("Fehler beim Entfernen des Schülers: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

/**
 * Aktualisiert den Bewertungs-Tab
 */
function updateAssessmentTab() {
  if (!elements.assessmentTab) return;
  
  // Lade Themen, in denen der Benutzer als Prüfungslehrer eingetragen ist
  const themes = getThemesForAssessment(currentUser.code);
  
  // Studenten-Liste befüllen
  updateAssessmentStudentList(themes);
}

/**
 * Aktualisiert die Liste der zu bewertenden Schüler
 */
function updateAssessmentStudentList(themes) {
  if (!elements.assessmentStudentList) return;
  
  // Liste leeren
  elements.assessmentStudentList.innerHTML = "";
  
  // Wenn keine Themen vorhanden sind
  if (!themes || themes.length === 0) {
    elements.assessmentStudentList.innerHTML = `
      <div class="empty-state">
        <p>Sie sind derzeit keinem Schüler als Prüfungslehrer zugewiesen.</p>
      </div>
    `;
    
    // Auch den Inhalt leeren
    if (elements.assessmentContent) {
      elements.assessmentContent.innerHTML = `
        <div class="welcome-card">
          <h2>Bewertung von Schülern</h2>
          <p>Sie sind derzeit keinem Schüler als Prüfungslehrer zugewiesen.</p>
        </div>
      `;
    }
    
    return;
  }
  
  // Alle Schüler sammeln, die dem aktuellen Lehrer zugewiesen sind
  const students = [];
  
  themes.forEach(theme => {
    if (theme.students) {
      theme.students.forEach(student => {
        if (student.assigned_teacher === currentUser.code) {
          students.push({
            ...student,
            theme: {
              id: theme.id,
              title: theme.title,
              deadline: theme.deadline,
              assessment_template_id: theme.assessment_template_id
            }
          });
        }
      });
    }
  });
  
  // Wenn keine Schüler vorhanden sind
  if (students.length === 0) {
    elements.assessmentStudentList.innerHTML = `
      <div class="empty-state">
        <p>Sie sind derzeit keinem Schüler als Prüfungslehrer zugewiesen.</p>
      </div>
    `;
    
    // Auch den Inhalt leeren
    if (elements.assessmentContent) {
      elements.assessmentContent.innerHTML = `
        <div class="welcome-card">
          <h2>Bewertung von Schülern</h2>
          <p>Sie sind derzeit keinem Schüler als Prüfungslehrer zugewiesen.</p>
        </div>
      `;
    }
    
    return;
  }
  
  // Schüler sortieren (nach Status, dann alphabetisch)
  students.sort((a, b) => {
    // Priorität: Offen, In Bearbeitung, Abgeschlossen
    if (a.status !== b.status) {
      if (a.status === STUDENT_STATUS.PENDING) return -1;
      if (b.status === STUDENT_STATUS.PENDING) return 1;
      if (a.status === STUDENT_STATUS.IN_PROGRESS) return -1;
      if (b.status === STUDENT_STATUS.IN_PROGRESS) return 1;
    }
    
    // Alphabetisch nach Namen
    return a.name.localeCompare(b.name);
  });
  
  // Schüler in der Liste anzeigen
  students.forEach(student => {
    const li = document.createElement("li");
    li.className = `student-item ${student.status}`;
    li.dataset.themeId = student.theme.id;
    li.dataset.studentId = student.id;
    
    // Note (falls vorhanden)
    const grade = student.assessment && student.assessment.finalGrade ? 
      student.assessment.finalGrade : 
      "-";
    
    li.innerHTML = `
      <div class="student-info">
        <div class="student-name">${student.name}</div>
        <div class="student-theme">${student.theme.title}</div>
      </div>
      <div class="student-status">
        ${createStudentStatusBadge(student.status)}
        <div class="student-grade grade-${Math.round(grade) || 0}">${grade}</div>
      </div>
    `;
    
    // Event-Listener zum Anzeigen des Bewertungsformulars
    li.addEventListener("click", () => {
      document.querySelectorAll(".student-item").forEach(item => {
        item.classList.remove("active");
      });
      li.classList.add("active");
      
      currentSelectedStudentId = student.id;
      showAssessmentForm(student);
    });
    
    elements.assessmentStudentList.appendChild(li);
  });
  
  // Wenn noch kein Schüler ausgewählt ist, wähle den ersten aus
  if (!currentSelectedStudentId && students.length > 0) {
    elements.assessmentStudentList.querySelector(".student-item").click();
  } else if (currentSelectedStudentId) {
    // Wenn ein Schüler ausgewählt war, versuche ihn wieder auszuwählen
    const selectedItem = elements.assessmentStudentList.querySelector(`.student-item[data-student-id="${currentSelectedStudentId}"]`);
    if (selectedItem) {
      selectedItem.click();
    } else {
      // Wenn der Schüler nicht mehr existiert, wähle den ersten aus
      elements.assessmentStudentList.querySelector(".student-item")?.click();
    }
  }
}

/**
 * Zeigt das Bewertungsformular für einen Schüler
 */
async function showAssessmentForm(student) {
  if (!elements.assessmentContent) return;
  
  // Ladebalken anzeigen
  elements.assessmentContent.innerHTML = `
    <div class="loading-container">
      <div class="loading-spinner"></div>
      <p>Bewertungsformular wird geladen...</p>
    </div>
  `;
  
  try {
    // Template für das Bewertungsraster laden
    const templateId = student.theme.assessment_template_id || "standard";
    const template = assessmentTemplates.find(t => t.id === templateId);
    
    if (!template) {
      throw new Error("Bewertungsraster nicht gefunden");
    }
    
    // Bewertung abrufen
    const assessment = student.assessment || {};
    
    // Durchschnittsnote berechnen
    const avgGrade = await calculateStudentAverage(student.theme.id, student.id);
    const finalGrade = assessment.finalGrade || avgGrade || "-";
    const infoText = assessment.infoText || "";
    
    // HTML für das Formular erstellen
    let html = `
      <div class="assessment-container">
        <div class="student-header">
          <h2>${student.name}</h2>
          <p>Thema: ${student.theme.title}</p>
          ${student.theme.deadline ? `<p>Abgabefrist: ${formatDate(student.theme.deadline)}</p>` : ""}
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
    
    // Kategorie-Noten
    template.categories.forEach(category => {
      const grade = assessment[category.id] || 0;
      html += `
        <div class="assessment-category">
          <div class="category-header">
            <h3>${category.name}</h3>
            ${category.weight !== 1 ? `<span class="weight-badge">Gewichtung: ${category.weight}</span>` : ""}
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
    elements.assessmentContent.innerHTML = html;
    
    // Event-Listener für die Note-Buttons und weitere Aktionen
    setupAssessmentEventListeners(student);
    
  } catch (error) {
    console.error("Fehler beim Laden des Bewertungsformulars:", error);
    elements.assessmentContent.innerHTML = `
      <div class="error-state">
        <p>Fehler beim Laden des Bewertungsformulars: ${error.message}</p>
        <button id="retryBtn" class="btn-primary">Erneut versuchen</button>
      </div>
    `;
    
    // Event-Listener für den Retry-Button
    const retryBtn = document.getElementById("retryBtn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        showAssessmentForm(student);
      });
    }
  }
}

/**
 * Richtet die Event-Listener für das Bewertungsformular ein
 */
function setupAssessmentEventListeners(student) {
  // Note-Buttons
  document.querySelectorAll(".grade-buttons .grade-button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const categoryId = btn.parentElement.dataset.category;
      const gradeValue = parseFloat(btn.dataset.grade);
      
      // Button-Darstellung aktualisieren
      const buttons = btn.parentElement.querySelectorAll("button");
      buttons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      
      // Anzeige aktualisieren
      const gradeDisplay = btn.parentElement.previousElementSibling;
      gradeDisplay.textContent = gradeValue > 0 ? gradeValue.toFixed(1) : "-";
      
      // Bewertung speichern
      await saveAssessmentValue(student, categoryId, gradeValue);
    });
  });
  
  // Endnote speichern
  const saveFinalGradeBtn = document.getElementById("saveFinalGradeBtn");
  if (saveFinalGradeBtn) {
    saveFinalGradeBtn.addEventListener("click", async () => {
      const inputVal = parseFloat(document.getElementById("finalGrade").value);
      if (isNaN(inputVal) || inputVal < 1 || inputVal > 6) {
        showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
        return;
      }
      
      await saveAssessmentValue(student, "finalGrade", inputVal);
    });
  }
  
  // Durchschnitt als Endnote übernehmen
  const useAverageBtn = document.getElementById("useAverageBtn");
  if (useAverageBtn) {
    useAverageBtn.addEventListener("click", async () => {
      const avgGrade = await calculateStudentAverage(student.theme.id, student.id);
      if (!avgGrade) {
        showNotification("Es ist kein Durchschnitt vorhanden.", "warning");
        return;
      }
      
      document.getElementById("finalGrade").value = avgGrade;
      await saveAssessmentValue(student, "finalGrade", parseFloat(avgGrade));
    });
  }
  
  // Infos speichern
  const infoTextArea = document.getElementById("studentInfoText");
  if (infoTextArea) {
    infoTextArea.addEventListener("input", () => {
      infoTextArea.dataset.changed = "true";
    });
    
    setupInfoTextAutoSave(student);
  }
}

/**
 * Speichert einen Bewertungswert
 */
async function saveAssessmentValue(student, key, value) {
  showLoader();
  
  try {
    // Assessment-Objekt erstellen
    const assessment = {
      ...student.assessment
    };
    
    // Wert setzen
    assessment[key] = value;
    
    // Bewertung speichern
    await updateStudentAssessment(student.theme.id, student.id, assessment);
    
    // Wenn es sich um die Endnote handelt, aktualisiere die Anzeige in der Liste
    if (key === "finalGrade") {
      const listItem = document.querySelector(`.student-item[data-student-id="${student.id}"]`);
      if (listItem) {
        const gradeElement = listItem.querySelector(".student-grade");
        if (gradeElement) {
          gradeElement.textContent = value;
          gradeElement.className = `student-grade grade-${Math.round(value)}`;
        }
        
        // Status aktualisieren
        const statusElement = listItem.querySelector(".student-status");
        if (statusElement) {
          listItem.className = `student-item ${STUDENT_STATUS.COMPLETED} active`;
          statusElement.innerHTML = `
            ${createStudentStatusBadge(STUDENT_STATUS.COMPLETED)}
            <div class="student-grade grade-${Math.round(value)}">${value}</div>
          `;
        }
      }
    }
    
    // Durchschnitt neu berechnen
    const avgGrade = await calculateStudentAverage(student.theme.id, student.id);
    const avgDisplay = document.querySelector(".final-grade-display");
    if (avgDisplay) {
      avgDisplay.textContent = `Ø ${avgGrade || "0.0"}`;
    }
    
    showNotification("Bewertung gespeichert.");
  } catch (error) {
    console.error("Fehler beim Speichern der Bewertung:", error);
    showNotification("Fehler beim Speichern der Bewertung: " + error.message, "error");
  } finally {
    hideLoader();
  }
}

/**
 * Richtet die automatische Speicherung des Info-Texts ein
 */
function setupInfoTextAutoSave(student) {
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
  }
  
  infoTextSaveTimer = setInterval(async () => {
    const area = document.getElementById("studentInfoText");
    if (area && area.dataset.changed === "true") {
      const assessment = {
        ...student.assessment,
        infoText: area.value
      };
      
      try {
        await updateStudentAssessment(student.theme.id, student.id, assessment);
        area.dataset.changed = "false";
        
        // Visuelle Rückmeldung
        area.classList.add("save-flash");
        setTimeout(() => {
          area.classList.remove("save-flash");
        }, 1000);
      } catch (error) {
        console.error("Fehler beim Speichern des Info-Texts:", error);
      }
    }
  }, 60000); // Alle 60 Sekunden speichern
}

/**
 * Aktualisiert den Übersichts-Tab
 */
function updateOverviewTab() {
  if (!elements.overviewTab) return;
  
  // Schuljahr-Dropdown befüllen
  populateSchoolYearSelect(elements.overviewSchoolYearSelect);
  
  // Übersichtstabelle aktualisieren
  updateOverviewTable();
}

/**
 * Aktualisiert die Übersichtstabelle
 */
function updateOverviewTable() {
  if (!elements.overviewTable) return;
  
  const tbody = elements.overviewTable.querySelector("tbody");
  if (!tbody) return;
  
  // Tabelle leeren
  tbody.innerHTML = "";
  
  // Filter anwenden
  const schoolYear = elements.overviewSchoolYearSelect ? elements.overviewSchoolYearSelect.value : "";
  const status = elements.overviewStatusSelect ? elements.overviewStatusSelect.value : "";
  
  // Themen filtern
  let filteredThemes = [];
  
  if (currentUser.permissions && currentUser.permissions.canCreateThemes) {
    // Themen-Ersteller sieht seine Themen
    filteredThemes = getThemesCreatedByTeacher(currentUser.code);
  } else {
    // Normale Lehrer sehen Schüler, die ihnen zugewiesen sind
    filteredThemes = getThemesForAssessment(currentUser.code);
  }
  
  // Nach Schuljahr filtern
  if (schoolYear) {
    filteredThemes = filteredThemes.filter(theme => theme.school_year === schoolYear);
  }
  
  // Nach Status filtern
  if (status) {
    filteredThemes = filteredThemes.filter(theme => theme.status === status);
  }
  
  // Wenn keine Themen vorhanden sind
  if (filteredThemes.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">Keine Themen gefunden</td></tr>`;
    return;
  }
  
  // Themen sortieren (nach Status, dann nach Deadline)
  filteredThemes.sort((a, b) => {
    if (a.status !== b.status) {
      if (a.status === THEME_STATUS.OVERDUE) return -1;
      if (b.status === THEME_STATUS.OVERDUE) return 1;
      if (a.status === THEME_STATUS.ACTIVE) return -1;
      if (b.status === THEME_STATUS.ACTIVE) return 1;
    }
    
    if (a.deadline && b.deadline) {
      return new Date(a.deadline) - new Date(b.deadline);
    } else if (a.deadline) {
      return -1;
    } else if (b.deadline) {
      return 1;
    }
    
    return 0;
  });
  
  // Themen in der Tabelle anzeigen
  filteredThemes.forEach(theme => {
    const row = document.createElement("tr");
    row.className = theme.status;
    
    // Deadline-Info
    let deadlineText = "-";
    let deadlineClass = "";
    if (theme.deadline) {
      const daysRemaining = getDaysRemaining(theme.deadline);
      const { text, className } = formatRemainingDays(daysRemaining);
      deadlineText = `${formatDate(theme.deadline)}<br><span class="${className}">${text}</span>`;
      deadlineClass = className;
    }
    
    // Fortschritt berechnen
    const total = theme.students ? theme.students.length : 0;
    const completed = theme.students ? theme.students.filter(s => s.status === STUDENT_STATUS.COMPLETED).length : 0;
    const progressPercent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    row.innerHTML = `
      <td>${theme.title}</td>
      <td>${theme.school_year || systemSettings.currentSchoolYear || "-"}</td>
      <td class="${deadlineClass}">${deadlineText}</td>
      <td>${createStatusBadge(theme.status)}</td>
      <td>
        <div class="progress-bar-container" title="${completed}/${total} Schüler bewertet">
          <div class="progress-bar" style="width: ${progressPercent}%"></div>
          <span class="progress-text">${progressPercent}%</span>
        </div>
      </td>
      <td>
        <button class="btn-details" data-id="${theme.id}">Details</button>
      </td>
    `;
    
    // Event-Listener für den Details-Button
    row.querySelector(".btn-details").addEventListener("click", () => {
      showThemeDetails(theme);
    });
    
    tbody.appendChild(row);
  });
}

/**
 * Zeigt die Details eines Themas an
 */
function showThemeDetails(theme) {
  // Hier könnte ein Modal mit detaillierten Informationen zum Thema angezeigt werden
  alert(`Details für Thema "${theme.title}" werden noch implementiert.`);
}

/**
 * Exportiert die Daten
 */
function exportData() {
  // Filter anwenden
  const schoolYear = elements.overviewSchoolYearSelect ? elements.overviewSchoolYearSelect.value : "";
  const status = elements.overviewStatusSelect ? elements.overviewStatusSelect.value : "";
  
  // Themen filtern
  let filteredThemes = [];
  
  if (currentUser.permissions && currentUser.permissions.canCreateThemes) {
    // Themen-Ersteller sieht seine Themen
    filteredThemes = getThemesCreatedByTeacher(currentUser.code);
  } else {
    // Normale Lehrer sehen Schüler, die ihnen zugewiesen sind
    filteredThemes = getThemesForAssessment(currentUser.code);
  }
  
  // Nach Schuljahr filtern
  if (schoolYear) {
    filteredThemes = filteredThemes.filter(theme => theme.school_year === schoolYear);
  }
  
  // Nach Status filtern
  if (status) {
    filteredThemes = filteredThemes.filter(theme => theme.status === status);
  }
  
  // Exportformat JSON
  const exportData = {
    exportDate: new Date().toISOString(),
    teacher: {
      name: currentUser.name,
      code: currentUser.code
    },
    filters: {
      schoolYear,
      status
    },
    themes: filteredThemes
  };
  
  const jsonString = JSON.stringify(exportData, null, 2);
  
  // Download
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `WBS_Export_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  showNotification("Daten wurden exportiert.");
}
