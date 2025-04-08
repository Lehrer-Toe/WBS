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

// Aktuelles Datum (lokale Zeit) für Default-Wert
const today = new Date();
const defaultDate = today.getFullYear() + '-' + 
                  String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                  String(today.getDate()).padStart(2, '0');

// Konstanten
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

// Event-Listener nach DOM-Ladeereignis
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
  
  await initDatabase();
  initTeacherGrid();
  setupEventListeners();
  hideLoader();
}

/**
 * Zeigt eine Benachrichtigung an
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
 * Zeigt den Ladebildschirm
 */
function showLoader() {
  if (mainLoader) {
    mainLoader.style.display = "flex";
  }
}

/**
 * Versteckt den Ladebildschirm
 */
function hideLoader() {
  if (mainLoader) {
    mainLoader.style.display = "none";
  }
}

/**
 * Formatiert einen ISO-Datumstring in deutsches Format
 */
function formatDate(isoDateString) {
  if (!isoDateString) return '';
  const date = new Date(isoDateString + "T00:00:00");
  if(isNaN(date.getTime())) return isoDateString;
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Extrahiert das Jahr aus dem ISO-Datum
 */
function getYearFromDate(isoDateString) {
  return isoDateString.split('-')[0];
}

/**
 * Liefert verfügbare Jahre (aktuell bis +10 Jahre)
 */
function getAvailableYears() {
  const years = new Set();
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i <= 10; i++) {
    years.add((currentYear + i).toString());
  }
  
  teacherData.students.forEach(student => {
    years.add(getYearFromDate(student.examDate));
  });
  
  return Array.from(years).sort((a, b) => a - b).reverse();
}

/**
 * Liefert alle verfügbaren Prüfungstage
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
 * Liefert alle verfügbaren Themen
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
 * Generiert eine eindeutige ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Initialisiert die Datenbankverbindung
 */
async function initDatabase() {
  try {
    showLoader();
    if (typeof supabase === 'undefined') {
      console.error("Supabase ist nicht definiert.");
      showNotification("Fehler bei der Initialisierung. Bitte Seite neu laden.", "error");
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
    console.log("Supabase-Client erfolgreich initialisiert");
    try {
      const { error } = await supabaseClient.rpc('create_wbs_table_if_not_exists');
      if (error) {
        console.error("Fehler beim Erstellen der Tabelle via RPC:", error);
        await createTableManually();
      }
    } catch (err) {
      console.error("Fehler bei RPC-Aufruf:", err);
      await createTableManually();
    }
    hideLoader();
    return true;
  } catch (error) {
    console.error("Fehler bei der Datenbankinitialisierung:", error);
    hideLoader();
    return false;
  }
}

/**
 * Falls RPC nicht funktioniert, Tabelle manuell erstellen
 */
async function createTableManually() {
  try {
    console.log("Tabelle wird manuell erstellt...");
    const { data, error } = await supabaseClient
      .from('wbs_data')
      .select('count(*)')
      .limit(1);
    if (error && error.code === '42P01') {
      console.log("Tabelle existiert nicht, erstelle sie...");
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS public.wbs_data (
          id SERIAL PRIMARY KEY,
          teacher_code TEXT NOT NULL,
          teacher_name TEXT NOT NULL,
          data JSONB NOT NULL DEFAULT '{"students":[], "assessments":{}}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        );
        CREATE UNIQUE INDEX IF NOT EXISTS wbs_data_teacher_code_idx ON public.wbs_data (teacher_code);
      `;
      try {
        const { error: sqlError } = await supabaseClient.rpc('execute_sql', {
          sql_query: createTableSQL
        });
        if (sqlError) {
          console.error("Fehler beim SQL:", sqlError);
          return false;
        }
        return true;
      } catch (sqlError) {
        console.error("Fehler beim Ausführen des SQL-Befehls:", sqlError);
        return false;
      }
    } else {
      console.log("Tabelle vorhanden oder anderer Fehler:", error);
      return true;
    }
  } catch (error) {
    console.error("Fehler in createTableManually:", error);
    return false;
  }
}

/**
 * Migration alter Bewertungsdaten zu neuen Kategorien
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
    for (const oldCategory in categoryMapping) {
      if (assessment.hasOwnProperty(oldCategory)) {
        const newCategory = categoryMapping[oldCategory];
        assessment[newCategory] = assessment[oldCategory];
        if (oldCategory !== newCategory) {
          delete assessment[oldCategory];
        }
      }
    }
    ASSESSMENT_CATEGORIES.forEach(category => {
      if (!assessment.hasOwnProperty(category.id)) {
        assessment[category.id] = 2;
      }
    });
    if (!assessment.hasOwnProperty('infoText')) {
      assessment['infoText'] = '';
    }
  }
}

/**
 * Lädt die Lehrerdaten
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
      teacherData = {
        students: [],
        assessments: {}
      };
      return await saveTeacherData();
    }
  } catch (error) {
    console.error("Fehler in loadTeacherData:", error);
    showNotification("Fehler beim Laden der Daten.", "error");
    return false;
  }
}

/**
 * Speichert die Lehrerdaten
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
      showNotification("Fehler beim Speichern der Daten.", "error");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Fehler in saveTeacherData:", error);
    showNotification("Fehler beim Speichern der Daten.", "error");
    return false;
  }
}

/**
 * Lehrergrid im Login-Bereich initialisieren
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
 * Alle Event-Listener registrieren
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
        case 'students':
          updateStudentsTab();
          break;
        case 'assessment':
          updateAssessmentTab();
          break;
        case 'overview':
          updateOverviewTab();
          break;
        case 'settings':
          updateSettingsTab();
          break;
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
    settingsYearSelect.addEventListener("change", () => {
      populateSettingsDateSelect();
    });
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
 * Passwort-Dialog
 */
function showPasswordModal(teacher) {
  loginPrompt.textContent = `Bitte das Passwort für ${teacher.name} eingeben:`;
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
 * Login-Funktion
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
 * Logout-Funktion
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
  showNotification("Abmeldung erfolgreich.");
}

/**
 * Durchschnittsnote berechnen
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
 * Tab: Schüler anlegen aktualisieren
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
 * Neuen Prüfling hinzufügen
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
    
    showLoader();
    const newStudent = {
      id: generateId(),
      name: name,
      examDate: date,
      topic: topic,
      createdAt: new Date().toISOString()
    };
    
    teacherData.students.push(newStudent);
    teacherData.assessments[newStudent.id] = {};
    
    ASSESSMENT_CATEGORIES.forEach(category => {
      teacherData.assessments[newStudent.id][category.id] = 2;
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
      populateOverviewTopicSelect();
      showNotification(`Prüfling "${name}" wurde hinzugefügt.`);
    }
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Prüflings:", error);
    showNotification("Fehler beim Hinzufügen.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Modal: Prüfling bearbeiten
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
 * Änderungen am Prüfling speichern
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
        populateOverviewTopicSelect();
        showNotification(`Prüfling "${name}" wurde aktualisiert.`);
        editStudentModal.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Fehler beim Speichern des Prüflings:", error);
    showNotification("Fehler beim Speichern.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Löschen-Bestätigung zeigen
 */
function showDeleteConfirmation() {
  studentToDelete = selectedStudent;
  deleteStudentName.textContent = selectedStudent.name;
  editStudentModal.style.display = "none";
  confirmDeleteModal.style.display = "flex";
}

/**
 * Prüfling löschen
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
      showNotification(`Prüfling "${studentToDelete.name}" wurde gelöscht.`);
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
 * Dropdown: Datum im Bewertungs-Tab füllen
 */
function populateAssessmentDateSelect() {
  if (!assessmentDateSelect) return;
  
  const dates = getAvailableDates();
  assessmentDateSelect.innerHTML = '<option value="">Alle Termine</option>';
  
  if (dates.length === 0) {
    return;
  }
  
  let defaultDateValue = null;
  
  if (lastSelectedDate && dates.includes(lastSelectedDate)) {
    defaultDateValue = lastSelectedDate;
  } else if (dates.includes(defaultDate)) {
    defaultDateValue = defaultDate;
  } else if (dates.length > 0) {
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
 * Dropdown: Thema im Bewertungs-Tab füllen
 */
function populateAssessmentTopicSelect() {
  if (!assessmentTopicSelect) return;
  
  const selectedDate = assessmentDateSelect.value;
  const topics = getAvailableTopics(selectedDate);
  
  assessmentTopicSelect.innerHTML = '<option value="">Alle Themen</option>';
  
  if (topics.length === 0) {
    return;
  }
  
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
 * Schülerliste im Bewertungs-Tab aktualisieren
 */
function updateAssessmentStudentList() {
  if (!assessmentStudentList || !assessmentContent) return;
  
  const selectedDate = assessmentDateSelect.value;
  const selectedTopic = assessmentTopicSelect ? assessmentTopicSelect.value : "";
  
  assessmentStudentList.innerHTML = '';
  
  if (!selectedDate && !selectedTopic) {
    assessmentStudentList.innerHTML = '<li>Bitte einen Termin oder ein Thema auswählen</li>';
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Willkommen bei der WBS Bewertungsapp</h2>
        <p>Bitte einen Prüfungstag oder ein Thema wählen und anschließend einen Prüfling aus der Liste auswählen.</p>
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
        <h2>Keine Prüflinge vorhanden</h2>
        <p>Für diesen Filter keine Einträge.</p>
      </div>
    `;
    return;
  }
  
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
      <div class="average-grade grade-${Math.round(finalGrade)}">${finalGrade}</div>
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
  
  if (studentsFiltered.length > 0 && !document.querySelector('.student-item.active')) {
    const firstStudent = document.querySelector('.student-item');
    if (firstStudent) {
      firstStudent.click();
    }
  }
}

/**
 * Autosave-Timer für den Infotext
 */
function setupInfoTextAutoSave(studentId) {
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
  }
  
  infoTextSaveTimer = setInterval(async () => {
    const infoTextArea = document.getElementById("studentInfoText");
    if (infoTextArea && infoTextArea.dataset.changed === "true") {
      const infoText = infoTextArea.value;
      if (teacherData.assessments[studentId]) {
        teacherData.assessments[studentId].infoText = infoText;
        await saveTeacherData();
        infoTextArea.dataset.changed = "false";
        showNotification("Informationstext automatisch gespeichert.");
        infoTextArea.classList.add('save-flash');
        setTimeout(() => {
          infoTextArea.classList.remove('save-flash');
        }, 1000);
      }
    }
  }, 60000);
}

/**
 * Bewertungsformular anzeigen
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
        <textarea id="studentInfoText" rows="5" placeholder="Notizen zum Prüfling eintragen...">${infoText}</textarea>
      </div>
      
      <div class="final-grade-display">Ø ${avgGrade || '0.0'}</div>
      
      <div class="final-grade-input">
        <label for="finalGrade">Endnote:</label>
        <input type="number" id="finalGrade" min="1" max="6" step="0.5" value="${finalGrade !== '-' ? finalGrade : ''}">
        <button id="saveFinalGradeBtn">Speichern</button>
        <button id="useAverageBtn">Durchschnitt übernehmen</button>
      </div>
  `;
  
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
      const avgDisplay = document.querySelector(".final-grade-display");
      avgDisplay.textContent = `Ø ${newAvg || '0.0'}`;
      
      if (!teacherData.assessments[student.id].finalGrade) {
        teacherData.assessments[student.id].finalGrade = parseFloat(newAvg);
        const fgInput = document.getElementById("finalGrade");
        if (fgInput) fgInput.value = newAvg;
      }
      
      try {
        await saveTeacherData();
        updateAssessmentStudentList();
      } catch (error) {
        console.error("Fehler beim Speichern der Note:", error);
        showNotification("Fehler beim Speichern.", "error");
      }
    });
  });
  
  const saveFinalGradeBtn = document.getElementById("saveFinalGradeBtn");
  if (saveFinalGradeBtn) {
    saveFinalGradeBtn.addEventListener("click", async () => {
      const finalGradeInput = document.getElementById("finalGrade");
      const finalGradeValue = parseFloat(finalGradeInput.value);
      if (isNaN(finalGradeValue) || finalGradeValue < 1 || finalGradeValue > 6) {
        showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
        return;
      }
      try {
        teacherData.assessments[student.id].finalGrade = finalGradeValue;
        await saveTeacherData();
        updateAssessmentStudentList();
        showNotification("Endnote gespeichert.");
      } catch (error) {
        console.error("Fehler beim Speichern der Endnote:", error);
        showNotification("Fehler beim Speichern der Endnote.", "error");
      }
    });
  }
  
  const useAverageBtn = document.getElementById("useAverageBtn");
  if (useAverageBtn) {
    useAverageBtn.addEventListener("click", async () => {
      const avgGradeCurrent = calculateAverageGrade(teacherData.assessments[student.id]);
      if (!avgGradeCurrent) {
        showNotification("Es ist kein Durchschnitt vorhanden.", "warning");
        return;
      }
      try {
        document.getElementById("finalGrade").value = avgGradeCurrent;
        teacherData.assessments[student.id].finalGrade = parseFloat(avgGradeCurrent);
        await saveTeacherData();
        updateAssessmentStudentList();
        showNotification("Durchschnitt als Endnote übernommen.");
      } catch (error) {
        console.error("Fehler:", error);
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

/**
 * Übersichts-Tab aktualisieren
 */
function updateOverviewTab() {
  populateOverviewYearSelect();
  populateOverviewDateSelect();
  populateOverviewTopicSelect();
  updateOverviewContent();
}

/**
 * Dropdown: Jahr im Übersichts-Tab
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
 * Dropdown: Datum im Übersichts-Tab
 */
function populateOverviewDateSelect() {
  if (!overviewDateSelect) return;
  const year = overviewYearSelect.value;
  const dates = getAvailableDates(year);
  overviewDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    overviewDateSelect.appendChild(option);
  });
}

/**
 * Dropdown: Thema im Übersichts-Tab
 */
function populateOverviewTopicSelect() {
  if (!overviewTopicSelect) return;
  overviewTopicSelect.innerHTML = '<option value="">Alle Themen</option>';
  let filteredStudents = teacherData.students;
  const year = overviewYearSelect.value;
  if (year) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === year);
  }
  const dateSelected = overviewDateSelect.value;
  if (dateSelected) {
    filteredStudents = filteredStudents.filter(s => s.examDate === dateSelected);
  }
  const topics = new Set();
  filteredStudents.forEach(s => {
    if (s.topic) {
      topics.add(s.topic);
    }
  });
  Array.from(topics).sort().forEach(topic => {
    const option = document.createElement('option');
    option.value = topic;
    option.textContent = topic;
    overviewTopicSelect.appendChild(option);
  });
}

/**
 * Übersichts-Tabelle aktualisieren
 */
function updateOverviewContent() {
  if (!overviewTable) return;
  const tbody = overviewTable.querySelector('tbody');
  tbody.innerHTML = '';
  let filteredStudents = teacherData.students;
  const year = overviewYearSelect.value;
  if (year) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === year);
  }
  const dateSelected = overviewDateSelect.value;
  if (dateSelected) {
    filteredStudents = filteredStudents.filter(s => s.examDate === dateSelected);
  }
  const topicSelected = overviewTopicSelect.value;
  if (topicSelected) {
    filteredStudents = filteredStudents.filter(s => s.topic === topicSelected);
  }
  if (filteredStudents.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="13">Keine Prüflinge gefunden</td>';
    tbody.appendChild(tr);
    return;
  }
  filteredStudents.sort((a, b) => {
    return new Date(b.examDate) - new Date(a.examDate);
  });
  filteredStudents.forEach(student => {
    const assessment = teacherData.assessments[student.id] || {};
    const tr = document.createElement('tr');
    tr.innerHTML = `
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
      <td>${assessment.finalGrade !== undefined ? assessment.finalGrade : '-'}</td>
      <td>
        <button class="edit-btn" data-id="${student.id}">✏️</button>
      </td>
    `;
    tr.querySelector('.edit-btn').addEventListener('click', () => {
      openEditGradeModal(student);
    });
    tbody.appendChild(tr);
  });
}

/**
 * Modal für die Endnote öffnen
 */
function openEditGradeModal(student) {
  selectedGradeStudent = student;
  const assessment = teacherData.assessments[student.id] || {};
  editFinalGrade.value = assessment.finalGrade || '';
  editGradeModal.style.display = "flex";
}

/**
 * Endnote speichern
 */
async function saveEditedGrade() {
  if (!selectedGradeStudent) return;
  const finalGradeValue = parseFloat(editFinalGrade.value);
  if (isNaN(finalGradeValue) || finalGradeValue < 1 || finalGradeValue > 6) {
    showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
    return;
  }
  try {
    teacherData.assessments[selectedGradeStudent.id].finalGrade = finalGradeValue;
    await saveTeacherData();
    updateOverviewContent();
    updateAssessmentStudentList();
    editGradeModal.style.display = "none";
    showNotification("Endnote gespeichert.");
  } catch (error) {
    console.error("Fehler beim Speichern:", error);
    showNotification("Fehler beim Speichern.", "error");
  }
}

/**
 * Einstellungs-Tab aktualisieren
 */
function updateSettingsTab() {
  populateSettingsYearSelect();
  populateSettingsDateSelect();
}

/**
 * Dropdown: Jahr im Einstellungs-Tab
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
 * Dropdown: Datum im Einstellungs-Tab
 */
function populateSettingsDateSelect() {
  if (!settingsDateSelect) return;
  const year = settingsYearSelect.value;
  const dates = getAvailableDates(year);
  settingsDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    settingsDateSelect.appendChild(option);
  });
}

/**
 * Export-Funktion
 */
function exportData() {
  let filteredStudents = teacherData.students;
  const year = settingsYearSelect.value;
  if (year) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === year);
  }
  const dateSelected = settingsDateSelect.value;
  if (dateSelected) {
    filteredStudents = filteredStudents.filter(s => s.examDate === dateSelected);
  }
  let exportContent = "";
  const isExportJSON = document.getElementById("exportJSON").checked;
  if (!isExportJSON) {
    exportContent += "Export WBS Bewertungssystem\n\n";
    filteredStudents.forEach(student => {
      const assessment = teacherData.assessments[student.id] || {};
      exportContent += `Name: ${student.name}\n`;
      exportContent += `Datum: ${formatDate(student.examDate)}\n`;
      exportContent += `Thema: ${student.topic || '-'}\n`;
      exportContent += `Endnote: ${assessment.finalGrade || '-'}\n`;
      exportContent += `Kategorien:\n`;
      ASSESSMENT_CATEGORIES.forEach(cat => {
        exportContent += `  ${cat.name}: ${assessment[cat.id] || '-'}\n`;
      });
      exportContent += `Info-Text: ${assessment.infoText || ''}\n`;
      exportContent += "\n--------------------------------\n\n";
    });
    const blob = new Blob([exportContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "WBS_Export.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    const exportData = [];
    filteredStudents.forEach(student => {
      const assessment = teacherData.assessments[student.id] || {};
      const entry = {
        name: student.name,
        examDate: formatDate(student.examDate),
        topic: student.topic || '',
        finalGrade: assessment.finalGrade || '',
        categories: {}
      };
      ASSESSMENT_CATEGORIES.forEach(cat => {
        entry.categories[cat.name] = assessment[cat.id] || '-';
      });
      entry.infoText = assessment.infoText || '';
      exportData.push(entry);
    });
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "WBS_Export.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

/**
 * Datenlöschung bestätigen
 */
function confirmDeleteAllData() {
  const code = deleteVerificationCode.value.trim();
  if (code !== (currentUser?.code || "")) {
    showNotification("Bestätigung fehlgeschlagen. Lehrerkürzel stimmt nicht überein.", "error");
    return;
  }
  if (!confirm("Sollen wirklich alle Daten gelöscht werden? Das kann nicht rückgängig gemacht werden!")) {
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
    teacherData = { students: [], assessments: {} };
    await saveTeacherData();
    updateStudentsTab();
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
