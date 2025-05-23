// js/dataService.js - ÜBERARBEITET für Gruppen-System

import { DEFAULT_ASSESSMENT_CATEGORIES, DEFAULT_ASSESSMENT_TEMPLATES } from "./constants.js";
import { db } from "./firebaseClient.js";

/**
 * Globale Datenstruktur - NEUE STRUKTUR mit Gruppen
 */
export let teacherData = {
  groups: [],           // Array von Gruppen (ersetzt students)
  assessments: {},      // Bewertungen pro Schüler-ID
  assessmentTemplates: [],
  settings: {
    defaultTemplate: "wbs_standard",
    currentSchoolYear: getCurrentSchoolYear(),
    preferredSorting: "theme", // "theme", "date", "alphabetical"
    themeSortOrder: {}         // Speichert Reihenfolge der Themen
  }
};

/**
 * Der aktuell eingeloggte Lehrer
 */
export let currentUser = {
  name: null,
  code: null,
  password: null
};

/**
 * Bewertungsstatus-Konstanten
 */
export const ASSESSMENT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress', 
  COMPLETED: 'completed'
};

/**
 * Migriert alte Schüler-Daten zur neuen Gruppen-Struktur
 */
function migrateToGroupStructure() {
  // Wenn noch alte "students"-Struktur vorhanden ist, migriere sie
  if (teacherData.students && Array.isArray(teacherData.students)) {
    console.log("Migriere alte Schüler-Struktur zu Gruppen...");
    
    // Gruppiere Schüler nach Thema und Datum
    const groupsByThemeAndDate = {};
    
    teacherData.students.forEach(oldStudent => {
      const key = `${oldStudent.topic || 'Ohne Thema'}_${oldStudent.examDate}`;
      if (!groupsByThemeAndDate[key]) {
        groupsByThemeAndDate[key] = {
          id: generateId(),
          theme: oldStudent.topic || 'Ohne Thema',
          examDate: oldStudent.examDate,
          responsibleTeacher: oldStudent.createdBy || currentUser.code,
          createdBy: oldStudent.createdBy || currentUser.code,
          createdAt: oldStudent.createdAt || new Date().toISOString(),
          schoolYear: oldStudent.schoolYear || getSchoolYearFromDate(oldStudent.examDate),
          students: []
        };
      }
      
      // Konvertiere Schüler
      const newStudent = {
        id: oldStudent.id, // Behalte alte ID für Bewertungen
        name: oldStudent.name,
        assignedTeacher: oldStudent.assignedTeacher || oldStudent.createdBy || currentUser.code,
        assessmentDate: null, // Wird vom bewertenden Lehrer gesetzt
        templateId: oldStudent.templateId || "wbs_standard"
      };
      
      groupsByThemeAndDate[key].students.push(newStudent);
    });
    
    // Konvertiere zu Array
    teacherData.groups = Object.values(groupsByThemeAndDate);
    
    // Lösche alte Struktur
    delete teacherData.students;
    
    console.log(`Migration abgeschlossen: ${teacherData.groups.length} Gruppen erstellt`);
  }
  
  // Stelle sicher, dass neue Felder existieren
  if (!teacherData.settings) {
    teacherData.settings = {};
  }
  if (!teacherData.settings.currentSchoolYear) {
    teacherData.settings.currentSchoolYear = getCurrentSchoolYear();
  }
  if (!teacherData.settings.preferredSorting) {
    teacherData.settings.preferredSorting = "theme";
  }
  if (!teacherData.settings.themeSortOrder) {
    teacherData.settings.themeSortOrder = {};
  }
  
  // Bewertungen migrieren (bleibt gleich, da Schüler-IDs beibehalten werden)
  migrateAssessments();
}

/**
 * Migriert Bewertungsdaten zur neuen Struktur
 */
function migrateAssessments() {
  for (const studentId in teacherData.assessments) {
    const assessment = teacherData.assessments[studentId];
    if (!assessment) continue;

    // Alte Kategorie-Migration (bleibt bestehen)
    const categoryMapping = {
      organization: "presentation",
      workBehavior: "content",
      teamwork: "language",
      quality: "impression",
      reflection: "reflection",
      documentation: "documentation"
    };

    for (const oldCategory in categoryMapping) {
      if (assessment.hasOwnProperty(oldCategory)) {
        const newCategory = categoryMapping[oldCategory];
        assessment[newCategory] = assessment[oldCategory];
        if (oldCategory !== newCategory) {
          delete assessment[oldCategory];
        }
      }
    }

    // Stelle sicher, dass alle Standard-Kategorien existieren
    DEFAULT_ASSESSMENT_CATEGORIES.forEach((category) => {
      if (!assessment.hasOwnProperty(category.id)) {
        assessment[category.id] = 2;
      }
    });

    // Erforderliche Felder
    if (!assessment.hasOwnProperty("infoText")) {
      assessment["infoText"] = "";
    }
    if (!assessment.hasOwnProperty("templateId")) {
      assessment["templateId"] = "wbs_standard";
    }
    if (!assessment.hasOwnProperty("status")) {
      assessment["status"] = determineAssessmentStatus(assessment);
    }
    if (!assessment.hasOwnProperty("lastModified")) {
      assessment["lastModified"] = new Date().toISOString();
    }
  }

  // Stelle sicher, dass Bewertungsraster existieren
  if (!teacherData.assessmentTemplates || teacherData.assessmentTemplates.length === 0) {
    teacherData.assessmentTemplates = [...DEFAULT_ASSESSMENT_TEMPLATES];
  }
}

/**
 * Bestimmt den Bewertungsstatus basierend auf vorhandenen Daten
 */
function determineAssessmentStatus(assessment) {
  if (!assessment) return ASSESSMENT_STATUS.NOT_STARTED;
  
  const hasGrades = Object.keys(assessment).some(key => 
    key !== 'infoText' && key !== 'templateId' && key !== 'finalGrade' && 
    key !== 'status' && key !== 'lastModified' && 
    typeof assessment[key] === 'number' && assessment[key] > 0
  );
  
  const hasFinalGrade = assessment.finalGrade && assessment.finalGrade > 0;
  
  if (hasFinalGrade) return ASSESSMENT_STATUS.COMPLETED;
  if (hasGrades || (assessment.infoText && assessment.infoText.trim())) return ASSESSMENT_STATUS.IN_PROGRESS;
  return ASSESSMENT_STATUS.NOT_STARTED;
}

/**
 * Berechnet das Schuljahr aus einem Datum
 */
function getSchoolYearFromDate(dateString) {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  
  if (month >= 9) return `${year}/${year + 1}`;
  else return `${year - 1}/${year}`;
}

/**
 * Lädt die Lehrerdaten aus Firebase
 */
export async function loadTeacherData() {
  if (!currentUser.code) return false;
  try {
    if (!db) {
      console.error("Firestore nicht initialisiert!");
      return false;
    }

    const docRef = db.collection("wbs_data").doc(currentUser.code);
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      if (data && data.data) {
        teacherData = data.data;
        migrateToGroupStructure();
        console.log("Lehrerdaten erfolgreich geladen");
        return true;
      } else {
        console.error("Datenstruktur ungültig:", data);
        initializeEmptyTeacherData();
        return await saveTeacherData();
      }
    } else {
      console.log("Keine vorhandenen Daten gefunden, erstelle neue Struktur");
      initializeEmptyTeacherData();
      return await saveTeacherData();
    }
  } catch (error) {
    console.error("Fehler in loadTeacherData:", error);
    alert("Fehler beim Laden der Lehrerdaten. Bitte prüfen Sie die Firebase-Berechtigungen.");
    return false;
  }
}

/**
 * Initialisiert leere Lehrerdaten
 */
function initializeEmptyTeacherData() {
  teacherData = {
    groups: [],
    assessments: {},
    assessmentTemplates: [...DEFAULT_ASSESSMENT_TEMPLATES],
    settings: {
      defaultTemplate: "wbs_standard",
      currentSchoolYear: getCurrentSchoolYear(),
      preferredSorting: "theme",
      themeSortOrder: {}
    }
  };
}

/**
 * Speichert die Lehrerdaten in Firebase
 */
export async function saveTeacherData() {
  if (!currentUser.code) return false;
  try {
    if (!db) {
      console.error("Firestore nicht initialisiert!");
      return false;
    }
    
    if (!teacherData || !teacherData.groups || !teacherData.assessments) {
      console.error("Ungültige Datenstruktur:", teacherData);
      return false;
    }

    await db.collection("wbs_data").doc(currentUser.code).
