// js/dataService.js - Erweiterte Version mit Klassen-Filtern

import { db } from "./firebaseClient.js";
import { THEMES_CONFIG, STUDENT_STATUS, AVAILABLE_CLASSES } from "./constants.js";
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
 * Cache für gefilterte Daten
 */
let dataCache = {
  studentsByClass: new Map(),
  themesBySchoolYear: new Map(),
  lastCacheUpdate: null
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
    
    // NEU: Cache aufbauen
    rebuildDataCache();
    
    return true;
  } catch (error) {
    console.error("Fehler beim Initialisieren der Benutzerdaten:", error);
    return false;
  }
}

/**
 * NEU: Baut den Daten-Cache neu auf
 */
function rebuildDataCache() {
  console.log("Baue Daten-Cache auf...");
  
  // Cache leeren
  dataCache.studentsByClass.clear();
  dataCache.themesBySchoolYear.clear();
  
  // Schüler nach Klassen gruppieren
  allThemes.forEach(theme => {
    if (theme.students && Array.isArray(theme.students)) {
      theme.students.forEach(student => {
        if (student.class) {
          if (!dataCache.studentsByClass.has(student.class)) {
            dataCache.studentsByClass.set(student.class, []);
          }
          
          dataCache.studentsByClass.get(student.class).push({
            ...student,
            theme: {
              id: theme.id,
              title: theme.title,
              deadline: theme.deadline,
              created_by: theme.created_by
            }
          });
        }
      });
    }
    
    // Themen nach Schuljahr gruppieren
    if (theme.school_year) {
      if (!dataCache.themesBySchoolYear.has(theme.school_year)) {
        dataCache.themesBySchoolYear.set(theme.school_year, []);
      }
      dataCache.themesBySchoolYear.get(theme.school_year).push(theme);
    }
  });
  
  dataCache.lastCacheUpdate = new Date();
  console.log(`Cache aufgebaut: ${dataCache.studentsByClass.size} Klassen, ${dataCache.themesBySchoolYear.size} Schuljahre`);
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
 * NEU: Liefert alle Schüler einer bestimmten Klasse
 */
export function getStudentsByClass(className) {
  if (!className) return [];
  
  // Prüfe Cache-Aktualität
  if (shouldRefreshCache()) {
    rebuildDataCache();
  }
  
  return dataCache.studentsByClass.get(className) || [];
}

/**
 * NEU: Liefert alle verfügbaren Klassen mit Schülerzahlen
 */
export function getAvailableClassesWithCounts() {
  // Prüfe Cache-Aktualität
  if (shouldRefreshCache()) {
    rebuildDataCache();
  }
  
  const classInfo = [];
  
  // Alle verfügbaren Klassen durchgehen
  AVAILABLE_CLASSES.forEach(className => {
    const students = dataCache.studentsByClass.get(className) || [];
    
    if (students.length > 0) {
      // Statistiken für die Klasse berechnen
      const completed = students.filter(s => s.status === STUDENT_STATUS.COMPLETED).length;
      const inProgress = students.filter(s => s.status === STUDENT_STATUS.IN_PROGRESS).length;
      const pending = students.filter(s => s.status === STUDENT_STATUS.PENDING).length;
      
      classInfo.push({
        className,
        totalStudents: students.length,
        completed,
        inProgress,
        pending,
        completionRate: students.length > 0 ? Math.round((completed / students.length) * 100) : 0
      });
    }
  });
  
  // Nach Klassennamen sortieren
  return classInfo.sort((a, b) => {
    // Numerische Sortierung (5a vor 10a)
    const aNum = parseInt(a.className);
    const bNum = parseInt(b.className);
    
    if (aNum !== bNum) {
      return aNum - bNum;
    }
    
    // Bei gleicher Zahl alphabetisch sortieren
    return a.className.localeCompare(b.className);
  });
}

/**
 * NEU: Filtert Schüler nach verschiedenen Kriterien
 */
export function filterStudents(filters = {}) {
  let students = getStudentsForCurrentUser();
  
  // Nach Klasse filtern
  if (filters.class) {
    students = students.filter(student => student.class === filters.class);
  }
  
  // Nach Status filtern
  if (filters.status) {
    students = students.filter(student => student.status === filters.status);
  }
  
  // Nach Thema filtern
  if (filters.themeId) {
    students = students.filter(student => student.theme.id === filters.themeId);
  }
  
  // Nach Deadline filtern (überfällig, diese Woche, etc.)
  if (filters.deadline) {
    const now = new Date();
    
    students = students.filter(student => {
      if (!student.theme.deadline) return false;
      
      const deadline = new Date(student.theme.deadline);
      const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
      
      switch (filters.deadline) {
        case 'overdue':
          return daysRemaining < 0;
        case 'today':
          return daysRemaining === 0;
        case 'this_week':
          return daysRemaining > 0 && daysRemaining <= 7;
        case 'next_week':
          return daysRemaining > 7 && daysRemaining <= 14;
        default:
          return true;
      }
    });
  }
  
  // Nach Note filtern
  if (filters.grade) {
    students = students.filter(student => {
      if (!student.assessment || !student.assessment.finalGrade) {
        return filters.grade === 'ungraded';
      }
      
      const grade = student.assessment.finalGrade;
      
      switch (filters.grade) {
        case 'excellent': // 1.0 - 1.5
          return grade >= 1.0 && grade <= 1.5;
        case 'good': // 1.6 - 2.5
          return grade >= 1.6 && grade <= 2.5;
        case 'satisfactory': // 2.6 - 3.5
          return grade >= 2.6 && grade <= 3.5;
        case 'sufficient': // 3.6 - 4.0
          return grade >= 3.6 && grade <= 4.0;
        case 'poor': // 4.1 - 6.0
          return grade >= 4.1 && grade <= 6.0;
        case 'ungraded':
          return false; // Bereits oben behandelt
        default:
          return true;
      }
    });
  }
  
  return students;
}

/**
 * NEU: Liefert Themen nach Schuljahr
 */
export function getThemesBySchoolYear(schoolYear) {
  if (!schoolYear) return [];
  
  // Prüfe Cache-Aktualität
  if (shouldRefreshCache()) {
    rebuildDataCache();
  }
  
  return dataCache.themesBySchoolYear.get(schoolYear) || [];
}

/**
 * NEU: Liefert alle verfügbaren Schuljahre mit Statistiken
 */
export function getSchoolYearsWithStats() {
  // Prüfe Cache-Aktualität
  if (shouldRefreshCache()) {
    rebuildDataCache();
  }
  
  const schoolYearStats = [];
  
  dataCache.themesBySchoolYear.forEach((themes, schoolYear) => {
    let totalStudents = 0;
    let completedStudents = 0;
    let activeThemes = 0;
    let completedThemes = 0;
    let overdueThemes = 0;
    
    themes.forEach(theme => {
      // Themen-Status zählen
      switch (theme.status) {
        case 'active':
          activeThemes++;
          break;
        case 'completed':
          completedThemes++;
          break;
        case 'overdue':
          overdueThemes++;
          break;
      }
      
      // Schüler zählen
      if (theme.students) {
        totalStudents += theme.students.length;
        completedStudents += theme.students.filter(s => s.status === STUDENT_STATUS.COMPLETED).length;
      }
    });
    
    schoolYearStats.push({
      schoolYear,
      totalThemes: themes.length,
      activeThemes,
      completedThemes,
      overdueThemes,
      totalStudents,
      completedStudents,
      completionRate: totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0
    });
  });
  
  // Nach Schuljahr sortieren (neueste zuerst)
  return schoolYearStats.sort((a, b) => b.schoolYear.localeCompare(a.schoolYear));
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
  let studentsInProgress = 0;
  
  // NEU: Klassen-Statistiken
  const classCounts = new Map();
  
  allThemes.forEach(theme => {
    if (theme.students) {
      theme.students.forEach(student => {
        if (student.assigned_teacher === currentUser.code) {
          studentsAssigned++;
          
          // Status zählen
          switch (student.status) {
            case STUDENT_STATUS.COMPLETED:
              studentsCompleted++;
              break;
            case STUDENT_STATUS.PENDING:
              studentsPending++;
              break;
            case STUDENT_STATUS.IN_PROGRESS:
              studentsInProgress++;
              break;
          }
          
          // Klassen zählen
          if (student.class) {
            classCounts.set(student.class, (classCounts.get(student.class) || 0) + 1);
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
    studentsInProgress,
    completionRate: studentsAssigned > 0 ? Math.round((studentsCompleted / studentsAssigned) * 100) : 0,
    classesInvolved: classCounts.size,
    mostActiveClass: getMostActiveClass(classCounts)
  };
}

/**
 * NEU: Ermittelt die aktivste Klasse für den aktuellen Benutzer
 */
function getMostActiveClass(classCounts) {
  if (classCounts.size === 0) return null;
  
  let maxCount = 0;
  let mostActiveClass = null;
  
  classCounts.forEach((count, className) => {
    if (count > maxCount) {
      maxCount = count;
      mostActiveClass = className;
    }
  });
  
  return mostActiveClass ? { class: mostActiveClass, count: maxCount } : null;
}

/**
 * Aktualisiert den Status aller Themen basierend auf den Deadlines
 */
export function updateThemeStatuses() {
  const now = new Date();
  let updated = false;
  
  allThemes.forEach(theme => {
    const oldStatus = theme.status;
    
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
    
    if (oldStatus !== theme.status) {
      updated = true;
    }
  });
  
  // Cache neu aufbauen, wenn sich etwas geändert hat
  if (updated) {
    rebuildDataCache();
  }
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
  
  return Array.from(schoolYears).sort().reverse(); // Neueste zuerst
}

/**
 * NEU: Liefert verfügbare Klassen aus den vorhandenen Schülern
 */
export function getAvailableClasses() {
  // Prüfe Cache-Aktualität
  if (shouldRefreshCache()) {
    rebuildDataCache();
  }
  
  return Array.from(dataCache.studentsByClass.keys()).sort((a, b) => {
    // Numerische Sortierung
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    
    if (aNum !== bNum) {
      return aNum - bNum;
    }
    
    return a.localeCompare(b);
  });
}

/**
 * Exportiert alle Daten des aktuellen Benutzers
 */
export async function exportUserData() {
  // Exportiert Themen und Bewertungen, die für den aktuellen Benutzer relevant sind
  const themesForUser = getThemesForCurrentUser();
  const studentsForUser = getStudentsForCurrentUser();
  const userStats = getCurrentUserStats();
  
  // NEU: Erweiterte Export-Daten
  const exportData = {
    exportDate: new Date().toISOString(),
    exportVersion: "2.0",
    teacher: {
      name: currentUser.name,
      code: currentUser.code
    },
    statistics: userStats,
    themes: themesForUser,
    students: studentsForUser,
    classSummary: getAvailableClassesWithCounts(),
    schoolYearSummary: getSchoolYearsWithStats()
  };
  
  return exportData;
}

/**
 * NEU: Exportiert Klassen-spezifische Daten
 */
export function exportClassData(className) {
  if (!className) return null;
  
  const students = getStudentsByClass(className);
  const themes = new Set();
  const teachers = new Set();
  
  // Sammle Themen und Lehrer
  students.forEach(student => {
    themes.add(student.theme.title);
    teachers.add(student.assigned_teacher);
  });
  
  // Statistiken berechnen
  const completed = students.filter(s => s.status === STUDENT_STATUS.COMPLETED).length;
  const inProgress = students.filter(s => s.status === STUDENT_STATUS.IN_PROGRESS).length;
  const pending = students.filter(s => s.status === STUDENT_STATUS.PENDING).length;
  
  return {
    exportDate: new Date().toISOString(),
    className,
    totalStudents: students.length,
    statistics: {
      completed,
      inProgress,
      pending,
      completionRate: students.length > 0 ? Math.round((completed / students.length) * 100) : 0
    },
    involvedThemes: Array.from(themes),
    involvedTeachers: Array.from(teachers),
    students: students.map(student => ({
      name: student.name,
      status: student.status,
      theme: student.theme.title,
      assignedTeacher: student.assigned_teacher,
      finalGrade: student.assessment?.finalGrade || null
    }))
  };
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
          class: student.class || "", // NEU: Klasse hinzugefügt
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

/**
 * NEU: Prüft, ob der Cache aktualisiert werden muss
 */
function shouldRefreshCache() {
  if (!dataCache.lastCacheUpdate) return true;
  
  // Cache alle 5 Minuten erneuern
  const cacheAge = Date.now() - dataCache.lastCacheUpdate.getTime();
  return cacheAge > 5 * 60 * 1000; // 5 Minuten
}

/**
 * NEU: Sucht Schüler nach Name oder Klasse
 */
export function searchStudents(query) {
  if (!query || query.trim().length < 2) return [];
  
  const searchTerm = query.toLowerCase().trim();
  const allStudents = getStudentsForCurrentUser();
  
  return allStudents.filter(student => {
    return (
      student.name.toLowerCase().includes(searchTerm) ||
      (student.class && student.class.toLowerCase().includes(searchTerm)) ||
      student.theme.title.toLowerCase().includes(searchTerm)
    );
  });
}

/**
 * NEU: Liefert Deadline-Statistiken
 */
export function getDeadlineStatistics() {
  const now = new Date();
  const stats = {
    overdue: 0,
    today: 0,
    thisWeek: 0,
    nextWeek: 0,
    later: 0,
    noDeadline: 0
  };
  
  const themes = getThemesForCurrentUser();
  
  themes.forEach(theme => {
    if (!theme.deadline) {
      stats.noDeadline++;
      return;
    }
    
    const deadline = new Date(theme.deadline);
    const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
      stats.overdue++;
    } else if (daysRemaining === 0) {
      stats.today++;
    } else if (daysRemaining <= 7) {
      stats.thisWeek++;
    } else if (daysRemaining <= 14) {
      stats.nextWeek++;
    } else {
      stats.later++;
    }
  });
  
  return stats;
}

/**
 * NEU: Event-Listener für Cache-Updates
 */
document.addEventListener('DOMContentLoaded', () => {
  // Cache alle 10 Minuten aktualisieren
  setInterval(() => {
    if (currentUser.code) {
      rebuildDataCache();
    }
  }, 10 * 60 * 1000); // 10 Minuten
});
