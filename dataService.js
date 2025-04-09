// js/dataService.js
import { ASSESSMENT_CATEGORIES } from "./constants.js";
import { supabaseClient } from "./supabaseClient.js";

export let teacherData = {
  students: [],
  assessments: {}
};

export let currentUser = null;

// Führt eine Migration älterer Kategorien zur neuen Struktur durch
function migrateAssessmentCategories() {
  const categoryMapping = {
    organization: "presentation",
    workBehavior: "content",
    teamwork: "language",
    quality: "impression",
    reflection: "reflection",
    documentation: "documentation"
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
    ASSESSMENT_CATEGORIES.forEach((category) => {
      if (!assessment.hasOwnProperty(category.id)) {
        assessment[category.id] = 2;
      }
    });
    if (!assessment.hasOwnProperty("infoText")) {
      assessment["infoText"] = "";
    }
  }
}

// Lädt die Daten eines Lehrers
export async function loadTeacherData() {
  if (!currentUser) return false;
  try {
    const { data, error } = await supabaseClient
      .from("wbs_data")
      .select("*")
      .eq("teacher_code", currentUser.code)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Fehler beim Laden:", error);
      return false;
    }
    if (data) {
      teacherData = data.data;
      migrateAssessmentCategories();
      return true;
    } else {
      teacherData = { students: [], assessments: {} };
      return await saveTeacherData();
    }
  } catch (error) {
    console.error("Fehler in loadTeacherData:", error);
    return false;
  }
}

// Speichert die Daten eines Lehrers
export async function saveTeacherData() {
  if (!currentUser) return false;
  try {
    const { error } = await supabaseClient
      .from("wbs_data")
      .upsert({
        teacher_code: currentUser.code,
        teacher_name: currentUser.name,
        data: teacherData,
        updated_at: new Date().toISOString()
      }, { onConflict: "teacher_code" });

    if (error) {
      console.error("Fehler beim Speichern der Daten:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Fehler in saveTeacherData:", error);
    return false;
  }
}
