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
let lastSelectedDate = null; // Speichert das zuletzt ausgewählte Datum
let lastSelectedTopic = null; // Speichert das zuletzt ausgewählte Thema

// Immer das aktuelle Datum verwenden (lokale Zeit in Deutschland)
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

// Event-Listener hinzufügen, wenn DOM geladen ist
document.addEventListener("DOMContentLoaded", function() {
  console.log("WBS Bewertungssystem wird initialisiert...");
  init();
});

/**
 * Initialisiert die Anwendung
 */
async function init() {
  if (examDate) {
    // Wenn ein zuvor gespeichertes Datum existiert, nutze es
    examDate.value = lastSelectedDate || defaultDate;
  }
  
  // Datenbank initialisieren
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
 * Zeigt den Ladebildschirm an
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
 * Formatiert ein ISO-Datumstring in deutsches Format
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
 * Extrahiert das Jahr aus einem ISO-Datumstring
 */
function getYearFromDate(isoDateString) {
  return isoDateString.split('-')[0];
}

/**
 * Gibt die verfügbaren Jahre zurück
 */
function getAvailableYears() {
  const years = new Set();
  const currentYear = new Date().getFullYear();
  
  // Jahre vom aktuellen Jahr bis 10 Jahre in die Zukunft, beginnend mit aktuellem Jahr
  for (let i = 0; i <= 10; i++) {
    years.add((currentYear + i).toString());
  }
  
  // Auch Jahre aus vorhandenen Schülerdaten hinzufügen
  teacherData.students.forEach(student => {
    years.add(getYearFromDate(student.examDate));
  });
  
  // Absteigend sortieren mit aktuellem Jahr zuerst
  return Array.from(years).sort((a, b) => a - b).reverse();
}

/**
 * Gibt die verfügbaren Termine zurück
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
 * Gibt die verfügbaren Themen zurück
 */
function getAvailableTopics(selectedDate = null) {
  const topics = new Set();
  
  // Filter nach Datum, falls ausgewählt
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
      console.error("Supabase ist nicht definiert. Bitte Bibliothek prüfen.");
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
        console.error("Fehler beim Erstellen der Tabelle:", error);
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
 * Erstellt die Tabelle manuell, falls die RPC nicht verfügbar ist
 */
async function createTableManually() {
  try {
    console.log("Versuche, die Tabelle manuell zu erstellen...");
    const { data, error } = await supabaseClient
      .from('wbs_data')
      .select('count(*)')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.log("Tabelle existiert nicht, erstelle sie...");
      
      // SQL direkt ausführen
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
          console.error("Fehler beim Erstellen der Tabelle mit SQL:", sqlError);
          return false;
        }
        return true;
      } catch (sqlError) {
        console.error("Fehler beim Ausführen des SQL-Befehls:", sqlError);
        return false;
      }
    } else {
      console.log("Tabelle existiert bereits oder anderer Fehler:", error);
      return true;
    }
  } catch (error) {
    console.error("Fehler in createTableManually:", error);
    return false;
  }
}

/**
 * Funktion zur Migration der alten Bewertungskategorien zu den neuen
 */
function migrateAssessmentCategories() {
  const categoryMapping = {
    'organization': 'presentation',
    'workBehavior': 'content',
    'teamwork': 'language',
    'quality': 'impression',
    'reflection': 'reflection', // bleibt gleich
    'documentation': 'documentation' // bleibt gleich
    // Die neuen Kategorien 'examination' und 'expertise' haben keinen alten Wert
  };

  // Für jeden Schüler die Bewertungen aktualisieren
  for (const studentId in teacherData.assessments) {
    const assessment = teacherData.assessments[studentId];
    
    // Für jede alte Kategorie
    for (const oldCategory in categoryMapping) {
      if (assessment.hasOwnProperty(oldCategory)) {
        // Übertrage den Wert zur neuen Kategorie
        const newCategory = categoryMapping[oldCategory];
        assessment[newCategory] = assessment[oldCategory];
        
        // Lösche die alte Kategorie, wenn nicht identisch mit der neuen
        if (oldCategory !== newCategory) {
          delete assessment[oldCategory];
        }
      }
    }
    
    // Füge die neuen Kategorien mit Standardwert 2 hinzu, falls nicht vorhanden
    ASSESSMENT_CATEGORIES.forEach(category => {
      if (!assessment.hasOwnProperty(category.id)) {
        assessment[category.id] = 2;
      }
    });

    // Füge das Textfeld für Kommentare hinzu, falls nicht vorhanden
    if (!assessment.hasOwnProperty('infoText')) {
      assessment['infoText'] = '';
    }
  }
}

/**
 * Lädt die Daten des aktuellen Lehrers
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
      console.error("Error loading teacher data:", error);
      showNotification("Fehler beim Laden der Daten.", "error");
      return false;
    }
    
    if (data) {
      teacherData = data.data;
      // Migration der Kategorien durchführen
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
    console.error("Error in loadTeacherData:", error);
    showNotification("Fehler beim Laden der Daten.", "error");
    return false;
  }
}

/**
 * Speichert die Daten des aktuellen Lehrers
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
      console.error("Error saving teacher data:", error);
      showNotification("Fehler beim Speichern der Daten.", "error");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error in saveTeacherData:", error);
    showNotification("Fehler beim Speichern der Daten.", "error");
    return false;
  }
}

/**
 * Initialisiert das Lehrergrid im Login-Bereich
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
 * Richtet alle Event-Listener ein
 */
function setupEventListeners() {
  // Login-Bereich
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
  
  // Tabs
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
  
  // Schüler-Tab
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", addNewStudent);
  }
  
  // Bewertungs-Tab
  if (assessmentDateSelect) {
    assessmentDateSelect.addEventListener("change", () => {
      lastSelectedDate = assessmentDateSelect.value;
      // Bei Datumswechsel Themenfilter aktualisieren
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
  
  // Übersichts-Tab
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
  
  // Einstellungs-Tab
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
  
  // Modals
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
 * Zeigt den Passwort-Dialog an
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
 * Führt den Login-Prozess durch
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
 * Loggt den Benutzer aus
 */
function logout() {
  // Timer löschen bei Abmeldung
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
    infoTextSaveTimer = null;
  }
  
  currentUser = null;
  teacherData = {
    students: [],
    assessments: {}
  };
  loginSection.style.display = "block";
  appSection.style.display = "none";
  showNotification("Sie wurden abgemeldet.");
}

/**
 * Berechnet die Durchschnittsnote für eine Bewertung
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
 * Aktualisiert den Studenten-Tab
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
 * Fügt einen neuen Schüler hinzu
 */
async function addNewStudent() {
  try {
    const name = newStudentName.value.trim();
    const date = examDate.value;
    const topic = newStudentTopic ? newStudentTopic.value.trim() : '';
    
    // Speichere das ausgewählte Datum und Thema für den nächsten Prüfling
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
      showNotification(`Ein Prüfling namens "${name}" existiert bereits für dieses Datum.`, "warning");
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
    
    // Standardwerte für alle Bewertungskategorien setzen
    ASSESSMENT_CATEGORIES.forEach(category => {
      teacherData.assessments[newStudent.id][category.id] = 2;
    });
    
    // Leeres Textfeld für Informationen hinzufügen
    teacherData.assessments[newStudent.id].infoText = '';
    
    // Standardwert für Endnote
    teacherData.assessments[newStudent.id].finalGrade = 2.0;
    
    const saved = await saveTeacherData();
    if (saved) {
      newStudentName.value = "";
      if (newStudentTopic) newStudentTopic.value = "";
      // Das aktuelle Datum beibehalten (zuletzt ausgewähltes)
      examDate.value = lastSelectedDate;
      updateStudentsTab();
      populateAssessmentDateSelect();
      populateAssessmentTopicSelect();
      populateOverviewTopicSelect();
      showNotification(`Prüfling "${name}" wurde hinzugefügt.`);
    }
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Prüflings:", error);
    showNotification("Fehler beim Hinzufügen des Prüflings.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Zeigt das Modal zum Bearbeiten eines Schülers an
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
 * Speichert die Änderungen an einem Schüler
 */
async function saveEditedStudent() {
  try {
    const name = editStudentName.value.trim();
    const date = editExamDate.value;
    const topic = editStudentTopic ? editStudentTopic.value.trim() : '';
    
    // Wenn sich das Datum ändert, für zukünftige Schüler merken
    if (date !== selectedStudent.examDate) {
      lastSelectedDate = date;
    }
    
    // Wenn sich das Thema ändert, für zukünftige Schüler merken
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
      showNotification(`Ein Prüfling namens "${name}" existiert bereits für dieses Datum.`, "warning");
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
    showNotification("Fehler beim Speichern des Prüflings.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Zeigt die Bestätigung zum Löschen eines Schülers an
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
      showNotification(`Prüfling "${studentToDelete.name}" wurde gelöscht.`);
      confirmDeleteModal.style.display = "none";
      studentToDelete = null;
    }
  } catch (error) {
    console.error("Fehler beim Löschen des Prüflings:", error);
    showNotification("Fehler beim Löschen des Prüflings.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Aktualisiert den Bewertungs-Tab
 */
function updateAssessmentTab() {
  populateAssessmentDateSelect();
  populateAssessmentTopicSelect();
  updateAssessmentStudentList();
}

/**
 * Füllt das Datum-Dropdown im Bewertungs-Tab
 */
function populateAssessmentDateSelect() {
  if (!assessmentDateSelect) return;
  
  const dates = getAvailableDates();
  assessmentDateSelect.innerHTML = '<option value="">Alle Termine</option>';
  
  if (dates.length === 0) {
    return;
  }
  
  // Standarddatum bestimmen
  let defaultDateValue = null;
  
  // Zuerst versuchen, das zuletzt ausgewählte Datum zu verwenden
  if (lastSelectedDate && dates.includes(lastSelectedDate)) {
    defaultDateValue = lastSelectedDate;
  } 
  // Falls nicht vorhanden, prüfen ob das aktuelle Datum in den verfügbaren Daten ist
  else if (dates.includes(defaultDate)) {
    defaultDateValue = defaultDate;
  } 
  // Sonst das neueste Datum nehmen
  else if (dates.length > 0) {
    defaultDateValue = dates[0];
  }
  
  // Optionen hinzufügen
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    if (date === defaultDateValue) {
      option.selected = true;
    }
    assessmentDateSelect.appendChild(option);
  });
  
  // Sicherstellen, dass lastSelectedDate aktualisiert wird
  if (assessmentDateSelect.value) {
    lastSelectedDate = assessmentDateSelect.value;
  }
}

/**
 * Füllt das Themen-Dropdown im Bewertungs-Tab
 */
function populateAssessmentTopicSelect() {
  if (!assessmentTopicSelect) return;
  
  const selectedDate = assessmentDateSelect.value;
  
  // Alle verfügbaren Themen für das ausgewählte Datum holen
  const topics = getAvailableTopics(selectedDate);
  
  assessmentTopicSelect.innerHTML = '<option value="">Alle Themen</option>';
  
  // Wenn keine Themen verfügbar sind, früh beenden
  if (topics.length === 0) {
    return;
  }
  
  // Standardthema bestimmen
  let defaultTopicValue = null;
  
  // Zuerst versuchen, das zuletzt ausgewählte Thema zu verwenden, wenn vorhanden und gültig
  if (lastSelectedTopic && topics.includes(lastSelectedTopic)) {
    defaultTopicValue = lastSelectedTopic;
  }
  
  // Optionen hinzufügen
  topics.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic;
    option.textContent = topic;
    if (topic === defaultTopicValue) {
      option.selected = true;
    }
    assessmentTopicSelect.appendChild(option);
  });
  
  // Sicherstellen, dass lastSelectedTopic aktualisiert wird
  if (assessmentTopicSelect.value) {
    lastSelectedTopic = assessmentTopicSelect.value;
  }
}

/**
 * Aktualisiert die Schülerliste im Bewertungs-Tab
 */
function updateAssessmentStudentList() {
  if (!assessmentStudentList || !assessmentContent) return;
  
  const selectedDate = assessmentDateSelect.value;
  const selectedTopic = assessmentTopicSelect ? assessmentTopicSelect.value : "";
  
  assessmentStudentList.innerHTML = '';
  
  if (!selectedDate && !selectedTopic) {
    assessmentStudentList.innerHTML = '<li>Bitte wählen Sie ein Datum oder Thema</li>';
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Willkommen bei der WBS Bewertungsapp</h2>
        <p>Bitte wählen Sie einen Prüfungstag oder ein Thema und dann einen Prüfling aus der Liste.</p>
      </div>
    `;
    return;
  }
  
  // Prüflinge filtern
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
        <p>Für die ausgewählten Filter wurden keine Prüflinge gefunden.</p>
      </div>
    `;
    return;
  }
  
  // Nach Datum absteigend und dann nach Namen sortieren
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
  
  // Automatisch den ersten Prüfling auswählen, wenn noch keiner ausgewählt ist
  if (studentsFiltered.length > 0 && !document.querySelector('.student-item.active')) {
    const firstStudent = document.querySelector('.student-item');
    if (firstStudent) {
      firstStudent.click();
    }
  }
}

/**
 * Einrichten des Autosave-Timers für den Informationstext
 */
function setupInfoTextAutoSave(studentId) {
  // Bestehenden Timer löschen, falls vorhanden
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
  }
  
  // Neuen Timer einrichten
  infoTextSaveTimer = setInterval(async () => {
    const infoTextArea = document.getElementById("studentInfoText");
    if (infoTextArea && infoTextArea.dataset.changed === "true") {
      const infoText = infoTextArea.value;
      
      // Speichere den Text in der Datenstruktur
      if (teacherData.assessments[studentId]) {
        teacherData.assessments[studentId].infoText = infoText;
        await saveTeacherData();
        infoTextArea.dataset.changed = "false";
        
        // Kleine Benachrichtigung, dass gespeichert wurde
        showNotification("Informationstext wurde automatisch gespeichert.", "success");
        infoTextArea.classList.add('save-flash');
        setTimeout(() => {
          infoTextArea.classList.remove('save-flash');
        }, 1000);
      }
    }
  }, 60000); // Alle 60 Sekunden speichern
}

/**
 * Zeigt das Bewertungsformular für einen Schüler an
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
        <textarea id="studentInfoText" rows="6" placeholder="Notizen zum Prüfling eingeben...">${infoText}</textarea>
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
    
    // Noten-Buttons: 1.0, 1.5, 2.0, ... 6.0
    for (let i = 1; i <= 6; i++) {
      for (let decimal = 0; decimal <= 0.5; decimal += 0.5) {
        const currentGrade = i + decimal;
        const isSelected = grade === currentGrade;
        html += `
          <button class="grade-button grade-${Math.floor(currentGrade)}" data-grade="${currentGrade}" ${isSelected ? 'class="selected"' : ''}>${currentGrade.toFixed(1)}</button>
        `;
      }
    }
    
    // Zusätzlich die 0 für "keine Bewertung"
    const isZeroSelected = grade === 0;
    html += `
        <button class="grade-button grade-0" data-grade="0" ${isZeroSelected ? 'class="selected"' : ''}>-</button>
      </div>
    </div>
    `;
  });
  
  html += `</div>`;
  assessmentContent.innerHTML = html;
  
  // Klassen für ausgewählte Buttons korrigieren
  document.querySelectorAll(".grade-buttons .grade-button").forEach(btn => {
    const category = btn.parentElement.dataset.category;
    const grade = parseFloat(btn.dataset.grade);
    const currentGrade = assessment[category] || 0;
    
    if (grade === currentGrade) {
      btn.classList.add("selected");
    }
    
    // Event-Listener für Notenwahl-Buttons
    btn.addEventListener("click", async () => {
      const categoryId = btn.parentElement.dataset.category;
      const gradeValue = parseFloat(btn.dataset.grade);
      
      // Alle Buttons in dieser Kategorie deselektieren
      const buttons = btn.parentElement.querySelectorAll("button");
      buttons.forEach(b => b.classList.remove("selected"));
      
      // Diesen Button selektieren
      btn.classList.add("selected");
      
      // Anzeige aktualisieren
      const gradeDisplay = btn.parentElement.previousElementSibling;
      gradeDisplay.textContent = gradeValue > 0 ? gradeValue.toFixed(1) : '-';
      
      // In Datenstruktur speichern
      if (!teacherData.assessments[student.id]) {
        teacherData.assessments[student.id] = {};
      }
      
      teacherData.assessments[student.id][categoryId] = gradeValue;
      
      // Durchschnitt neu berechnen
      const newAvg = calculateAverageGrade(teacherData.assessments[student.id]);
      document.querySelector(".final-grade-display").textContent = `Ø ${newAvg || '0.0'}`;
      
      // Wenn noch keine Endnote gesetzt ist, Durchschnitt als Endnote übernehmen
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
        showNotification("Fehler beim Speichern der Note.", "error");
      }
    });
  });
  
  // Eventlistener für Endnote
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
        showNotification("Endnote wurde gespeichert.");
      } catch (error) {
        console.error("Fehler beim Speichern der Endnote:", error);
        showNotification("Fehler beim Speichern der Endnote.", "error");
      }
    });
  }
  
  // Eventlistener für Durchschnitt-Button
  const useAverageBtn = document.getElementById("useAverageBtn");
  if (useAverageBtn) {
    useAverageBtn.addEventListener("click", async () => {
      const avgGrade = calculateAverageGrade(teacherData.assessments[student.id]);
      if (!avgGrade) {
        showNotification("Es gibt noch keinen Durchschnitt.", "warning");
        return;
      }
      
      try {
        document.getElementById("finalGrade").value = avgGrade;
        teacherData.assessments[student.id].finalGrade = parseFloat(avgGrade);
        await saveTeacherData();
        updateAssessmentStudentList();
        showNotification("Durchschnitt als Endnote übernommen.");
      } catch (error) {
        console.error("Fehler beim Übernehmen des Durchschnitts:", error);
        showNotification("Fehler beim Übernehmen des Durchschnitts.", "error");
      }
    });
  }
  
  // Event-Listeners für den Informationstext mit Autosave
  const infoTextArea = document.getElementById("studentInfoText");
  if (infoTextArea) {
    infoTextArea.dataset.changed = "false";
    
    infoTextArea.addEventListener("input", () => {
      infoTextArea.dataset.changed = "true";
    });
    
    infoTextArea.addEventListener("blur", async () => {
      if (infoTextArea.dataset.changed === "true") {
        try {
          teacherData.assessments[student.id].infoText = infoTextArea.value;
          await saveTeacherData();
          infoTextArea.dataset.changed = "false";
          showNotification("Informationstext gespeichert.");
        } catch (error) {
          console.error("Fehler beim Speichern des Informationstextes:", error);
          showNotification("Fehler beim Speichern des Informationstextes.", "error");
        }
      }
    });
    
    // Autosave einrichten
    setupInfoTextAutoSave(student.id);
  }
}

/**
 * Zeigt das Modal zum Bearbeiten einer Note an
 */
function showEditGradeModal(student) {
  selectedGradeStudent = student;
  const assessment = teacherData.assessments[student.id] || {};
  const finalGrade = assessment.finalGrade || calculateAverageGrade(assessment) || '';
  editFinalGrade.value = finalGrade;
  editGradeModal.style.display = "flex";
}

/**
 * Speichert eine bearbeitete Note
 */
async function saveEditedGrade() {
  try {
    const finalGradeValue = parseFloat(editFinalGrade.value);
    if (isNaN(finalGradeValue) || finalGradeValue < 1 || finalGradeValue > 6) {
      showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
      return;
    }
    
    showLoader();
    if (!teacherData.assessments[selectedGradeStudent.id]) {
      teacherData.assessments[selectedGradeStudent.id] = {};
      ASSESSMENT_CATEGORIES.forEach(category => {
        teacherData.assessments[selectedGradeStudent.id][category.id] = 2;
      });
    }
    
    teacherData.assessments[selectedGradeStudent.id].finalGrade = finalGradeValue;
    const saved = await saveTeacherData();
    
    if (saved) {
      updateOverviewContent();
      updateAssessmentStudentList();
      showNotification(`Endnote für "${selectedGradeStudent.name}" wurde aktualisiert.`);
      editGradeModal.style.display = "none";
      selectedGradeStudent = null;
    }
  } catch (error) {
    console.error("Fehler beim Speichern der Endnote:", error);
    showNotification("Fehler beim Speichern der Endnote.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Aktualisiert den Übersichts-Tab
 */
function updateOverviewTab() {
  populateOverviewYearSelect();
  populateOverviewDateSelect();
  populateOverviewTopicSelect();
  updateOverviewContent();
}

/**
 * Füllt das Jahr-Dropdown in der Übersicht
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
 * Füllt das Datum-Dropdown in der Übersicht
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
 * Füllt das Thema-Dropdown in der Übersicht
 */
function populateOverviewTopicSelect() {
  if (!overviewTopicSelect) return;
  
  // Filter nach Jahr, falls ausgewählt
  const selectedYear = overviewYearSelect.value;
  
  // Alle Themen holen
  let topics = [];
  
  if (selectedYear) {
    // Nur Themen für das ausgewählte Jahr
    const studentsForYear = teacherData.students.filter(
      s => getYearFromDate(s.examDate) === selectedYear
    );
    
    topics = studentsForYear
      .filter(s => s.topic && s.topic.trim() !== '')
      .map(s => s.topic);
  } else {
    // Alle Themen
    topics = teacherData.students
      .filter(s => s.topic && s.topic.trim() !== '')
      .map(s => s.topic);
  }
  
  // Duplikate entfernen und sortieren
  const uniqueTopics = [...new Set(topics)].sort();
  
  // Select-Element füllen
  overviewTopicSelect.innerHTML = '<option value="">Alle Themen</option>';
  
  uniqueTopics.forEach(topic => {
    const option = document.createElement('option');
    option.value = topic;
    option.textContent = topic;
    overviewTopicSelect.appendChild(option);
  });
}

/**
 * Aktualisiert den Inhalt der Übersicht
 */
function updateOverviewContent() {
  if (!overviewTable) return;
  const selectedYear = overviewYearSelect.value;
  const selectedDate = overviewDateSelect.value;
  const selectedTopic = overviewTopicSelect ? overviewTopicSelect.value : "";
  const tbody = overviewTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  let filteredStudents = [...teacherData.students];
  
  if (selectedYear) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === selectedYear);
  }
  if (selectedDate) {
    filteredStudents = filteredStudents.filter(s => s.examDate === selectedDate);
  }
  if (selectedTopic) {
    filteredStudents = filteredStudents.filter(s => s.topic === selectedTopic);
  }
  
  filteredStudents.sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
  
  if (filteredStudents.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="13">Keine Prüflinge gefunden</td>';
    tbody.appendChild(tr);
    return;
  }
  
  filteredStudents.forEach(student => {
    const assessment = teacherData.assessments[student.id] || {};
    const avgGrade = calculateAverageGrade(assessment);
    const finalGrade = assessment.finalGrade || avgGrade || '-';
    
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${formatDate(student.examDate)}</td>
      <td>${student.topic || '-'}</td>
      <td>${assessment.presentation > 0 ? assessment.presentation.toFixed(1) : '-'}</td>
      <td>${assessment.content > 0 ? assessment.content.toFixed(1) : '-'}</td>
      <td>${assessment.language > 0 ? assessment.language.toFixed(1) : '-'}</td>
      <td>${assessment.impression > 0 ? assessment.impression.toFixed(1) : '-'}</td>
      <td>${assessment.examination > 0 ? assessment.examination.toFixed(1) : '-'}</td>
      <td>${assessment.reflection > 0 ? assessment.reflection.toFixed(1) : '-'}</td>
      <td>${assessment.expertise > 0 ? assessment.expertise.toFixed(1) : '-'}</td>
      <td>${assessment.documentation > 0 ? assessment.documentation.toFixed(1) : '-'}</td>
      <td>${typeof finalGrade === 'number' ? finalGrade.toFixed(1) : finalGrade}</td>
      <td>
        <button class="edit-btn" data-id="${student.id}">✏️</button>
      </td>
    `;
    tr.querySelector('.edit-btn').addEventListener('click', () => {
      showEditGradeModal(student);
    });
    tbody.appendChild(tr);
  });
}

/**
 * Aktualisiert den Einstellungs-Tab
 */
function updateSettingsTab() {
  populateSettingsYearSelect();
  populateSettingsDateSelect();
}

/**
 * Füllt das Jahr-Dropdown in den Einstellungen
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
 * Füllt das Datum-Dropdown in den Einstellungen
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
 * Bestätigt das Löschen aller Daten
 */
function confirmDeleteAllData() {
  const code = deleteVerificationCode.value.trim();
  if (!code || code !== currentUser.code) {
    showNotification("Falsches oder kein Lehrerkürzel.", "warning");
    return;
  }
  if (!confirm("Wirklich ALLE Daten löschen?")) {
    return;
  }
  deleteAllData();
}

/**
 * Löscht alle Daten des aktuellen Lehrers
 */
async function deleteAllData() {
  try {
    showLoader();
    teacherData = {
      students: [],
      assessments: {}
    };
    const saved = await saveTeacherData();
    if (saved) {
      updateStudentsTab();
      updateAssessmentTab();
      updateOverviewTab();
      showNotification("Alle Daten wurden gelöscht.");
    }
  } catch (error) {
    console.error("Fehler beim Löschen aller Daten:", error);
    showNotification("Fehler beim Löschen aller Daten.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Exportiert die Bewertungsdaten als JSON
 */
function exportToJSON(filteredStudents, selectedYear, selectedDate) {
  try {
    const exportObject = {
      teacher: {
        name: currentUser.name,
        code: currentUser.code
      },
      filters: { 
        year: selectedYear || "Alle", 
        date: selectedDate ? formatDate(selectedDate) : "Alle" 
      },
      exportDate: new Date().toLocaleDateString('de-DE'),
      students: filteredStudents.map(s => {
        const a = teacherData.assessments[s.id] || {};
        return {
          id: s.id,
          name: s.name,
          examDate: formatDate(s.examDate),
          topic: s.topic || '',
          createdAt: s.createdAt,
          infoText: a.infoText || '',
          finalGrade: a.finalGrade,
          avgGrade: calculateAverageGrade(a),
          categories: ASSESSMENT_CATEGORIES.reduce((obj, cat) => {
            obj[cat.name] = a[cat.id] || '-';
            return obj;
          }, {})
        };
      })
    };
    
    const jsonString = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    
    // Dateiname mit Datum
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    let filename = `wbs_export_${dateStr}`;
    
    if (selectedYear) filename += `_${selectedYear}`;
    if (selectedDate) filename += `_${formatDate(selectedDate).replace(/\./g, "-")}`;
    
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification("Bewertungen wurden als JSON-Datei exportiert.");
    return true;
  } catch (error) {
    console.error("Fehler beim JSON-Export:", error);
    showNotification("Fehler beim Erstellen der JSON-Datei: " + error.message, "error");
    return false;
  }
}

/**
 * Exportiert die Bewertungsdaten als TXT
 */
function exportToTXT(filteredStudents, selectedYear, selectedDate) {
  try {
    let textContent = "WBS BEWERTUNGSSYSTEM - EXPORT\n";
    textContent += "==============================\n\n";
    textContent += `Lehrer: ${currentUser.name} (${currentUser.code})\n`;
    textContent += `Exportdatum: ${new Date().toLocaleDateString('de-DE')}\n`;
    textContent += `Filter: Jahr ${selectedYear || "Alle"}, Datum ${selectedDate ? formatDate(selectedDate) : "Alle"}\n\n`;
    textContent += "PRÜFLINGE\n";
    textContent += "=========\n\n";
    
    filteredStudents.forEach(student => {
      const a = teacherData.assessments[student.id] || {};
      const avgGrade = calculateAverageGrade(a);
      const finalGrade = a.finalGrade || avgGrade || '-';
      
      textContent += `Name: ${student.name}\n`;
      textContent += `Datum: ${formatDate(student.examDate)}\n`;
      if (student.topic) {
        textContent += `Thema: ${student.topic}\n`;
      }
      textContent += `Endnote: ${typeof finalGrade === 'number' ? finalGrade.toFixed(1) : finalGrade}\n`;
      textContent += `Durchschnitt: ${avgGrade || '-'}\n\n`;
      
      // Bewertungskategorien
      textContent += "Bewertungen:\n";
      ASSESSMENT_CATEGORIES.forEach(category => {
        const grade = a[category.id];
        textContent += `- ${category.name}: ${grade > 0 ? grade.toFixed(1) : '-'}\n`;
      });
      
      // Infotext, falls vorhanden
      if (a.infoText && a.infoText.trim()) {
        textContent += "\nInformationen:\n";
        textContent += a.infoText + "\n";
      }
      
      textContent += "\n---------------------------\n\n";
    });
    
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    
    // Dateiname mit Datum
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    let filename = `wbs_export_${dateStr}`;
    
    if (selectedYear) filename += `_${selectedYear}`;
    if (selectedDate) filename += `_${formatDate(selectedDate).replace(/\./g, "-")}`;
    
    link.download = `${filename}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification("Bewertungen wurden als TXT-Datei exportiert.");
    return true;
  } catch (error) {
    console.error("Fehler beim TXT-Export:", error);
    showNotification("Fehler beim Erstellen der TXT-Datei: " + error.message, "error");
    return false;
  }
}

/**
 * Exportiert die Bewertungsdaten
 */
async function exportData() {
  try {
    const exportAsTXT = document.getElementById('exportTXT').checked;
    
    // Filter anwenden
    const selectedYear = settingsYearSelect.value;
    const selectedDate = settingsDateSelect.value;
    const selectedTopic = overviewTopicSelect ? overviewTopicSelect.value : "";
    
    let filteredStudents = [...teacherData.students];
    
    if (selectedYear) {
      filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === selectedYear);
    }
    if (selectedDate) {
      filteredStudents = filteredStudents.filter(s => s.examDate === selectedDate);
    }
    if (selectedTopic) {
      filteredStudents = filteredStudents.filter(s => s.topic === selectedTopic);
    }
    
    // Sortiere Schüler nach Datum und Namen
    filteredStudents.sort((a, b) => {
      const dateComp = new Date(b.examDate) - new Date(a.examDate);
      if (dateComp !== 0) return dateComp;
      return a.name.localeCompare(b.name);
    });
    
    if (filteredStudents.length === 0) {
      showNotification("Keine Daten zum Exportieren gefunden.", "warning");
      return;
    }
    
    // Je nach ausgewähltem Format exportieren
    if (exportAsTXT) {
      exportToTXT(filteredStudents, selectedYear, selectedDate);
    } else {
      exportToJSON(filteredStudents, selectedYear, selectedDate);
    }
  } catch (error) {
    console.error("Fehler beim Exportieren der Daten:", error);
    showNotification("Fehler beim Exportieren der Daten.", "error");
  }
}
