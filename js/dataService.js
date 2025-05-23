// js/dataService.js

import { ASSESSMENT_CATEGORIES } from "./constants.js";
import { db } from "./firebaseClient.js";

/**
 * Globale Datenstruktur, in der alle Studierenden (students) und
 * deren Bewertungen (assessments) gespeichert werden.
 */
export let teacherData = {
  students: [],
  assessments: {}
};

/**
 * Der aktuell eingeloggte Lehrer. Enthält Lehrername, Kürzel und Passwort.
 */
export let currentUser = {
  name: null,
  code: null,
  password: null
};

/**
 * Diese Funktion passt alte Bewertungs-Kategorien an die neuen Kategorien an,
 * falls ältere Datenstrukturen vorhanden sind.
 */
function migrateAssessmentCategories() {
  const categoryMapping = {
    organization: "presentation",
    workBehavior: "content",
    teamwork: "language",
    quality: "impression",
    reflection: "reflection",
    documentation: "documentation"
  };

  // Für jeden Schüler die Bewertungen durchgehen und ggf. umbenennen
  for (const studentId in teacherData.assessments) {
    const assessment = teacherData.assessments[studentId];
    if (!assessment) continue; // Schutz vor undefined

    // Alte Schlüssel durch neue ersetzen
    for (const oldCategory in categoryMapping) {
      if (assessment.hasOwnProperty(oldCategory)) {
        const newCategory = categoryMapping[oldCategory];
        assessment[newCategory] = assessment[oldCategory];
        if (oldCategory !== newCategory) {
          delete assessment[oldCategory];
        }
      }
    }

    // Dafür sorgen, dass alle erwarteten Kategorien existieren
    ASSESSMENT_CATEGORIES.forEach((category) => {
      if (!assessment.hasOwnProperty(category.id)) {
        // Beispielsweise Standard-Wert 2 anlegen
        assessment[category.id] = 2;
      }
    });

    // Auch ein Info-Text sollte immer existieren
    if (!assessment.hasOwnProperty("infoText")) {
      assessment["infoText"] = "";
    }
  }
}

/**
 * Lädt die Lehrerdaten aus Firebase für das Kürzel in currentUser.code.
 * Falls keine Daten vorliegen, wird teacherData neu angelegt und gespeichert.
 */
export async function loadTeacherData() {
  if (!currentUser.code) return false;
  try {
    // Sicherheitscheck: Firebase muss initialisiert sein
    if (!db) {
      console.error("Firestore nicht initialisiert!");
      return false;
    }

    // Eintrag mit passendem Kürzel laden
    const docRef = db.collection("wbs_data").doc(currentUser.code);
    const doc = await docRef.get();

    // Wenn Daten vorhanden => local übernehmen
    if (doc.exists) {
      const data = doc.data();
      if (data && data.data) {
        teacherData = data.data;
        migrateAssessmentCategories();
        console.log("Lehrerdaten erfolgreich geladen");
        return true;
      } else {
        console.error("Datenstruktur ungültig:", data);
        teacherData = {
          students: [],
          assessments: {}
        };
        return await saveTeacherData();
      }
    } 
    // Ansonsten: neue Struktur speichern
    else {
      console.log("Keine vorhandenen Daten gefunden, erstelle neue Struktur");
      teacherData = {
        students: [],
        assessments: {}
      };
      return await saveTeacherData();
    }
  } catch (error) {
    console.error("Fehler in loadTeacherData:", error.code, error.message, error);
    alert("Fehler beim Laden der Lehrerdaten. Bitte prüfen Sie die Firebase-Berechtigungen.");
    return false;
  }
}

/**
 * Speichert teacherData und currentUser in Firebase.
 * Falls es für das Kürzel bereits Einträge gibt, wird ein Update ausgeführt.
 */
export async function saveTeacherData() {
  if (!currentUser.code) return false;
  try {
    // Sicherheitscheck: Firebase muss initialisiert sein
    if (!db) {
      console.error("Firestore nicht initialisiert!");
      return false;
    }
    
    // Prüfen, ob die Datenstruktur gültig ist
    if (!teacherData || !teacherData.students || !teacherData.assessments) {
      console.error("Ungültige Datenstruktur:", teacherData);
      return false;
    }

    await db.collection("wbs_data").doc(currentUser.code).set({
      teacher_code: currentUser.code,
      teacher_name: currentUser.name,
      data: teacherData,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log("Lehrerdaten erfolgreich gespeichert");
    return true;
  } catch (error) {
    console.error("Fehler in saveTeacherData:", error.code, error.message, error);
    alert("Fehler beim Speichern der Daten. Bitte prüfen Sie die Firebase-Berechtigungen.");
    return false;
  }
}
