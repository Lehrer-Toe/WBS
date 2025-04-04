/**
 * Database module for WBS Bewertungssystem
 * Handles database connection and operations
 */

// Globale Variablen für die DB
let supabaseClient = null;
let currentUser = null;
let teacherData = {
  students: [],
  assessments: {}
};

const SUPABASE_URL = "https://mljhyhqlvllhgrzemsoh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samh5aHFsdmxsaGdyemVtc29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NjYwNjEsImV4cCI6MjA1OTM0MjA2MX0.L5H5e6Bx6yWM2ScHWIGJAL3JUDrFN4aJHUpjVxUDygA";

// Konstanten
const DEFAULT_TEACHERS = [
  { name: "Kretz", code: "KRE", password: "Luna" },
  { name: "Riffel", code: "RIF", password: "Luna" },
  { name: "Töllner", code: "TOE", password: "Luna" }
];

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
    
    const { error } = await supabaseClient.rpc('create_wbs_table_if_not_exists');
    if (error) {
      console.error("Fehler beim Erstellen der Tabelle:", error);
      await createTableManually();
    }
    
    hideLoader();
    return true;
  } catch (error) {
    console.error("Fehler bei der Datenbankinitialisierung:", error);
    await createTableManually();
    hideLoader();
    return false;
  }
}

/**
 * Erstellt die Tabelle manuell, falls die RPC nicht verfügbar ist
 */
async function createTableManually() {
  try {
    const { data, error } = await supabaseClient
      .from('wbs_data')
      .select('count(*)')
      .limit(1);
    
    if (error && error.code === '42P01') {
      const { error: sqlError } = await supabaseClient.rpc('execute_sql', {
        sql_query: `
          CREATE TABLE IF NOT EXISTS public.wbs_data (
            id SERIAL PRIMARY KEY,
            teacher_code TEXT NOT NULL,
            teacher_name TEXT NOT NULL,
            data JSONB NOT NULL DEFAULT '{"students":[], "assessments":{}}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
          );
          CREATE UNIQUE INDEX IF NOT EXISTS wbs_data_teacher_code_idx ON public.wbs_data (teacher_code);
        `
      });
      
      if (sqlError) {
        console.error("Fehler beim Erstellen der Tabelle mit SQL:", sqlError);
        showNotification("Datenbank konnte nicht initialisiert werden.", "error");
      }
    }
  } catch (error) {
    console.error("Fehler in createTableManually:", error);
    try {
      const { error: insertError } = await supabaseClient
        .from('wbs_data')
        .upsert([
          {
            teacher_code: 'DUMMY_CODE',
            teacher_name: 'Dummy Teacher',
            data: { students: [], assessments: {} }
          }
        ]);
      
      if (insertError) {
        console.error("Fehler bei direkter Einfügung:", insertError);
      }
    } catch (insertError) {
      console.error("Letzter Fallback-Einfügeversuch fehlgeschlagen:", insertError);
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
    if (error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
      await initDatabase();
      try {
        const { error: insertError } = await supabaseClient
          .from('wbs_data')
          .upsert([
            {
              teacher_code: currentUser.code,
              teacher_name: currentUser.name,
              data: { students: [], assessments: {} }
            }
          ]);
        if (insertError) {
          console.error("Error inserting initial data:", insertError);
          showNotification("Fehler beim Laden der Daten.", "error");
          return false;
        } else {
          teacherData = { students: [], assessments: {} };
          return true;
        }
      } catch (insertError) {
        console.error("Error inserting initial data:", insertError);
        showNotification("Fehler beim Laden der Daten.", "error");
        return false;
      }
    } else {
      showNotification("Fehler beim Laden der Daten.", "error");
      return false;
    }
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
    if (error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
      await initDatabase();
      try {
        const { error: retryError } = await supabaseClient
          .from('wbs_data')
          .upsert({
            teacher_code: currentUser.code,
            teacher_name: currentUser.name,
            data: teacherData,
            updated_at: new Date().toISOString()
          }, { onConflict: 'teacher_code' });
        if (retryError) {
          console.error("Error saving teacher data on retry:", retryError);
          showNotification("Fehler beim Speichern der Daten.", "error");
          return false;
        }
        return true;
      } catch (retryError) {
        console.error("Error saving teacher data on retry:", retryError);
        showNotification("Fehler beim Speichern der Daten.", "error");
        return false;
      }
    } else {
      showNotification("Fehler beim Speichern der Daten.", "error");
      return false;
    }
  }
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