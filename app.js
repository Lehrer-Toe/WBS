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
const examDate = document.getElementById("examDate");
const addStudentBtn = document.getElementById("addStudentBtn");
const studentsTable = document.getElementById("studentsTable");

const assessmentDateSelect = document.getElementById("assessmentDateSelect");
const assessmentStudentList = document.getElementById("assessmentStudentList");
const assessmentContent = document.getElementById("assessmentContent");

const overviewYearSelect = document.getElementById("overviewYearSelect");
const overviewDateSelect = document.getElementById("overviewDateSelect");
const overviewTable = document.getElementById("overviewTable");

const settingsYearSelect = document.getElementById("settingsYearSelect");
const settingsDateSelect = document.getElementById("settingsDateSelect");
const exportDataBtn = document.getElementById("exportDataBtn");
const deleteVerificationCode = document.getElementById("deleteVerificationCode");
const deleteDataBtn = document.getElementById("deleteDataBtn");

const editStudentModal = document.getElementById("editStudentModal");
const closeEditStudentModal = document.getElementById("closeEditStudentModal");
const editStudentName = document.getElementById("editStudentName");
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
    examDate.value = defaultDate;
  }
  
  // Datenbank initialisieren
  const dbInitialized = await initDatabase();
  console.log("Datenbank initialisiert:", dbInitialized);
  
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
  return Array.from(years).sort((a, b) => b - a);
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
 * Generiert eine eindeutige ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Prüft, ob bereits ein Student an einem Prüfungstag existiert
 */
function isStudentOnExamDay(studentId, examDate) {
  return teacherData.students.some(s => s.id !== studentId && s.examDate === examDate);
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
    console.log("Speichere Lehrerdaten:", JSON.stringify(teacherData));
    
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
    
    console.log("Daten erfolgreich gespeichert");
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
      
      // WICHTIG: Tab-spezifische Updates
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
    // FEHLERBEHEBUNG 1: Event-Listener entfernen und neu hinzufügen
    addStudentBtn.removeEventListener("click", addNewStudent);
    addStudentBtn.addEventListener("click", addNewStudent);
    console.log("Hinzufügen-Button Event-Listener neu angehängt");
  } else {
    console.error("addStudentBtn nicht gefunden!");
  }
  
  // Bewertungs-Tab
  if (assessmentDateSelect) {
    assessmentDateSelect.addEventListener("change", updateAssessmentStudentList);
  }
  
  // Übersichts-Tab
  if (overviewYearSelect) {
    overviewYearSelect.addEventListener("change", () => {
      populateOverviewDateSelect();
      updateOverviewContent();
    });
  }
  if (overviewDateSelect) {
    overviewDateSelect.addEventListener("change", updateOverviewContent);
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
    // FEHLERBEHEBUNG 3: Event-Listener entfernen und neu hinzufügen
    confirmDeleteBtn.removeEventListener("click", deleteStudent);
    confirmDeleteBtn.addEventListener("click", deleteStudent);
    console.log("Löschen-Button Event-Listener neu angehängt");
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
    tr.innerHTML = '<td colspan="3">Keine Prüflinge vorhanden</td>';
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
 * FEHLERBEHEBUNG 1: Funktion überarbeitet
 */
async function addNewStudent() {
  console.log("addNewStudent wurde aufgerufen");
  
  try {
    const name = newStudentName.value.trim();
    const date = examDate.value;
    
    if (!name) {
      showNotification("Bitte einen Namen eingeben.", "warning");
      return;
    }
    
    // Überprüfen, ob bereits ein Schüler mit diesem Namen und Datum existiert
    const existingStudent = teacherData.students.find(s => 
      s.name.toLowerCase() === name.toLowerCase() && s.examDate === date
    );
    
    if (existingStudent) {
      showNotification(`Ein Prüfling namens "${name}" existiert bereits für dieses Datum.`, "warning");
      return;
    }
    
    // Überprüfen, ob bereits ein Schüler an diesem Datum existiert
    if (isStudentOnExamDay(null, date)) {
      if (!confirm(`Es existiert bereits ein Prüfling am ${formatDate(date)}. Trotzdem fortfahren?`)) {
        return;
      }
    }
    
    // Neuen Schüler erstellen
    const newStudent = {
      id: generateId(),
      name: name,
      examDate: date,
      createdAt: new Date().toISOString()
    };
    
    console.log("Neuer Prüfling wird erstellt:", newStudent);
    showLoader();
    
    // Schüler zur Datenstruktur hinzufügen
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
    
    // Speichern
    const saved = await saveTeacherData();
    
    if (saved) {
      // Formular zurücksetzen
      newStudentName.value = "";
      examDate.value = defaultDate;
      
      // UI aktualisieren
      updateStudentsTab();
      populateAssessmentDateSelect();
      
      showNotification(`Prüfling "${name}" wurde hinzugefügt.`);
      console.log("Prüfling erfolgreich hinzugefügt");
    } else {
      // Fehlerfall - entferne den Schüler wieder
      teacherData.students = teacherData.students.filter(s => s.id !== newStudent.id);
      delete teacherData.assessments[newStudent.id];
      showNotification("Fehler beim Speichern des Prüflings.", "error");
    }
  } catch (error) {
    console.error("Fehler beim Hinzufügen eines neuen Prüflings:", error);
    showNotification("Ein Fehler ist aufgetreten.", "error");
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
  selectedStudent = student;
  editStudentModal.style.display = "flex";
}

/**
 * Speichert die Änderungen an einem Schüler
 */
async function saveEditedStudent() {
  const name = editStudentName.value.trim();
  const date = editExamDate.value;
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
  if (date !== selectedStudent.examDate && isStudentOnExamDay(selectedStudent.id, date)) {
    if (!confirm(`Es existiert bereits ein Prüfling am ${formatDate(date)}. Trotzdem fortfahren?`)) {
      return;
    }
  }
  showLoader();
  const index = teacherData.students.findIndex(s => s.id === selectedStudent.id);
  if (index !== -1) {
    teacherData.students[index].name = name;
    teacherData.students[index].examDate = date;
    const saved = await saveTeacherData();
    if (saved) {
      updateStudentsTab();
      populateAssessmentDateSelect();
      showNotification(`Prüfling "${name}" wurde aktualisiert.`);
    }
  }
  hideLoader();
  editStudentModal.style.display = "none";
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
 * FEHLERBEHEBUNG 3: Funktion überarbeitet
 */
async function deleteStudent() {
  console.log("deleteStudent wurde aufgerufen");
  
  try {
    if (!studentToDelete) {
      console.log("Kein Prüfling zum Löschen ausgewählt");
      confirmDeleteModal.style.display = "none";
      return;
    }
    
    const studentName = studentToDelete.name;
    const studentId = studentToDelete.id;
    
    console.log(`Lösche Prüfling: ${studentName} (ID: ${studentId})`);
    showLoader();
    
    // Prüfling aus Array entfernen
    teacherData.students = teacherData.students.filter(s => s.id !== studentId);
    
    // Bewertungen löschen
    delete teacherData.assessments[studentId];
    
    // Speichern
    const saved = await saveTeacherData();
    
    if (saved) {
      // UI aktualisieren
      updateStudentsTab();
      populateAssessmentDateSelect();
      updateAssessmentStudentList();
      updateOverviewTab();
      
      showNotification(`Prüfling "${studentName}" wurde gelöscht.`);
      console.log("Prüfling erfolgreich gelöscht");
    } else {
      showNotification("Fehler beim Löschen des Prüflings.", "error");
    }
  } catch (error) {
    console.error("Fehler beim Löschen des Prüflings:", error);
    showNotification("Ein Fehler ist aufgetreten.", "error");
  } finally {
    // WICHTIG: Modal schließen und Referenz zurücksetzen
    confirmDeleteModal.style.display = "none";
    studentToDelete = null;
    hideLoader();
  }
}

/**
 * Aktualisiert den Bewertungs-Tab
 */
function updateAssessmentTab() {
  populateAssessmentDateSelect();
  updateAssessmentStudentList();
}

/**
 * Füllt das Datum-Dropdown im Bewertungs-Tab
 */
function populateAssessmentDateSelect() {
  if (!assessmentDateSelect) return;
  const dates = getAvailableDates();
  assessmentDateSelect.innerHTML = '<option value="">Bitte wählen...</option>';
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    assessmentDateSelect.appendChild(option);
  });
  
  // FEHLERBEHEBUNG 2: Direkt das erste Datum auswählen, falls vorhanden
  if (dates.length > 0) {
    assessmentDateSelect.value = dates[0];
    updateAssessmentStudentList(); // Liste aktualisieren
  }
}

/**
 * Aktualisiert die Schülerliste im Bewertungs-Tab
 * FEHLERBEHEBUNG 2: Funktion überarbeitet
 */
function updateAssessmentStudentList() {
  console.log("updateAssessmentStudentList wurde aufgerufen");
  
  if (!assessmentStudentList || !assessmentContent) {
    console.error("assessmentStudentList oder assessmentContent nicht gefunden");
    return;
  }
  
  const selectedDate = assessmentDateSelect.value;
  assessmentStudentList.innerHTML = '';
  
  console.log("Ausgewähltes Datum:", selectedDate);
  
  if (!selectedDate) {
    assessmentStudentList.innerHTML = '<li>Bitte wählen Sie ein Datum</li>';
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Willkommen bei der WBS Bewertungsapp</h2>
        <p>Bitte wählen Sie einen Prüfungstag und Prüfling aus der Liste oder legen Sie einen neuen Prüfling an.</p>
      </div>
    `;
    return;
  }
  
  // Überprüfen, ob Schüler für dieses Datum vorhanden sind
  const studentsForDate = teacherData.students.filter(s => s.examDate === selectedDate);
  console.log(`Gefundene Prüflinge für ${selectedDate}:`, studentsForDate.length);
  
  if (studentsForDate.length === 0) {
    assessmentStudentList.innerHTML = '<li>Keine Prüflinge für dieses Datum</li>';
    return;
  }
  
  // Schüler anzeigen
  studentsForDate.forEach(student => {
    const assessment = teacherData.assessments[student.id] || {};
    const finalGrade = assessment.finalGrade || '-';
    
    const li = document.createElement('li');
    li.className = 'student-item';
    li.dataset.id = student.id;
    li.innerHTML = `
      <div class="student-name">${student.name}</div>
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
  
  // Automatisch den ersten Schüler auswählen
  if (studentsForDate.length > 0) {
    const firstItem = assessmentStudentList.querySelector('.student-item');
    if (firstItem) {
      firstItem.click();
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
      </div>
      
      <div class="info-text-container">
        <h3>Informationen zum Prüfling</h3>
        <textarea id="studentInfoText" rows="6" placeholder="Notizen zum Prüfling eingeben...">${infoText}</textarea>
      </div>
      
      <div class="final-grade-display">Ø ${avgGrade || '0.0'}</div>
      
      <div class="final-grade-input">
        <label for="finalGrade">Endnote:</label>
        <input type="number" id="finalGrade" min="1" max="6" step="0.1" value="${finalGrade !== '-' ? finalGrade : ''}">
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
        <div class="category-grade">${grade || '-'}</div>
        <div class="grade-buttons" data-category="${category.id}">
    `;
    for (let i = 0; i <= 6; i++) {
      const isSelected = grade === i;
      html += `
        <button class="grade-button grade-${i} ${isSelected ? 'selected' : ''}" data-grade="${i}">${i}</button>
      `;
    }
    html += `
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  assessmentContent.innerHTML = html;
  
  // Eventlistener für Notenwahl-Buttons
  document.querySelectorAll(".grade-buttons .grade-button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const category = btn.parentElement.dataset.category;
      const grade = parseInt(btn.dataset.grade);
      const buttons = btn.parentElement.querySelectorAll("button");
      buttons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      btn.parentElement.previousElementSibling.textContent = grade || '-';
      if (!teacherData.assessments[student.id]) {
        teacherData.assessments[student.id] = {};
      }
      teacherData.assessments[student.id][category] = grade;
      const newAvg = calculateAverageGrade(teacherData.assessments[student.id]);
      document.querySelector(".final-grade-display").textContent = `Ø ${newAvg || '0.0'}`;
      if (!teacherData.assessments[student.id].finalGrade) {
        teacherData.assessments[student.id].finalGrade = parseFloat(newAvg);
        const fgInput = document.getElementById("finalGrade");
        if (fgInput) fgInput.value = newAvg;
      }
      await saveTeacherData();
      updateAssessmentStudentList();
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
      teacherData.assessments[student.id].finalGrade = finalGradeValue;
      await saveTeacherData();
      updateAssessmentStudentList();
      showNotification("Endnote wurde gespeichert.");
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
      document.getElementById("finalGrade").value = avgGrade;
      teacherData.assessments[student.id].finalGrade = parseFloat(avgGrade);
      await saveTeacherData();
      updateAssessmentStudentList();
      showNotification("Durchschnitt als Endnote übernommen.");
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
        teacherData.assessments[student.id].infoText = infoTextArea.value;
        await saveTeacherData();
        infoTextArea.dataset.changed = "false";
        showNotification("Informationstext gespeichert.");
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
  }
  hideLoader();
  editGradeModal.style.display = "none";
  selectedGradeStudent = null;
}

/**
 * Aktualisiert den Übersichts-Tab
 */
function updateOverviewTab() {
  populateOverviewYearSelect();
  populateOverviewDateSelect();
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
 * Aktualisiert den Inhalt der Übersicht
 */
function updateOverviewContent() {
  if (!overviewTable) return;
  const selectedYear = overviewYearSelect.value;
  const selectedDate = overviewDateSelect.value;
  const tbody = overviewTable.querySelector('tbody');
  tbody.innerHTML = '';
  let filteredStudents = [...teacherData.students];
  if (selectedYear) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === selectedYear);
  }
  if (selectedDate) {
    filteredStudents = filteredStudents.filter(s => s.examDate === selectedDate);
  }
  filteredStudents.sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
  if (filteredStudents.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="12">Keine Prüflinge gefunden</td>';
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
      <td>${assessment.presentation || '-'}</td>
      <td>${assessment.content || '-'}</td>
      <td>${assessment.language || '-'}</td>
      <td>${assessment.impression || '-'}</td>
      <td>${assessment.examination || '-'}</td>
      <td>${assessment.reflection || '-'}</td>
      <td>${assessment.expertise || '-'}</td>
      <td>${assessment.documentation || '-'}</td>
      <td>${finalGrade}</td>
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
  hideLoader();
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
      textContent += `Endnote: ${finalGrade}\n`;
      textContent += `Durchschnitt: ${avgGrade || '-'}\n\n`;
      
      // Bewertungskategorien
      textContent += "Bewertungen:\n";
      ASSESSMENT_CATEGORIES.forEach(category => {
        textContent += `- ${category.name}: ${a[category.id] || '-'}\n`;
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
  const exportAsTXT = document.getElementById('exportTXT').checked;
  
  // Filter anwenden
  const selectedYear = settingsYearSelect.value;
  const selectedDate = settingsDateSelect.value;
  let filteredStudents = [...teacherData.students];
  
  if (selectedYear) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === selectedYear);
  }
  if (selectedDate) {
    filteredStudents = filteredStudents.filter(s => s.examDate === selectedDate);
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
}