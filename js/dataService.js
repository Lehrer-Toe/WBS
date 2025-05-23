// js/dataService.js

import { DEFAULT_ASSESSMENT_CATEGORIES, DEFAULT_ASSESSMENT_TEMPLATES } from "./constants.js";
import { db } from "./firebaseClient.js";

/**
 * Globale Datenstruktur, erweitert um Status-Tracking
 */
export let teacherData = {
  students: [],
  assessments: {},
  assessmentTemplates: [],
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
 * Bewertungsstatus-Konstanten
 */
export const ASSESSMENT_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress', 
  COMPLETED: 'completed'
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

    // Info-Text, Template-Zuordnung und Status
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

  // Migriere Schüler-Daten
  teacherData.students.forEach(student => {
    if (!student.assignedTeacher) {
      student.assignedTeacher = currentUser.code;
    }
    if (!student.createdBy) {
      student.createdBy = currentUser.code;
    }
    if (!student.templateId) {
      student.templateId = "wbs_standard";
    }
    if (!student.schoolYear) {
      student.schoolYear = getSchoolYearFromDate(student.examDate);
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
  const month = date.getMonth() + 1; // JavaScript months are 0-indexed
  
  // Schuljahr läuft von September bis August
  if (month >= 9) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
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
  const allTemplates = [...teacherData.assessmentTemplates];
  
  DEFAULT_ASSESSMENT_TEMPLATES.forEach(defaultTemplate => {
    const exists = allTemplates.some(t => t.id === defaultTemplate.id);
    if (!exists) {
      allTemplates.push(defaultTemplate);
    }
  });
  
  return allTemplates.sort((a, b) => {
    if (a.isDefault && !b.isDefault) return -1;
    if (!a.isDefault && b.isDefault) return 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * ERWEITERT: Gibt Schüler zurück, die dem aktuellen Lehrer zugeordnet sind (zum Bewerten)
 */
export function getAssignedStudents() {
  return teacherData.students.filter(student => 
    student.assignedTeacher === currentUser.code
  );
}

/**
 * ERWEITERT: Gibt Schüler zurück, die der aktuelle Lehrer erstellt hat (Übersicht)
 */
export function getCreatedStudents() {
  return teacherData.students.filter(student => 
    student.createdBy === currentUser.code
  );
}

/**
 * ERWEITERT: Gibt alle Schüler zurück, auf die der aktuelle Lehrer Zugriff hat
 */
export function getAccessibleStudents() {
  return teacherData.students.filter(student => 
    student.assignedTeacher === currentUser.code || student.createdBy === currentUser.code
  );
}

/**
 * NEU: Gibt Dashboard-Statistiken zurück
 */
export function getDashboardStats() {
  const accessibleStudents = getAccessibleStudents();
  const assignedStudents = getAssignedStudents();
  const createdStudents = getCreatedStudents();
  
  // Bewertungsstatus für zugewiesene Schüler
  const assessmentStats = {
    notStarted: 0,
    inProgress: 0,
    completed: 0
  };
  
  assignedStudents.forEach(student => {
    const assessment = teacherData.assessments[student.id];
    const status = assessment ? assessment.status : ASSESSMENT_STATUS.NOT_STARTED;
    
    switch (status) {
      case ASSESSMENT_STATUS.NOT_STARTED:
        assessmentStats.notStarted++;
        break;
      case ASSESSMENT_STATUS.IN_PROGRESS:
        assessmentStats.inProgress++;
        break;
      case ASSESSMENT_STATUS.COMPLETED:
        assessmentStats.completed++;
        break;
    }
  });
  
  // Schuljahr-Statistiken
  const currentSchoolYear = getCurrentSchoolYear();
  const studentsThisYear = accessibleStudents.filter(student => 
    student.schoolYear === currentSchoolYear
  );
  
  return {
    totalAccessible: accessibleStudents.length,
    totalAssigned: assignedStudents.length,
    totalCreated: createdStudents.length,
    studentsThisYear: studentsThisYear.length,
    assessmentStats,
    currentSchoolYear
  };
}

/**
 * NEU: Gibt das aktuelle Schuljahr zurück
 */
export function getCurrentSchoolYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  if (month >= 9) {
    return `${year}/${year + 1}`;
  } else {
    return `${year - 1}/${year}`;
  }
}

/**
 * NEU: Gibt Schüler nach Schuljahr zurück
 */
export function getStudentsBySchoolYear(schoolYear = null) {
  const accessibleStudents = getAccessibleStudents();
  
  if (!schoolYear) {
    return accessibleStudents;
  }
  
  return accessibleStudents.filter(student => student.schoolYear === schoolYear);
}

/**
 * NEU: Gibt alle verfügbaren Schuljahre zurück
 */
export function getAvailableSchoolYears() {
  const years = new Set();
  const accessibleStudents = getAccessibleStudents();
  
  accessibleStudents.forEach(student => {
    if (student.schoolYear) {
      years.add(student.schoolYear);
    }
  });
  
  // Aktuelles Schuljahr immer hinzufügen
  years.add(getCurrentSchoolYear());
  
  return Array.from(years).sort().reverse();
}

/**
 * Gibt alle Schüler zurück (für Admin-Zwecke)
 */
export function getAllStudents() {
  return teacherData.students;
}

/**
 * ERWEITERT: Erstellt einen neuen Schüler mit Status-Tracking
 */
export function createStudent(name, examDate, topic, assignedTeacher, templateId = null) {
  const newId = generateId();
  const schoolYear = getSchoolYearFromDate(examDate);
  
  const newStudent = {
    id: newId,
    name: name.trim(),
    examDate: examDate,
    topic: topic?.trim() || "",
    assignedTeacher: assignedTeacher || currentUser.code,
    templateId: templateId || teacherData.settings.defaultTemplate,
    createdBy: currentUser.code,
    createdAt: new Date().toISOString(),
    schoolYear: schoolYear
  };

  teacherData.students.push(newStudent);
  
  // Initialisiere Bewertung mit Status
  const template = getAssessmentTemplate(newStudent.templateId);
  teacherData.assessments[newId] = {
    templateId: newStudent.templateId,
    infoText: "",
    finalGrade: null,
    status: ASSESSMENT_STATUS.NOT_STARTED,
    lastModified: new Date().toISOString()
  };

  // Initialisiere alle Kategorien des Templates
  if (template && template.categories) {
    template.categories.forEach(category => {
      teacherData.assessments[newId][category.id] = 0; // 0 = nicht bewertet
    });
  }

  return newStudent;
}

/**
 * ERWEITERT: Aktualisiert den Bewertungsstatus
 */
export function updateAssessmentStatus(studentId) {
  const assessment = teacherData.assessments[studentId];
  if (!assessment) return;
  
  const oldStatus = assessment.status;
  const newStatus = determineAssessmentStatus(assessment);
  
  if (oldStatus !== newStatus) {
    assessment.status = newStatus;
    assessment.lastModified = new Date().toISOString();
  }
  
  return newStatus;
}

/**
 * NEU: Prüft, ob der aktuelle Lehrer bewerten darf
 */
export function canAssessStudent(student) {
  return student.assignedTeacher === currentUser.code;
}

/**
 * NEU: Prüft, ob der aktuelle Lehrer Zugriff auf den Schüler hat
 */
export function hasAccessToStudent(student) {
  return student.assignedTeacher === currentUser.code || student.createdBy === currentUser.code;
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
