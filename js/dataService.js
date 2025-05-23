// js/dataService.js

import { DEFAULT_ASSESSMENT_CATEGORIES, DEFAULT_ASSESSMENT_TEMPLATES } from "./constants.js";
import { db } from "./firebaseClient.js";

/**
 * Globale Datenstruktur, erweitert um Bewertungsraster und Lehrer-Zuordnungen
 */
export let teacherData = {
  students: [],
  assessments: {},
  assessmentTemplates: [], // Eigene Bewertungsraster
  settings: {
    defaultTemplate: "wbs_standard"
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
 * Migriert alte Bewertungsdaten zur neuen Struktur
 */
function migrateToNewStructure() {
  // Alte Kategorie-Migration (bleibt bestehen)
  const categoryMapping = {
    organization: "presentation",
    workBehavior: "content",
    teamwork: "language",
    quality: "impression",
    reflection: "reflection",
    documentation: "documentation"
  };

  // Für jeden Schüler die Bewertungen durchgehen
  for (const studentId in teacherData.assessments) {
    const assessment = teacherData.assessments[studentId];
    if (!assessment) continue;

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

    // Stelle sicher, dass alle Standard-Kategorien existieren
    DEFAULT_ASSESSMENT_CATEGORIES.forEach((category) => {
      if (!assessment.hasOwnProperty(category.id)) {
        assessment[category.id] = 2;
      }
    });

    // Info-Text und Template-Zuordnung
    if (!assessment.hasOwnProperty("infoText")) {
      assessment["infoText"] = "";
    }
    if (!assessment.hasOwnProperty("templateId")) {
      assessment["templateId"] = "wbs_standard";
    }
  }

  // Migriere Schüler-Daten (assignedTeacher hinzufügen)
  teacherData.students.forEach(student => {
    if (!student.assignedTeacher) {
      student.assignedTeacher = currentUser.code; // Standard: Aktueller Lehrer
    }
  });

  // Stelle sicher, dass Bewertungsraster existieren
  if (!teacherData.assessmentTemplates || teacherData.assessmentTemplates.length === 0) {
    teacherData.assessmentTemplates = [...DEFAULT_ASSESSMENT_TEMPLATES];
  }

  // Stelle sicher, dass Einstellungen existieren
  if (!teacherData.settings) {
    teacherData.settings = { defaultTemplate: "wbs_standard" };
  }
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
        migrateToNewStructure();
        console.log("Lehrerdaten erfolgreich geladen");
        return true;
      } else {
        console.error("Datenstruktur ungültig:", data);
        teacherData = {
          students: [],
          assessments: {},
          assessmentTemplates: [...DEFAULT_ASSESSMENT_TEMPLATES],
          settings: { defaultTemplate: "wbs_standard" }
        };
        return await saveTeacherData();
      }
    } else {
      console.log("Keine vorhandenen Daten gefunden, erstelle neue Struktur");
      teacherData = {
        students: [],
        assessments: {},
        assessmentTemplates: [...DEFAULT_ASSESSMENT_TEMPLATES],
        settings: { defaultTemplate: "wbs_standard" }
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
 * Speichert die Lehrerdaten in Firebase
 */
export async function saveTeacherData() {
  if (!currentUser.code) return false;
  try {
    if (!db) {
      console.error("Firestore nicht initialisiert!");
      return false;
    }
    
    // Validiere Datenstruktur
    if (!teacherData || !teacherData.students || !teacherData.assessments) {
      console.error("Ungültige Datenstruktur:", teacherData);
      return false;
    }

    // Stelle sicher, dass alle Felder existieren
    if (!teacherData.assessmentTemplates) {
      teacherData.assessmentTemplates = [...DEFAULT_ASSESSMENT_TEMPLATES];
    }
    if (!teacherData.settings) {
      teacherData.settings = { defaultTemplate: "wbs_standard" };
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

/**
 * Erstellt ein neues Bewertungsraster
 */
export function createAssessmentTemplate(name, description, categories) {
  const newTemplate = {
    id: generateTemplateId(),
    name: name.trim(),
    description: description.trim(),
    categories: categories.map(cat => ({
      id: cat.id || generateCategoryId(),
      name: cat.name.trim(),
      weight: cat.weight || 1
    })),
    isDefault: false,
    createdBy: currentUser.code,
    createdAt: new Date().toISOString()
  };

  teacherData.assessmentTemplates.push(newTemplate);
  return newTemplate;
}

/**
 * Aktualisiert ein Bewertungsraster
 */
export function updateAssessmentTemplate(templateId, name, description, categories) {
  const index = teacherData.assessmentTemplates.findIndex(t => t.id === templateId);
  if (index === -1) {
    throw new Error("Bewertungsraster nicht gefunden");
  }

  const template = teacherData.assessmentTemplates[index];
  if (template.isDefault) {
    throw new Error("Standard-Raster können nicht bearbeitet werden");
  }

  template.name = name.trim();
  template.description = description.trim();
  template.categories = categories.map(cat => ({
    id: cat.id || generateCategoryId(),
    name: cat.name.trim(),
    weight: cat.weight || 1
  }));
  template.updatedAt = new Date().toISOString();

  return template;
}

/**
 * Löscht ein Bewertungsraster
 */
export function deleteAssessmentTemplate(templateId) {
  const index = teacherData.assessmentTemplates.findIndex(t => t.id === templateId);
  if (index === -1) {
    throw new Error("Bewertungsraster nicht gefunden");
  }

  const template = teacherData.assessmentTemplates[index];
  if (template.isDefault) {
    throw new Error("Standard-Raster können nicht gelöscht werden");
  }

  // Prüfe, ob das Raster verwendet wird
  const isUsed = Object.values(teacherData.assessments).some(
    assessment => assessment.templateId === templateId
  );

  if (isUsed) {
    throw new Error("Bewertungsraster wird noch verwendet und kann nicht gelöscht werden");
  }

  teacherData.assessmentTemplates.splice(index, 1);
  return template;
}

/**
 * Gibt ein Bewertungsraster zurück
 */
export function getAssessmentTemplate(templateId) {
  return teacherData.assessmentTemplates.find(t => t.id === templateId) || 
         DEFAULT_ASSESSMENT_TEMPLATES.find(t => t.id === templateId);
}

/**
 * Gibt alle verfügbaren Bewertungsraster zurück
 */
export function getAllAssessmentTemplates() {
  // Kombiniere eigene Templates mit Standard-Templates
  const allTemplates = [...teacherData.assessmentTemplates];
  
  // Füge Standard-Templates hinzu, die noch nicht vorhanden sind
  DEFAULT_ASSESSMENT_TEMPLATES.forEach(defaultTemplate => {
    const exists = allTemplates.some(t => t.id === defaultTemplate.id);
    if (!exists) {
      allTemplates.push(defaultTemplate);
    }
  });
  
  return allTemplates.sort((a, b) => {
    // Standard-Templates zuerst, dann alphabetisch
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Gibt Schüler zurück, die dem aktuellen Lehrer zugeordnet sind
 */
export function getAssignedStudents() {
  return teacherData.students.filter(student => 
    student.assignedTeacher === currentUser.code
  );
}

/**
 * Gibt alle Schüler zurück (für Übersichts-Zwecke)
 */
export function getAllStudents() {
  return teacherData.students;
}

/**
 * Erstellt einen neuen Schüler mit Lehrer-Zuordnung
 */
export function createStudent(name, examDate, topic, assignedTeacher, templateId = null) {
  const newId = generateId();
  const newStudent = {
    id: newId,
    name: name.trim(),
    examDate: examDate,
    topic: topic?.trim() || "",
    assignedTeacher: assignedTeacher || currentUser.code,
    templateId: templateId || teacherData.settings.defaultTemplate,
    createdBy: currentUser.code,
    createdAt: new Date().toISOString()
  };

  teacherData.students.push(newStudent);
  
  // Initialisiere Bewertung mit ausgewähltem Template
  const template = getAssessmentTemplate(newStudent.templateId);
  teacherData.assessments[newId] = {
    templateId: newStudent.templateId,
    infoText: "",
    finalGrade: 2.0
  };

  // Initialisiere alle Kategorien des Templates
  if (template && template.categories) {
    template.categories.forEach(category => {
      teacherData.assessments[newId][category.id] = 2;
    });
  }

  return newStudent;
}

/**
 * Hilfsfunktionen
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function generateTemplateId() {
  return 'template_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function generateCategoryId() {
  return 'cat_' + Date.now().toString(36) + Math.random().toString(36).substring(2);
}
