import { createClient } from '@supabase/supabase-js';

// Aktualisierte Supabase-Verbindungsdaten
const SUPABASE_URL = 'https://mljhyqlvllhgrzemsoh.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_KEY || 'YOUR_ANON_KEY_HERE'; // Ersetzen Sie dies mit Ihrem tatsächlichen Key

// Supabase-Client erstellen
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

// Datenbank initialisieren
export async function initDatabase() {
  try {
    // Prüfen, ob Tabelle existiert
    const { error } = await supabase.rpc('create_wbs_table_if_not_exists');
    
    if (error) {
      console.error("Fehler beim Erstellen der Tabelle:", error);
      // Versuch, die Tabelle manuell zu erstellen
      await createTableManually();
    }
    return true;
  } catch (error) {
    console.error("Fehler bei der Datenbankinitialisierung:", error);
    await createTableManually();
    return false;
  }
}

// Manuelles Erstellen der Tabelle (Fallback)
async function createTableManually() {
  try {
    // Zuerst prüfen, ob die Tabelle existiert
    const { data, error } = await supabase
      .from('wbs_data')
      .select('count(*)')
      .limit(1);
    
    if (error && error.code === '42P01') {
      // Tabelle existiert nicht, mit SQL erstellen
      const { error: sqlError } = await supabase.rpc('execute_sql', {
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
        throw new Error("Datenbank konnte nicht initialisiert werden");
      }
    }
    return true;
  } catch (error) {
    console.error("Fehler in createTableManually:", error);
    // Letzter Fallback - direktes Einfügen versuchen
    try {
      // Direkte Einfügung versuchen, um den Datensatz zu erstellen
      const { error: insertError } = await supabase
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
        throw insertError;
      }
      return true;
    } catch (insertError) {
      console.error("Letzter Fallback-Einfügeversuch fehlgeschlagen:", insertError);
      throw insertError;
    }
  }
}

// Lehrerdaten laden
export async function loadTeacherData(teacherCode) {
  try {
    const { data, error } = await supabase
      .from('wbs_data')
      .select('*')
      .eq('teacher_code', teacherCode)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Fehler beim Laden der Lehrerdaten:", error);
      throw error;
    }
    
    if (data) {
      return data.data;
    } else {
      // Neue Datenstruktur für diesen Lehrer erstellen
      const newData = {
        students: [],
        assessments: {}
      };
      
      // Neue Struktur speichern
      await saveTeacherData(teacherCode, teacherCode, newData);
      return newData;
    }
  } catch (error) {
    console.error("Fehler in loadTeacherData:", error);
    
    // Wenn der Fehler "relation does not exist" ist, erstellen Sie sie
    if (error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
      // Versuchen Sie, die Datenbank erneut zu initialisieren
      await initDatabase();
      
      // Versuchen Sie dann, einen Datensatz für diesen Lehrer zu erstellen
      try {
        const newData = { students: [], assessments: {} };
        await saveTeacherData(teacherCode, teacherCode, newData);
        return newData;
      } catch (insertError) {
        console.error("Fehler beim Einfügen initialer Daten:", insertError);
        throw insertError;
      }
    } else {
      throw error;
    }
  }
}

// Lehrerdaten speichern
export async function saveTeacherData(teacherCode, teacherName, data) {
  try {
    const { error } = await supabase
      .from('wbs_data')
      .upsert({
        teacher_code: teacherCode,
        teacher_name: teacherName,
        data: data,
        updated_at: new Date().toISOString()
      }, { onConflict: 'teacher_code' });
    
    if (error) {
      console.error("Fehler beim Speichern der Lehrerdaten:", error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Fehler in saveTeacherData:", error);
    
    // Wenn Tabelle nicht existiert, erstellen und erneut versuchen
    if (error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
      await initDatabase();
      
      // Nach Tabellenerstellung erneut versuchen
      try {
        const { error: retryError } = await supabase
          .from('wbs_data')
          .upsert({
            teacher_code: teacherCode,
            teacher_name: teacherName,
            data: data,
            updated_at: new Date().toISOString()
          }, { onConflict: 'teacher_code' });
          
        if (retryError) {
          console.error("Fehler beim Speichern der Lehrerdaten beim erneuten Versuch:", retryError);
          return false;
        }
        
        return true;
      } catch (retryError) {
        console.error("Fehler beim Speichern der Lehrerdaten beim erneuten Versuch:", retryError);
        return false;
      }
    } else {
      return false;
    }
  }
}