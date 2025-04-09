// js/supabaseClient.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./constants.js";

export let supabaseClient = null;

/**
 * Initialisiert die Datenbankverbindung zu Supabase
 */
export async function initDatabase() {
  try {
    if (typeof supabase === "undefined") {
      console.error("Supabase ist nicht definiert.");
      return false;
    }
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      db: { schema: "public" },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: { "Cache-Control": "no-cache", "Pragma": "no-cache" }
      }
    });
    console.log("Supabase-Client erfolgreich initialisiert");

    try {
      const { error } = await supabaseClient.rpc("create_wbs_table_if_not_exists");
      if (error) {
        console.error("Fehler beim Erstellen der Tabelle via RPC:", error);
        await createTableManually();
      }
    } catch (err) {
      console.error("Fehler bei RPC-Aufruf:", err);
      await createTableManually();
    }

    return true;
  } catch (error) {
    console.error("Fehler bei der Datenbankinitialisierung:", error);
    return false;
  }
}

/**
 * Erstellt die Datenbanktabelle manuell, falls RPC nicht funktioniert
 */
async function createTableManually() {
  try {
    console.log("Tabelle wird manuell erstellt...");
    const { data, error } = await supabaseClient
      .from("wbs_data")
      .select("count(*)")
      .limit(1);
    if (error && error.code === "42P01") {
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
        const { error: sqlError } = await supabaseClient.rpc("execute_sql", {
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
