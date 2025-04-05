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