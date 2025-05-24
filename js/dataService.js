// js/dataService.js

import { db } from "./firebaseClient.js";
import { THEMES_CONFIG, STUDENT_STATUS } from "./constants.js";
import { loadAllThemes, allThemes } from "./themeService.js";
import { loadAssessmentTemplates } from "./assessmentService.js";

/**
 * Der aktuell eingeloggte Lehrer. Enthält Lehrername, Kürzel und Passwort.
 */
export let currentUser = {
  name: null,
  code: null,
  password: null,
  permissions: {}
};

/**
 * Initialisiert die Daten für den aktuellen Benutzer
 */
export async function initializeUserData() {
  try {
    // Lade Themen
    await loadAllThemes();
    
    // Lade Bewertungsraster
    await loadAssessmentTemplates();
    
    return true;
  } catch (error) {
    console.error("Fehler beim Initialisieren der Benutzerdaten:", error);
    return false;
  }
}

/**
 * Liefert alle Themen, die für den aktuellen Benutzer relevant sind
 * - Themen, die der Benutzer erstellt hat
 * - Themen, bei denen der Benutzer Schüler bewerten darf
 */
export function getThemesForCurrentUser() {
  if (!currentUser.code) return [];
  
  return allThemes.filter(theme => {
    // Themen, die der Benutzer erstellt hat
    if (theme.created_by === currentUser.code) return true;
    
    // Themen, bei denen der Benutzer Schüler bewerten darf
    if (theme.students && theme.students.some(student => student.assigned_teacher === currentUser.code)) {
      return true;
    }
    
    return false;
  });
}

/**
 * Liefert alle Schüler, die der aktuelle Benutzer bewerten darf
 */
export function getStudentsForCurrentUser() {
  if (!currentUser.code) return [];
  
  const students = [];
  
  allThemes.forEach(theme => {
    if (theme.students) {
      theme.students.forEach(student => {
        if (student.assigned_teacher === currentUser.code) {
          students.push({
            ...student,
            theme: {
              id: theme.id,
              title: theme.title,
              deadline: theme.deadline,
              assessment_template_id: theme.assessment_template_id
            }
          });
        }
      });
    }
  });
  
  return students;
}

/**
 * Liefert die Statistiken für den aktuellen Benutzer
 */
export function getCurrentUserStats() {
  if (!currentUser.code) return {};
  
  const themesCreated = allThemes.filter(theme => theme.created_by === currentUser.code).length;
  
  let studentsAssigned = 0;
  let studentsCompleted = 0;
  let studentsPending = 0;
  
  allThemes.forEach(theme => {
    if (theme.students) {
      theme.students.forEach(student => {
        if (student.assigned_teacher === currentUser.code) {
          studentsAssigned++;
          
          if (student.status === STUDENT_STATUS.COMPLETED) {
            studentsCompleted++;
          } else if (student.status === STUDENT_STATUS.PENDING) {
            studentsPending++;
          }
        }
      });
    }
  });
  
  return {
    themesCreated,
    studentsAssigned,
    studentsCompleted,
    studentsPending,
    studentsInProgress: studentsAssigned - studentsCompleted - studentsPending
  };
}

/**
 * Aktualisiert den Status aller Themen basierend auf den Deadlines
 */
export function updateThemeStatuses() {
  const now = new Date();
  
  allThemes.forEach(theme => {
    if (theme.deadline) {
      const deadline = new Date(theme.deadline);
      
      // Setze Status basierend auf Deadline und Schülerbewertungen
      if (theme.students && theme.students.every(s => s.status === STUDENT_STATUS.COMPLETED)) {
        theme.status = 'completed';
      } else if (deadline < now) {
        theme.status = 'overdue';
      } else {
        theme.status = 'active';
      }
    }
  });
}

/**
 * Liefert die verfügbaren Schuljahre aus den vorhandenen Themen
 */
export function getAvailableSchoolYears() {
  const schoolYears = new Set();
  
  allThemes.forEach(theme => {
    if (theme.school_year) {
      schoolYears.add(theme.school_year);
    }
  });
  
  return Array.from(schoolYears).sort();
}

/**
 * Exportiert alle Daten des aktuellen Benutzers
 */
export async function exportUserData() {
  // Exportiert Themen und Bewertungen, die für den aktuellen Benutzer relevant sind
  const themesForUser = getThemesForCurrentUser();
  
  const exportData = {
    exportDate: new Date().toISOString(),
    teacher: {
      name: currentUser.name,
      code: currentUser.code
    },
    themes: themesForUser
  };
  
  return exportData;
}

/**
 * Berechnet die Gesamtanzahl der Schüler in allen Themen
 */
export function getTotalStudentCount() {
  let count = 0;
  
  allThemes.forEach(theme => {
    if (theme.students) {
      count += theme.students.length;
    }
  });
  
  return count;
}

/**
 * Liefert alle Schüler mit ihren Bewertungen für Exportzwecke
 */
export function getAllStudentsWithAssessments() {
  const students = [];
  
  allThemes.forEach(theme => {
    if (theme.students) {
      theme.students.forEach(student => {
        students.push({
          id: student.id,
          name: student.name,
          status: student.status,
          assigned_teacher: student.assigned_teacher,
          assessment: student.assessment || {},
          theme: {
            id: theme.id,
            title: theme.title,
            school_year: theme.school_year,
            deadline: theme.deadline,
            created_by: theme.created_by
          }
        });
      });
    }
  });
  
  return students;
}
