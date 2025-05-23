// js/dataService.js - ÜBERARBEITET für Gruppen-System

import { DEFAULT_ASSESSMENT_CATEGORIES, DEFAULT_ASSESSMENT_TEMPLATES } from "./constants.js";
import { db } from "./firebaseClient.js";
import { systemSettings } from "./adminService.js";

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
  if (!dateString) return getCurrentSchoolYear();
  
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

    await db.collection("wbs_data").doc(currentUser.code).set({
      teacher_code: currentUser.code,
      teacher_name: currentUser.name,
      data: teacherData,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    console.log("Lehrerdaten erfolgreich gespeichert");
    return true;
  } catch (error) {
    console.error("Fehler in saveTeacherData:", error);
    alert("Fehler beim Speichern der Lehrerdaten. Bitte prüfen Sie die Firebase-Berechtigungen.");
    return false;
  }
}

/**
 * Erstellt eine neue Gruppe
 */
export function createGroup(theme, responsibleTeacher = currentUser.code) {
  const id = generateId();
  const newGroup = {
    id,
    theme,
    responsibleTeacher,
    createdBy: currentUser.code,
    createdAt: new Date().toISOString(),
    schoolYear: systemSettings?.currentSchoolYear || getCurrentSchoolYear(),
    examDate: null,
    students: []
  };
  
  teacherData.groups.push(newGroup);
  return newGroup;
}

/**
 * Fügt einen Schüler zu einer Gruppe hinzu
 */
export function addStudentToGroup(groupId, studentName, assignedTeacher = currentUser.code) {
  const group = teacherData.groups.find(g => g.id === groupId);
  if (!group) {
    throw new Error("Gruppe nicht gefunden");
  }
  
  if (group.students.length >= 4) {
    throw new Error("Maximale Anzahl an Schülern (4) in dieser Gruppe erreicht");
  }
  
  const studentId = generateId();
  const newStudent = {
    id: studentId,
    name: studentName,
    assignedTeacher,
    assessmentDate: null,
    templateId: teacherData.settings.defaultTemplate || "wbs_standard"
  };
  
  group.students.push(newStudent);
  
  // Initialisiere Assessment-Objekt
  if (!teacherData.assessments[studentId]) {
    teacherData.assessments[studentId] = {
      templateId: newStudent.templateId,
      status: ASSESSMENT_STATUS.NOT_STARTED,
      lastModified: new Date().toISOString()
    };
  }
  
  return newStudent;
}

/**
 * Liefert alle Gruppen zurück, für die der aktuelle Lehrer verantwortlich ist
 */
export function getResponsibleGroups() {
  return teacherData.groups.filter(group => group.responsibleTeacher === currentUser.code);
}

/**
 * Liefert alle Schüler zurück, die dem aktuellen Lehrer zur Bewertung zugewiesen sind
 */
export function getAssignedStudents() {
  const result = [];
  
  teacherData.groups.forEach(group => {
    const assignedStudents = group.students.filter(student => student.assignedTeacher === currentUser.code);
    
    assignedStudents.forEach(student => {
      result.push({
        ...student,
        theme: group.theme,
        examDate: group.examDate,
        schoolYear: group.schoolYear,
        responsibleTeacher: group.responsibleTeacher
      });
    });
  });
  
  return result;
}

/**
 * Liefert alle Schüler zurück, die der aktuelle Lehrer sehen kann
 * (eigene Gruppen + zur Bewertung zugewiesene Schüler)
 */
export function getAccessibleStudents() {
  const result = [];
  
  teacherData.groups.forEach(group => {
    // Der aktuelle Lehrer kann alle Schüler seiner eigenen Gruppen sehen
    // und alle Schüler, die ihm zur Bewertung zugewiesen sind
    const canAccessGroup = group.responsibleTeacher === currentUser.code ||
                          group.createdBy === currentUser.code ||
                          group.students.some(s => s.assignedTeacher === currentUser.code);
    
    if (canAccessGroup) {
      group.students.forEach(student => {
        result.push({
          ...student,
          theme: group.theme,
          examDate: group.examDate,
          schoolYear: group.schoolYear,
          responsibleTeacher: group.responsibleTeacher
        });
      });
    }
  });
  
  return result;
}

/**
 * Prüft, ob der aktuelle Lehrer einen Schüler bewerten darf
 */
export function canAssessStudent(student) {
  return student.assignedTeacher === currentUser.code;
}

/**
 * Prüft, ob der aktuelle Lehrer Zugriff auf einen Schüler hat
 */
export function hasAccessToStudent(student) {
  // Suche die Gruppe des Schülers
  const group = teacherData.groups.find(g => g.students.some(s => s.id === student.id));
  if (!group) return false;
  
  return group.responsibleTeacher === currentUser.code || 
         group.createdBy === currentUser.code || 
         student.assignedTeacher === currentUser.code;
}

/**
 * Prüft, ob der aktuelle Lehrer eine Gruppe bearbeiten darf
 */
export function canEditGroup(group) {
  return group.responsibleTeacher === currentUser.code || group.createdBy === currentUser.code;
}

/**
 * Aktualisiert den Bewertungsstatus eines Schülers
 */
export function updateAssessmentStatus(studentId) {
  if (!teacherData.assessments[studentId]) return ASSESSMENT_STATUS.NOT_STARTED;
  
  const assessment = teacherData.assessments[studentId];
  assessment.lastModified = new Date().toISOString();
  
  const status = determineAssessmentStatus(assessment);
  assessment.status = status;
  
  return status;
}

/**
 * Erzeugt Dashboard-Statistiken für den aktuellen Lehrer
 */
export function getDashboardStats() {
  const responsibleGroups = getResponsibleGroups();
  const assignedStudents = getAssignedStudents();
  const accessibleStudents = getAccessibleStudents();
  
  const studentsThisYear = accessibleStudents.filter(
    student => student.schoolYear === (systemSettings?.currentSchoolYear || getCurrentSchoolYear())
  );
  
  // Bewertungsstatus zählen
  const assessmentStats = {
    completed: 0,
    inProgress: 0,
    notStarted: 0
  };
  
  assignedStudents.forEach(student => {
    const assessment = teacherData.assessments[student.id];
    const status = assessment ? assessment.status : ASSESSMENT_STATUS.NOT_STARTED;
    
    switch (status) {
      case ASSESSMENT_STATUS.COMPLETED: assessmentStats.completed++; break;
      case ASSESSMENT_STATUS.IN_PROGRESS: assessmentStats.inProgress++; break;
      case ASSESSMENT_STATUS.NOT_STARTED: assessmentStats.notStarted++; break;
    }
  });
  
  return {
    totalGroups: responsibleGroups.length,
    totalAssigned: assignedStudents.length,
    totalAccessible: accessibleStudents.length,
    studentsThisYear: studentsThisYear.length,
    assessmentStats,
    currentSchoolYear: systemSettings?.currentSchoolYear || getCurrentSchoolYear()
  };
}

/**
 * Generiert eine einzigartige ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Liefert das aktuelle Schuljahr zurück
 */
export function getCurrentSchoolYear() {
  if (systemSettings && systemSettings.currentSchoolYear) {
    return systemSettings.currentSchoolYear;
  }
  
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  if (month >= 9) return `${year}/${year + 1}`;
  else return `${year - 1}/${year}`;
}

/**
 * Sortiert Gruppen nach der bevorzugten Sortierung
 */
export function getSortedGroups(groups) {
  if (!groups || groups.length === 0) return [];
  
  const sorting = teacherData.settings?.preferredSorting || "theme";
  const sortOrder = teacherData.settings?.themeSortOrder || {};
  
  const sortedGroups = [...groups];
  
  switch (sorting) {
    case "theme":
      sortedGroups.sort((a, b) => {
        // Wenn beide Themen in sortOrder vorkommen, nach sortOrder sortieren
        if (sortOrder[a.theme] !== undefined && sortOrder[b.theme] !== undefined) {
          return sortOrder[a.theme] - sortOrder[b.theme];
        }
        // Sonst alphabetisch sortieren
        return a.theme.localeCompare(b.theme);
      });
      break;
    case "date":
      sortedGroups.sort((a, b) => {
        if (!a.examDate && !b.examDate) return 0;
        if (!a.examDate) return 1;
        if (!b.examDate) return -1;
        return new Date(a.examDate) - new Date(b.examDate);
      });
      break;
    case "alphabetical":
      sortedGroups.sort((a, b) => {
        const aFirstStudent = a.students[0]?.name || '';
        const bFirstStudent = b.students[0]?.name || '';
        return aFirstStudent.localeCompare(bFirstStudent);
      });
      break;
  }
  
  return sortedGroups;
}

/**
 * Setzt die bevorzugte Sortierung
 */
export function setPreferredSorting(sorting) {
  if (!teacherData.settings) {
    teacherData.settings = {};
  }
  teacherData.settings.preferredSorting = sorting;
}

/**
 * Setzt die Reihenfolge der Themen
 */
export function setThemeSortOrder(order) {
  if (!teacherData.settings) {
    teacherData.settings = {};
  }
  teacherData.settings.themeSortOrder = order;
}

/**
 * Erstellt ein neues Bewertungsraster
 */
export function createAssessmentTemplate(name, description, categoriesArray) {
  const id = generateId();
  
  // Konvertiere Categories-Array zu Category-Objekten mit ID
  const categories = categoriesArray.map(cat => ({
    id: cat.name.toLowerCase().replace(/\s+/g, '_'),
    name: cat.name,
    weight: cat.weight || 1
  }));
  
  const newTemplate = {
    id,
    name,
    description,
    categories,
    createdBy: currentUser.code,
    createdAt: new Date().toISOString(),
    isDefault: false
  };
  
  teacherData.assessmentTemplates.push(newTemplate);
  return newTemplate;
}

/**
 * Aktualisiert ein bestehendes Bewertungsraster
 */
export function updateAssessmentTemplate(templateId, name, description, categoriesArray) {
  const index = teacherData.assessmentTemplates.findIndex(t => t.id === templateId);
  if (index === -1) {
    throw new Error("Bewertungsraster nicht gefunden.");
  }
  
  const template = teacherData.assessmentTemplates[index];
  
  if (template.isDefault) {
    throw new Error("Standard-Bewertungsraster kann nicht bearbeitet werden.");
  }
  
  // Konvertiere Categories-Array zu Category-Objekten mit ID
  const categories = categoriesArray.map(cat => ({
    id: cat.name.toLowerCase().replace(/\s+/g, '_'),
    name: cat.name,
    weight: cat.weight || 1
  }));
  
  teacherData.assessmentTemplates[index] = {
    ...template,
    name,
    description,
    categories,
    updatedAt: new Date().toISOString()
  };
  
  return teacherData.assessmentTemplates[index];
}

/**
 * Löscht ein Bewertungsraster
 */
export function deleteAssessmentTemplate(templateId) {
  const index = teacherData.assessmentTemplates.findIndex(t => t.id === templateId);
  if (index === -1) {
    throw new Error("Bewertungsraster nicht gefunden.");
  }
  
  const template = teacherData.assessmentTemplates[index];
  
  if (template.isDefault) {
    throw new Error("Standard-Bewertungsraster kann nicht gelöscht werden.");
  }
  
  // Prüfen, ob das Template noch verwendet wird
  const isInUse = Object.values(teacherData.assessments).some(a => a.templateId === templateId);
  
  if (isInUse) {
    throw new Error("Dieses Bewertungsraster wird noch verwendet und kann daher nicht gelöscht werden.");
  }
  
  teacherData.assessmentTemplates.splice(index, 1);
}

/**
 * Liefert ein bestimmtes Bewertungsraster zurück
 */
export function getAssessmentTemplate(templateId) {
  const template = teacherData.assessmentTemplates.find(t => t.id === templateId);
  
  if (!template) {
    // Versuche Standard-Template zu finden
    const defaultTemplate = teacherData.assessmentTemplates.find(t => t.isDefault);
    if (defaultTemplate) return defaultTemplate;
    
    // Fallback auf DEFAULT_ASSESSMENT_TEMPLATES
    return DEFAULT_ASSESSMENT_TEMPLATES[0];
  }
  
  return template;
}

/**
 * Liefert alle Bewertungsraster zurück
 */
export function getAllAssessmentTemplates() {
  return teacherData.assessmentTemplates;
}
