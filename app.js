// Die neuen Bewertungskategorien
const ASSESSMENT_CATEGORIES = [
  { id: "presentation", name: "Präsentation" },
  { id: "content", name: "Inhalt" },
  { id: "language", name: "Sprache" },
  { id: "impression", name: "Eindruck" },
  { id: "examination", name: "Prüfung" },
  { id: "reflection", name: "Reflexion" },
  { id: "expertise", name: "Fachwissen" },
  { id: "documentation", name: "Dokumentation" }
];

// Globale Variablen
let supabaseClient = null;
let currentUser = null;
let teacherData = {
  students: [],
  assessments: {}
};
let selectedStudent = null;
let studentToDelete = null;
let selectedGradeStudent = null;
let infoTextSaveTimer = null;
let lastSelectedDate = null;
let lastSelectedTopic = null;

// Lokales Datum ermitteln
const today = new Date();
const defaultDate = today.getFullYear() + '-' + 
                  String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(today.getDate()).padStart(2, '0');

// Konstanten für Supabase (nur Beispiel, hier ohne Funktionszugriff)
const SUPABASE_URL = "https://mljhyhqlvllhgrzemsoh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samh5aHFsdmxsaGdyemVtc29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NjYwNjEsImV4cCI6MjA1OTM0MjA2MX0.L5H5e6Bx6yWM2ScHWIGJAL3JUDrFN4aJHUpjVxUDygA";

const DEFAULT_TEACHERS = [
  { name: "Kretz", code: "KRE", password: "Luna" },
  { name: "Riffel", code: "RIF", password: "Luna" },
  { name: "Töllner", code: "TOE", password: "Luna" }
];

// DOM-Elemente
const mainLoader = document.getElementById("mainLoader");
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

const newStudentName = document.getElementById("newStudentName");
const newStudentTopic = document.getElementById("newStudentTopic");
const examDate = document.getElementById("examDate");
const addStudentBtn = document.getElementById("addStudentBtn");
const studentsTable = document.getElementById("studentsTable");

const assessmentDateSelect = document.getElementById("assessmentDateSelect");
const assessmentTopicSelect = document.getElementById("assessmentTopicSelect");
const assessmentStudentList = document.getElementById("assessmentStudentList");
const assessmentContent = document.getElementById("assessmentContent");

const overviewYearSelect = document.getElementById("overviewYearSelect");
const overviewDateSelect = document.getElementById("overviewDateSelect");
const overviewTopicSelect = document.getElementById("overviewTopicSelect");
const overviewTable = document.getElementById("overviewTable");

const settingsYearSelect = document.getElementById("settingsYearSelect");
const settingsDateSelect = document.getElementById("settingsDateSelect");
const exportDataBtn = document.getElementById("exportDataBtn");
const deleteVerificationCode = document.getElementById("deleteVerificationCode");
const deleteDataBtn = document.getElementById("deleteDataBtn");

const editStudentModal = document.getElementById("editStudentModal");
const closeEditStudentModal = document.getElementById("closeEditStudentModal");
const editStudentName = document.getElementById("editStudentName");
const editStudentTopic = document.getElementById("editStudentTopic");
const editExamDate = document.getElementById("editExamDate");
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

// Wird aufgerufen, sobald das DOM geladen ist
document.addEventListener("DOMContentLoaded", function() {
  console.log("WBS Bewertungssystem wird initialisiert...");
  init();
});

/**
 * Initialisiert die Anwendung
 */
async function init() {
  if (examDate) {
    examDate.value = lastSelectedDate || defaultDate;
  }
  
  // Datenbank initialisieren
  await initDatabase();
  initTeacherGrid();
  setupEventListeners();
  hideLoader();
}

/**
 * Zeigt eine Benachrichtigung
 */
function showNotification(message, type = "success") {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Loader anzeigen
 */
function showLoader() {
  if (mainLoader) {
    mainLoader.style.display = "flex";
  }
}

/**
 * Loader verstecken
 */
function hideLoader() {
  if (mainLoader) {
    mainLoader.style.display = "none";
  }
}

/**
 * Datum formatieren (ISO -> DE)
 */
function formatDate(isoDateString) {
  if (!isoDateString) return '';
  const date = new Date(isoDateString + "T00:00:00");
  if (isNaN(date.getTime())) return isoDateString;
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function getYearFromDate(isoDateString) {
  return isoDateString.split('-')[0];
}

/**
 * Liefert alle verfügbaren Jahre
 */
function getAvailableYears() {
  const years = new Set();
  const currentYear = new Date().getFullYear();
  
  // Jahre vom aktuellen Jahr bis +10
  for (let i = 0; i <= 10; i++) {
    years.add((currentYear + i).toString());
  }
  
  // Auch vorhandene Jahre aus den Studentendaten
  teacherData.students.forEach(student => {
    years.add(getYearFromDate(student.examDate));
  });
  
  return Array.from(years).sort((a, b) => a - b).reverse();
}

/**
 * Liefert die verfügbaren Prüfungstage (Datumswerte) für ein Jahr
 */
function getAvailableDates(year = null) {
  const dates = new Set();
  teacherData.students.forEach(student => {
    if (!year || getYearFromDate(student.examDate) === year) {
      dates.add(student.examDate);
    }
  });
  return Array.from(dates).sort().reverse();
}

/**
 * Liefert die verfügbaren Themen
 */
function getAvailableTopics(selectedDate = null) {
  const topics = new Set();
  
  let filteredStudents = teacherData.students;
  if (selectedDate) {
    filteredStudents = filteredStudents.filter(s => s.examDate === selectedDate);
  }
  
  filteredStudents.forEach(student => {
    if (student.topic && student.topic.trim() !== '') {
      topics.add(student.topic);
    }
  });
  
  return Array.from(topics).sort();
}

/**
 * Erzeugt eine ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Datenbank initialisieren
 */
async function initDatabase() {
  try {
    showLoader();
    if (typeof supabase === 'undefined') {
      console.error("Supabase ist nicht definiert.");
      showNotification("Fehler: Supabase nicht verfügbar.", "error");
      hideLoader();
      return false;
    }
    
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: 'public' },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
      }
    });
    
    console.log("Supabase-Client erfolgreich initialisiert.");
    // Wenn Tabellen geprüft/erstellt werden müssen, hier tun...
    hideLoader();
    return true;
  } catch (error) {
    console.error("Fehler bei der DB-Initialisierung:", error);
    hideLoader();
    return false;
  }
}

/**
 * Daten des Lehrers laden
 */
async function loadTeacherData() {
  if (!currentUser) return false;
  
  try {
    const { data, error } = await supabaseClient
      .from('wbs_data')
      .select('*')
      .eq('teacher_code', currentUser.code)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Fehler beim Laden:", error);
      showNotification("Fehler beim Laden der Daten.", "error");
      return false;
    }
    
    if (data) {
      teacherData = data.data;
      migrateAssessmentCategories();
      return true;
    } else {
      // Noch keine Daten
      teacherData = { students: [], assessments: {} };
      return await saveTeacherData();
    }
  } catch (error) {
    console.error("Fehler in loadTeacherData:", error);
    showNotification("Fehler beim Laden der Daten.", "error");
    return false;
  }
}

/**
 * Daten des Lehrers speichern
 */
async function saveTeacherData() {
  if (!currentUser) return false;
  
  try {
    const { error } = await supabaseClient
      .from('wbs_data')
      .upsert({
        teacher_code: currentUser.code,
        teacher_name: currentUser.name,
        data: teacherData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'teacher_code' });
    
    if (error) {
      console.error("Fehler beim Speichern:", error);
      showNotification("Daten konnten nicht gespeichert werden.", "error");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Fehler in saveTeacherData:", error);
    showNotification("Fehler beim Speichern.", "error");
    return false;
  }
}

/**
 * Migrationsfunktion für Bewertungskategorien
 */
function migrateAssessmentCategories() {
  const categoryMapping = {
    'organization': 'presentation',
    'workBehavior': 'content',
    'teamwork': 'language',
    'quality': 'impression',
    'reflection': 'reflection',
    'documentation': 'documentation'
  };

  for (const studentId in teacherData.assessments) {
    const assessment = teacherData.assessments[studentId];
    
    for (const oldCat in categoryMapping) {
      if (assessment.hasOwnProperty(oldCat)) {
        const newCat = categoryMapping[oldCat];
        assessment[newCat] = assessment[oldCat];
        if (oldCat !== newCat) {
          delete assessment[oldCat];
        }
      }
    }
    
    // Neue Kategorien hinzufügen
    ASSESSMENT_CATEGORIES.forEach(category => {
      if (!assessment.hasOwnProperty(category.id)) {
        assessment[category.id] = 2;
      }
    });

    // Info-Text hinzufügen, falls nicht vorhanden
    if (!assessment.hasOwnProperty('infoText')) {
      assessment['infoText'] = '';
    }
  }
}

/**
 * Lehrer-Auswahl-Grid initialisieren (Login)
 */
function initTeacherGrid() {
  if (!teacherGrid) return;
  teacherGrid.innerHTML = "";
  
  DEFAULT_TEACHERS.forEach(teacher => {
    const card = document.createElement("div");
    card.className = "teacher-card";
    card.dataset.code = teacher.code;
    card.dataset.name = teacher.name;
    card.innerHTML = `
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50' y='60' font-family='Arial' font-size='30' text-anchor='middle' fill='%23666'%3E${teacher.code.charAt(0)}%3C/text%3E%3C/svg%3E" alt="${teacher.name}">
      <h3>${teacher.name}</h3>
    `;
    card.addEventListener("click", () => {
      showPasswordModal(teacher);
    });
    teacherGrid.appendChild(card);
  });
}

/**
 * Alle Event-Listener
 */
function setupEventListeners() {
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
      if (e.key === "Enter") login();
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
  
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove("active"));
      tabContents.forEach(c => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`${tabId}-tab`).classList.add("active");
      switch(tabId) {
        case 'students':   updateStudentsTab(); break;
        case 'assessment': updateAssessmentTab(); break;
        case 'overview':   updateOverviewTab(); break;
        case 'settings':   updateSettingsTab(); break;
      }
    });
  });
  
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", addNewStudent);
  }
  
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
  
  if (settingsYearSelect) {
    settingsYearSelect.addEventListener("change", populateSettingsDateSelect);
  }
  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", exportData);
  }
  if (deleteDataBtn) {
    deleteDataBtn.addEventListener("click", confirmDeleteAllData);
  }
  
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
  
  if (closeEditGradeModal) {
    closeEditGradeModal.addEventListener("click", () => {
      editGradeModal.style.display = "none";
    });
  }
  if (saveGradeBtn) {
    saveGradeBtn.addEventListener("click", saveEditedGrade);
  }
  
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

/**
 * Passwort-Dialog anzeigen
 */
function showPasswordModal(teacher) {
  loginPrompt.textContent = `Bitte geben Sie das Passwort für ${teacher.name} ein:`;
  passwordInput.value = "";
  passwordModal.style.display = "flex";
  passwordInput.focus();
  currentUser = {
    name: teacher.name,
    code: teacher.code,
    password: teacher.password
  };
}

/**
 * Login durchführen
 */
async function login() {
  if (passwordInput.value === currentUser.password) {
    passwordModal.style.display = "none";
    showLoader();
    await loadTeacherData();
    loginSection.style.display = "none";
    appSection.style.display = "block";
    teacherAvatar.textContent = currentUser.code.charAt(0);
    teacherName.textContent = currentUser.name;
    updateStudentsTab();
    hideLoader();
    showNotification(`Willkommen, ${currentUser.name}!`);
  } else {
    showNotification("Falsches Passwort!", "error");
  }
}

/**
 * Logout durchführen
 */
function logout() {
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
    infoTextSaveTimer = null;
  }
  currentUser = null;
  teacherData = { students: [], assessments: {} };
  loginSection.style.display = "block";
  appSection.style.display = "none";
  showNotification("Abgemeldet.");
}

/**
 * Durchschnitt berechnen
 */
function calculateAverageGrade(assessment) {
  if (!assessment) return null;
  let sum = 0;
  let count = 0;
  ASSESSMENT_CATEGORIES.forEach(category => {
    if (assessment[category.id] && assessment[category.id] > 0) {
      sum += assessment[category.id];
      count++;
    }
  });
  if (count === 0) return null;
  return (sum / count).toFixed(1);
}

/**
 * Schüler-Tab aktualisieren
 */
function updateStudentsTab() {
  if (!studentsTable) return;
  const tbody = studentsTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  if (teacherData.students.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="4">Keine Prüflinge vorhanden</td>';
    tbody.appendChild(tr);
    return;
  }
  
  const sortedStudents = [...teacherData.students].sort((a, b) => {
    return new Date(b.examDate) - new Date(a.examDate);
  });
  
  sortedStudents.forEach(student => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${formatDate(student.examDate)}</td>
      <td>${student.topic || '-'}</td>
      <td>
        <button class="edit-btn" data-id="${student.id}">✏️</button>
      </td>
    `;
    tr.querySelector('.edit-btn').addEventListener('click', () => {
      showEditStudentModal(student);
    });
    tbody.appendChild(tr);
  });
}

/**
 * Neuen Schüler hinzufügen
 */
async function addNewStudent() {
  try {
    const name = newStudentName.value.trim();
    const date = examDate.value;
    const topic = newStudentTopic ? newStudentTopic.value.trim() : '';
    
    lastSelectedDate = date;
    if (topic) {
      lastSelectedTopic = topic;
    }
    
    if (!name) {
      showNotification("Bitte einen Namen eingeben.", "warning");
      return;
    }
    const existingStudent = teacherData.students.find(s => 
      s.name.toLowerCase() === name.toLowerCase() && s.examDate === date
    );
    if (existingStudent) {
      showNotification(`Prüfling "${name}" existiert bereits an diesem Datum.`, "warning");
      return;
    }
    
    const newStudent = {
      id: generateId(),
      name: name,
      examDate: date,
      topic: topic,
      createdAt: new Date().toISOString()
    };
    
    showLoader();
    teacherData.students.push(newStudent);
    teacherData.assessments[newStudent.id] = {};
    
    ASSESSMENT_CATEGORIES.forEach(cat => {
      teacherData.assessments[newStudent.id][cat.id] = 2;
    });
    teacherData.assessments[newStudent.id].infoText = '';
    teacherData.assessments[newStudent.id].finalGrade = 2.0;
    
    const saved = await saveTeacherData();
    if (saved) {
      newStudentName.value = "";
      if (newStudentTopic) newStudentTopic.value = "";
      examDate.value = lastSelectedDate;
      updateStudentsTab();
      populateAssessmentDateSelect();
      populateAssessmentTopicSelect();
      showNotification(`Prüfling "${name}" hinzugefügt.`);
    }
  } catch (error) {
    console.error("Fehler beim Hinzufügen:", error);
    showNotification("Fehler beim Hinzufügen.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Bearbeitungsmodal anzeigen
 */
function showEditStudentModal(student) {
  editStudentName.value = student.name;
  editExamDate.value = student.examDate;
  if (editStudentTopic) {
    editStudentTopic.value = student.topic || '';
  }
  selectedStudent = student;
  editStudentModal.style.display = "flex";
}

/**
 * Änderungen am Schüler speichern
 */
async function saveEditedStudent() {
  try {
    const name = editStudentName.value.trim();
    const date = editExamDate.value;
    const topic = editStudentTopic ? editStudentTopic.value.trim() : '';
    
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
    
    const existingStudent = teacherData.students.find(s => 
      s.id !== selectedStudent.id &&
      s.name.toLowerCase() === name.toLowerCase() &&
      s.examDate === date
    );
    if (existingStudent) {
      showNotification(`Prüfling "${name}" existiert bereits an diesem Datum.`, "warning");
      return;
    }
    
    showLoader();
    const index = teacherData.students.findIndex(s => s.id === selectedStudent.id);
    if (index !== -1) {
      teacherData.students[index].name = name;
      teacherData.students[index].examDate = date;
      teacherData.students[index].topic = topic;
      const saved = await saveTeacherData();
      if (saved) {
        updateStudentsTab();
        populateAssessmentDateSelect();
        populateAssessmentTopicSelect();
        showNotification(`Prüfling "${name}" wurde aktualisiert.`);
        editStudentModal.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
    showNotification("Fehler beim Speichern.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Bestätigungsmodal zum Löschen eines Schülers anzeigen
 */
function showDeleteConfirmation() {
  studentToDelete = selectedStudent;
  deleteStudentName.textContent = selectedStudent.name;
  editStudentModal.style.display = "none";
  confirmDeleteModal.style.display = "flex";
}

/**
 * Löscht einen Schüler
 */
async function deleteStudent() {
  try {
    if (!studentToDelete) return;
    showLoader();
    teacherData.students = teacherData.students.filter(s => s.id !== studentToDelete.id);
    delete teacherData.assessments[studentToDelete.id];
    
    const saved = await saveTeacherData();
    if (saved) {
      updateStudentsTab();
      populateAssessmentDateSelect();
      populateAssessmentTopicSelect();
      updateOverviewTab();
      showNotification(`Prüfling "${studentToDelete.name}" gelöscht.`);
      confirmDeleteModal.style.display = "none";
      studentToDelete = null;
    }
  } catch (error) {
    console.error("Fehler beim Löschen:", error);
    showNotification("Fehler beim Löschen.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Bewertungs-Tab aktualisieren
 */
function updateAssessmentTab() {
  populateAssessmentDateSelect();
  populateAssessmentTopicSelect();
  updateAssessmentStudentList();
}

/**
 * Datum-Dropdown im Bewertungs-Tab füllen
 */
function populateAssessmentDateSelect() {
  if (!assessmentDateSelect) return;
  const dates = getAvailableDates();
  assessmentDateSelect.innerHTML = '<option value="">Alle Termine</option>';
  
  if (dates.length === 0) return;
  
  let defaultDateValue = null;
  if (lastSelectedDate && dates.includes(lastSelectedDate)) {
    defaultDateValue = lastSelectedDate;
  } else if (dates.includes(defaultDate)) {
    defaultDateValue = defaultDate;
  } else {
    defaultDateValue = dates[0];
  }
  
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    if (date === defaultDateValue) {
      option.selected = true;
    }
    assessmentDateSelect.appendChild(option);
  });
  
  if (assessmentDateSelect.value) {
    lastSelectedDate = assessmentDateSelect.value;
  }
}

/**
 * Themen-Dropdown im Bewertungs-Tab füllen
 */
function populateAssessmentTopicSelect() {
  if (!assessmentTopicSelect) return;
  const selectedDate = assessmentDateSelect.value;
  const topics = getAvailableTopics(selectedDate);
  assessmentTopicSelect.innerHTML = '<option value="">Alle Themen</option>';
  
  if (topics.length === 0) return;
  
  let defaultTopicValue = null;
  if (lastSelectedTopic && topics.includes(lastSelectedTopic)) {
    defaultTopicValue = lastSelectedTopic;
  }
  
  topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic;
    option.textContent = topic;
    if (topic === defaultTopicValue) {
      option.selected = true;
    }
    assessmentTopicSelect.appendChild(option);
  });
  
  if (assessmentTopicSelect.value) {
    lastSelectedTopic = assessmentTopicSelect.value;
  }
}

/**
 * Liste der Prüflinge im Bewertungs-Tab aktualisieren
 */
function updateAssessmentStudentList() {
  if (!assessmentStudentList || !assessmentContent) return;
  
  const selectedDate = assessmentDateSelect.value;
  const selectedTopic = assessmentTopicSelect.value;
  assessmentStudentList.innerHTML = '';
  
  if (!selectedDate && !selectedTopic) {
    assessmentStudentList.innerHTML = '<li>Bitte Datum oder Thema auswählen</li>';
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Willkommen bei der WBS Bewertungsapp</h2>
        <p>Bitte einen Prüfungstag oder ein Thema und anschließend einen Prüfling aus der Liste wählen.</p>
      </div>
    `;
    return;
  }
  
  let studentsFiltered = teacherData.students;
  if (selectedDate) {
    studentsFiltered = studentsFiltered.filter(s => s.examDate === selectedDate);
  }
  if (selectedTopic) {
    studentsFiltered = studentsFiltered.filter(s => s.topic === selectedTopic);
  }
  
  if (studentsFiltered.length === 0) {
    assessmentStudentList.innerHTML = '<li>Keine Prüflinge gefunden</li>';
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Keine Prüflinge gefunden</h2>
        <p>Es wurden keine Prüflinge zu diesem Datum/Thema gefunden.</p>
      </div>
    `;
    return;
  }
  
  // Sortierung: neuestes Datum zuerst, dann Name
  studentsFiltered.sort((a, b) => {
    const dateComp = new Date(b.examDate) - new Date(a.examDate);
    if (dateComp !== 0) return dateComp;
    return a.name.localeCompare(b.name);
  });
  
  studentsFiltered.forEach(student => {
    const li = document.createElement('li');
    li.className = 'student-item';
    li.dataset.id = student.id;
    const assessment = teacherData.assessments[student.id] || {};
    const finalGrade = assessment.finalGrade || '-';
    li.innerHTML = `
      <div class="student-name">${student.name}${student.topic ? ` (${student.topic})` : ''}</div>
      <div class="average-grade grade-${Math.floor(finalGrade)}">${finalGrade}</div>
    `;
    
    li.addEventListener('click', () => {
      document.querySelectorAll('.student-item').forEach(item => {
        item.classList.remove('active');
      });
      li.classList.add('active');
      showAssessmentForm(student);
    });
    
    assessmentStudentList.appendChild(li);
  });
  
  // Automatisch ersten Eintrag auswählen
  const firstStudent = document.querySelector('.student-item');
  if (firstStudent && !document.querySelector('.student-item.active')) {
    firstStudent.click();
  }
}

/**
 * Bewertungs-Form anzeigen
 */
function showAssessmentForm(student) {
  selectedStudent = student;
  const assessment = teacherData.assessments[student.id] || {};
  const avgGrade = calculateAverageGrade(assessment);
  const finalGrade = assessment.finalGrade || avgGrade || '-';
  const infoText = assessment.infoText || '';
  
  let html = `
    <div class="assessment-container">
      <div class="student-header">
        <h2>${student.name}</h2>
        <p>Prüfungsdatum: ${formatDate(student.examDate)}</p>
        ${student.topic ? `<p>Thema: ${student.topic}</p>` : ''}
      </div>
      
      <div class="info-text-container">
        <h3>Informationen zum Prüfling</h3>
        <textarea id="studentInfoText" rows="6" placeholder="Notizen eingeben...">${infoText}</textarea>
      </div>
      
      <div class="final-grade-display">Ø ${avgGrade || '0.0'}</div>
      
      <div class="final-grade-input">
        <label for="finalGrade">Endnote:</label>
        <input type="number" id="finalGrade" min="1" max="6" step="0.5" value="${finalGrade !== '-' ? finalGrade : ''}">
        <button id="saveFinalGradeBtn">Speichern</button>
        <button id="useAverageBtn">Durchschnitt übernehmen</button>
      </div>
  `;
  
  // Alle Bewertungskategorien + Buttons
  ASSESSMENT_CATEGORIES.forEach(category => {
    const grade = assessment[category.id] || 0;
    html += `
      <div class="assessment-category">
        <div class="category-header">
          <h3>${category.name}</h3>
        </div>
        <div class="category-grade">${grade > 0 ? grade.toFixed(1) : '-'}</div>
        <div class="grade-buttons" data-category="${category.id}">
    `;
    
    // Buttons für 1.0 bis 6.0 in 0.5er-Schritten
    for (let i = 1; i <= 6; i++) {
      for (let decimal = 0; decimal <= 0.5; decimal += 0.5) {
        const currentGrade = i + decimal;
        const isSelected = grade === currentGrade;
        html += `
          <button class="grade-button grade-${Math.floor(currentGrade)} ${isSelected ? 'selected' : ''}" data-grade="${currentGrade}">
            ${currentGrade.toFixed(1)}
          </button>
        `;
      }
    }
    
    // Button für 0 (keine Bewertung)
    const isZeroSelected = grade === 0;
    html += `
          <button class="grade-button grade-0 ${isZeroSelected ? 'selected' : ''}" data-grade="0">-</button>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  assessmentContent.innerHTML = html;
  
  document.querySelectorAll(".grade-buttons .grade-button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const categoryId = btn.parentElement.dataset.category;
      const gradeValue = parseFloat(btn.dataset.grade);
      const buttons = btn.parentElement.querySelectorAll("button");
      buttons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      
      const gradeDisplay = btn.parentElement.previousElementSibling;
      gradeDisplay.textContent = gradeValue > 0 ? gradeValue.toFixed(1) : '-';
      
      if (!teacherData.assessments[student.id]) {
        teacherData.assessments[student.id] = {};
      }
      teacherData.assessments[student.id][categoryId] = gradeValue;
      
      const newAvg = calculateAverageGrade(teacherData.assessments[student.id]);
      document.querySelector(".final-grade-display").textContent = `Ø ${newAvg || '0.0'}`;
      
      if (!teacherData.assessments[student.id].finalGrade) {
        teacherData.assessments[student.id].finalGrade = parseFloat(newAvg);
        const fgInput = document.getElementById("finalGrade");
        if (fgInput && newAvg) fgInput.value = newAvg;
      }
      
      try {
        await saveTeacherData();
        updateAssessmentStudentList();
      } catch (error) {
        console.error("Fehler beim Speichern:", error);
        showNotification("Fehler beim Speichern der Note.", "error");
      }
    });
  });
  
  // Endnote speichern
  const saveFinalGradeBtn = document.getElementById("saveFinalGradeBtn");
  if (saveFinalGradeBtn) {
    saveFinalGradeBtn.addEventListener("click", async () => {
      const finalGradeInput = document.getElementById("finalGrade");
      const finalGradeValue = parseFloat(finalGradeInput.value);
      if (isNaN(finalGradeValue) || finalGradeValue < 1 || finalGradeValue > 6) {
        showNotification("Bitte eine gültige Note (1.0 bis 6.0) eingeben.", "warning");
        return;
      }
      try {
        teacherData.assessments[student.id].finalGrade = finalGradeValue;
        await saveTeacherData();
        updateAssessmentStudentList();
        showNotification("Endnote gespeichert.");
      } catch (error) {
        console.error("Fehler beim Speichern:", error);
        showNotification("Fehler beim Speichern der Endnote.", "error");
      }
    });
  }
  
  // Durchschnitt übernehmen
  const useAverageBtn = document.getElementById("useAverageBtn");
  if (useAverageBtn) {
    useAverageBtn.addEventListener("click", async () => {
      const avgGrade = calculateAverageGrade(teacherData.assessments[student.id]);
      if (!avgGrade) {
        showNotification("Es ist kein Durchschnitt vorhanden.", "warning");
        return;
      }
      try {
        document.getElementById("finalGrade").value = avgGrade;
        teacherData.assessments[student.id].finalGrade = parseFloat(avgGrade);
        await saveTeacherData();
        updateAssessmentStudentList();
        showNotification("Durchschnitt als Endnote übernommen.");
      } catch (error) {
        console.error("Fehler beim Speichern:", error);
        showNotification("Fehler beim Speichern der Endnote.", "error");
      }
    });
  }
  
  // Autosave-Timer für Info-Text starten
  setupInfoTextAutoSave(student.id);
}

/**
 * Autosave für Info-Text
 */
function setupInfoTextAutoSave(studentId) {
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
  }
  const infoTextArea = document.getElementById("studentInfoText");
  if (!infoTextArea) return;
  
  infoTextArea.addEventListener("input", () => {
    infoTextArea.dataset.changed = "true";
  });
  
  infoTextSaveTimer = setInterval(async () => {
    if (infoTextArea.dataset.changed === "true") {
      const infoText = infoTextArea.value;
      if (teacherData.assessments[studentId]) {
        teacherData.assessments[studentId].infoText = infoText;
        await saveTeacherData();
        infoTextArea.dataset.changed = "false";
        showNotification("Informationstext wurde automatisch gespeichert.");
        infoTextArea.classList.add('save-flash');
        setTimeout(() => {
          infoTextArea.classList.remove('save-flash');
        }, 1000);
      }
    }
  }, 60000); // alle 60s
}

/**
 * Übersicht-Tab
 */
function updateOverviewTab() {
  populateOverviewYearSelect();
  populateOverviewDateSelect();
  populateOverviewTopicSelect();
  updateOverviewContent();
}

/**
 * Jahr-Dropdown in der Übersicht
 */
function populateOverviewYearSelect() {
  if (!overviewYearSelect) return;
  const years = getAvailableYears();
  overviewYearSelect.innerHTML = '<option value="">Alle Jahre</option>';
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    overviewYearSelect.appendChild(option);
  });
}

/**
 * Datum-Dropdown in der Übersicht
 */
function populateOverviewDateSelect() {
  if (!overviewDateSelect) return;
  const selectedYear = overviewYearSelect.value;
  const dates = getAvailableDates(selectedYear);
  overviewDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    overviewDateSelect.appendChild(option);
  });
}

/**
 * Themen-Dropdown in der Übersicht
 */
function populateOverviewTopicSelect() {
  if (!overviewTopicSelect) return;
  const selectedDate = overviewDateSelect.value;
  const topics = getAvailableTopics(selectedDate);
  overviewTopicSelect.innerHTML = '<option value="">Alle Themen</option>';
  topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic;
    option.textContent = topic;
    overviewTopicSelect.appendChild(option);
  });
}

/**
 * Übersichtstabelle aktualisieren
 */
function updateOverviewContent() {
  if (!overviewTable) return;
  const tbody = overviewTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  const selectedYear = overviewYearSelect.value;
  const selectedDate = overviewDateSelect.value;
  const selectedTopic = overviewTopicSelect.value;
  
  let filteredStudents = teacherData.students;
  if (selectedYear) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === selectedYear);
  }
  if (selectedDate) {
    filteredStudents = filteredStudents.filter(s => s.examDate === selectedDate);
  }
  if (selectedTopic) {
    filteredStudents = filteredStudents.filter(s => s.topic === selectedTopic);
  }
  
  if (filteredStudents.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="13">Keine Prüflinge gefunden</td>';
    tbody.appendChild(tr);
    return;
  }
  
  filteredStudents.sort((a, b) => new Date(a.examDate) - new Date(b.examDate) || a.name.localeCompare(b.name));
  
  filteredStudents.forEach(student => {
    const assessment = teacherData.assessments[student.id] || {};
    const row = document.createElement('tr');
    
    row.innerHTML = `
      <td>${student.name}</td>
      <td>${formatDate(student.examDate)}</td>
      <td>${student.topic || '-'}</td>
      <td>${assessment.presentation || '-'}</td>
      <td>${assessment.content || '-'}</td>
      <td>${assessment.language || '-'}</td>
      <td>${assessment.impression || '-'}</td>
      <td>${assessment.examination || '-'}</td>
      <td>${assessment.reflection || '-'}</td>
      <td>${assessment.expertise || '-'}</td>
      <td>${assessment.documentation || '-'}</td>
      <td>${assessment.finalGrade || '-'}</td>
      <td><button class="edit-btn" data-id="${student.id}">✏️</button></td>
    `;
    
    row.querySelector(".edit-btn").addEventListener("click", () => {
      openEditGradeModal(student);
    });
    
    tbody.appendChild(row);
  });
}

/**
 * Modal zum Bearbeiten der Endnote öffnen
 */
function openEditGradeModal(student) {
  selectedGradeStudent = student;
  const assessment = teacherData.assessments[student.id] || {};
  editFinalGrade.value = assessment.finalGrade || '';
  editGradeModal.style.display = "flex";
}

/**
 * Note speichern (Modal)
 */
async function saveEditedGrade() {
  if (!selectedGradeStudent) return;
  try {
    const finalGradeValue = parseFloat(editFinalGrade.value);
    if (isNaN(finalGradeValue) || finalGradeValue < 1 || finalGradeValue > 6) {
      showNotification("Gültige Note (1.0-6.0) eingeben.", "warning");
      return;
    }
    teacherData.assessments[selectedGradeStudent.id].finalGrade = finalGradeValue;
    showLoader();
    const saved = await saveTeacherData();
    if (saved) {
      editGradeModal.style.display = "none";
      updateAssessmentStudentList();
      updateOverviewContent();
      showNotification("Endnote aktualisiert.");
    }
  } catch (error) {
    console.error("Fehler beim Speichern der Endnote:", error);
    showNotification("Fehler beim Speichern der Endnote.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Einstellungen-Tab aktualisieren
 */
function updateSettingsTab() {
  populateSettingsYearSelect();
  populateSettingsDateSelect();
}

/**
 * Jahr-Dropdown in den Einstellungen
 */
function populateSettingsYearSelect() {
  if (!settingsYearSelect) return;
  const years = getAvailableYears();
  settingsYearSelect.innerHTML = '<option value="">Alle Jahre</option>';
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    settingsYearSelect.appendChild(option);
  });
}

/**
 * Datum-Dropdown in den Einstellungen
 */
function populateSettingsDateSelect() {
  if (!settingsDateSelect) return;
  const selectedYear = settingsYearSelect.value;
  const dates = getAvailableDates(selectedYear);
  settingsDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    settingsDateSelect.appendChild(option);
  });
}

/**
 * Daten exportieren
 */
function exportData() {
  const selectedYear = settingsYearSelect.value;
  const selectedDate = settingsDateSelect.value;
  
  let filteredStudents = teacherData.students;
  if (selectedYear) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === selectedYear);
  }
  if (selectedDate) {
    filteredStudents = filteredStudents.filter(s => s.examDate === selectedDate);
  }
  
  const exportFormatTXT = document.getElementById("exportTXT").checked;
  
  const outputData = filteredStudents.map(student => {
    const assessment = teacherData.assessments[student.id] || {};
    return {
      name: student.name,
      date: student.examDate,
      topic: student.topic,
      grades: {
        presentation: assessment.presentation,
        content: assessment.content,
        language: assessment.language,
        impression: assessment.impression,
        examination: assessment.examination,
        reflection: assessment.reflection,
        expertise: assessment.expertise,
        documentation: assessment.documentation,
      },
      finalGrade: assessment.finalGrade,
      infoText: assessment.infoText
    };
  });
  
  if (exportFormatTXT) {
    let txtContent = "Ergebnisse:\n\n";
    outputData.forEach(item => {
      txtContent += `Name: ${item.name}\n`;
      txtContent += `Datum: ${formatDate(item.date)}\n`;
      txtContent += `Thema: ${item.topic || '-'}\n`;
      txtContent += `Endnote: ${item.finalGrade || '-'}\n`;
      txtContent += `Info: ${item.infoText}\n`;
      txtContent += "----------------------------------------\n";
    });
    downloadFile(txtContent, "ergebnisse.txt", "text/plain");
  } else {
    // JSON
    const jsonContent = JSON.stringify(outputData, null, 2);
    downloadFile(jsonContent, "ergebnisse.json", "application/json");
  }
}

/**
 * Datei herunterladen
 */
function downloadFile(content, fileName, contentType) {
  const a = document.createElement("a");
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}

/**
 * Löschen aller Daten bestätigen
 */
function confirmDeleteAllData() {
  const code = deleteVerificationCode.value.trim();
  if (!currentUser || code !== currentUser.code) {
    showNotification("Falsches Lehrerkürzel.", "error");
    return;
  }
  
  if (!confirm("Alle Daten löschen? Diese Aktion ist endgültig.")) {
    return;
  }
  
  deleteAllData();
}

/**
 * Alle Daten löschen
 */
async function deleteAllData() {
  if (!currentUser) return;
  
  try {
    showLoader();
    const { error } = await supabaseClient
      .from('wbs_data')
      .delete()
      .eq('teacher_code', currentUser.code);
    
    if (error) {
      console.error("Fehler beim Löschen:", error);
      showNotification("Fehler beim Löschen der Daten.", "error");
    } else {
      teacherData = { students: [], assessments: {} };
      updateStudentsTab();
      updateAssessmentTab();
      updateOverviewTab();
      showNotification("Alle Daten wurden gelöscht.");
    }
  } catch (error) {
    console.error("Fehler beim Löschen:", error);
    showNotification("Fehler beim Löschen der Daten.", "error");
  } finally {
    hideLoader();
  }
}
