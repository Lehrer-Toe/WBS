// js/themeService.js

import { db } from "./firebaseClient.js";
import { 
  THEMES_CONFIG, 
  STUDENT_STATUS, 
  THEME_STATUS,
  ASSESSMENT_TEMPLATES
} from "./constants.js";
import { getAssessmentTemplate } from "./assessmentService.js";

/**
 * Globale Variable für alle Themen
 */
export let allThemes = [];

/**
 * Lädt alle Themen aus Firebase
 */
export async function loadAllThemes() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    allThemes = [];
    return false;
  }

  try {
    console.log("Lade alle Themen...");
    const snapshot = await db.collection(THEMES_CONFIG.collectionName).get();
    
    if (snapshot.empty) {
      console.log("Keine Themen gefunden");
      allThemes = [];
      return true;
    }
    
    allThemes = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Füge den Status basierend auf dem Deadline-Datum hinzu
    allThemes = allThemes.map(theme => ({
      ...theme,
      status: calculateThemeStatus(theme)
    }));
    
    console.log(`${allThemes.length} Themen geladen`);
    return true;
  } catch (error) {
    console.error("Fehler beim Laden der Themen:", error);
    allThemes = [];
    return false;
  }
}

/**
 * Berechnet den Status eines Themas basierend auf der Deadline
 */
function calculateThemeStatus(theme) {
  if (!theme.deadline) return THEME_STATUS.ACTIVE;
  
  const now = new Date();
  const deadline = new Date(theme.deadline);
  
  // Wenn alle Schüler bewertet wurden
  if (theme.students && theme.students.every(student => student.status === STUDENT_STATUS.COMPLETED)) {
    return THEME_STATUS.COMPLETED;
  }
  
  // Wenn die Deadline überschritten ist
  if (deadline < now) {
    return THEME_STATUS.OVERDUE;
  }
  
  return THEME_STATUS.ACTIVE;
}

/**
 * Erstellt ein neues Thema
 */
export async function createTheme(themeData) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return null;
  }

  if (!themeData.title) {
    throw new Error("Der Titel des Themas ist erforderlich");
  }

  try {
    // Neues Thema erstellen
    const themeRef = await db.collection(THEMES_CONFIG.collectionName).add({
      title: themeData.title,
      description: themeData.description || "",
      deadline: themeData.deadline || null,
      created_by: themeData.created_by,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      school_year: themeData.school_year,
      assessment_template_id: themeData.assessment_template_id || "standard",
      students: []
    });
    
    // ID hinzufügen und Theme zurückgeben
    const newTheme = {
      id: themeRef.id,
      ...themeData,
      students: [],
      status: THEME_STATUS.ACTIVE
    };
    
    // Zur globalen Liste hinzufügen
    allThemes.push(newTheme);
    
    console.log("Neues Thema erstellt:", newTheme.title);
    return newTheme;
  } catch (error) {
    console.error("Fehler beim Erstellen des Themas:", error);
    throw error;
  }
}

/**
 * Aktualisiert ein bestehendes Thema
 */
export async function updateTheme(themeId, themeData) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    const themeRef = db.collection(THEMES_CONFIG.collectionName).doc(themeId);
    const doc = await themeRef.get();
    
    if (!doc.exists) {
      throw new Error("Thema nicht gefunden");
    }
    
    // Entferne ID und andere Felder, die nicht aktualisiert werden sollen
    const { id, created_at, created_by, students, ...updateData } = themeData;
    
    // Aktualisiere das Thema
    await themeRef.update({
      ...updateData,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Aktualisiere die lokale Kopie
    const index = allThemes.findIndex(t => t.id === themeId);
    if (index !== -1) {
      allThemes[index] = {
        ...allThemes[index],
        ...updateData,
        status: calculateThemeStatus({
          ...allThemes[index],
          ...updateData
        })
      };
    }
    
    console.log("Thema aktualisiert:", themeId);
    return true;
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Themas:", error);
    throw error;
  }
}

/**
 * Löscht ein Thema
 */
export async function deleteTheme(themeId) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    // Lösche das Thema
    await db.collection(THEMES_CONFIG.collectionName).doc(themeId).delete();
    
    // Entferne aus der lokalen Liste
    allThemes = allThemes.filter(theme => theme.id !== themeId);
    
    console.log("Thema gelöscht:", themeId);
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen des Themas:", error);
    throw error;
  }
}

/**
 * Fügt einen Schüler zu einem Thema hinzu
 */
export async function addStudentToTheme(themeId, studentData) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  if (!studentData.name) {
    throw new Error("Der Name des Schülers ist erforderlich");
  }

  try {
    const themeRef = db.collection(THEMES_CONFIG.collectionName).doc(themeId);
    const doc = await themeRef.get();
    
    if (!doc.exists) {
      throw new Error("Thema nicht gefunden");
    }
    
    const theme = doc.data();
    
    // Prüfe, ob das Maximum an Schülern erreicht ist
    if (theme.students && theme.students.length >= THEMES_CONFIG.maxStudentsPerTheme) {
      throw new Error(`Maximal ${THEMES_CONFIG.maxStudentsPerTheme} Schüler pro Thema erlaubt`);
    }
    
    // Generiere eine einzigartige ID für den Schüler
    const studentId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Erstelle den neuen Schüler
    const newStudent = {
      id: studentId,
      name: studentData.name,
      assigned_teacher: studentData.assigned_teacher,
      created_at: new Date().toISOString(),
      status: STUDENT_STATUS.PENDING,
      assessment: {}
    };
    
    // Füge den Schüler zum Thema hinzu
    const students = theme.students || [];
    students.push(newStudent);
    
    // Aktualisiere das Thema in der Datenbank
    await themeRef.update({
      students: students,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Aktualisiere die lokale Kopie
    const index = allThemes.findIndex(t => t.id === themeId);
    if (index !== -1) {
      allThemes[index].students = students;
    }
    
    console.log("Schüler hinzugefügt:", studentData.name);
    return newStudent;
  } catch (error) {
    console.error("Fehler beim Hinzufügen des Schülers:", error);
    throw error;
  }
}

/**
 * Aktualisiert einen Schüler in einem Thema
 */
export async function updateStudent(themeId, studentId, studentData) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    const themeRef = db.collection(THEMES_CONFIG.collectionName).doc(themeId);
    const doc = await themeRef.get();
    
    if (!doc.exists) {
      throw new Error("Thema nicht gefunden");
    }
    
    const theme = doc.data();
    const students = theme.students || [];
    
    // Finde den Schüler
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) {
      throw new Error("Schüler nicht gefunden");
    }
    
    // Aktualisiere den Schüler
    students[studentIndex] = {
      ...students[studentIndex],
      ...studentData,
      updated_at: new Date().toISOString()
    };
    
    // Aktualisiere das Thema in der Datenbank
    await themeRef.update({
      students: students,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Aktualisiere die lokale Kopie
    const themeIndex = allThemes.findIndex(t => t.id === themeId);
    if (themeIndex !== -1) {
      allThemes[themeIndex].students = students;
      allThemes[themeIndex].status = calculateThemeStatus(allThemes[themeIndex]);
    }
    
    console.log("Schüler aktualisiert:", studentData.name || students[studentIndex].name);
    return students[studentIndex];
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Schülers:", error);
    throw error;
  }
}

/**
 * Entfernt einen Schüler aus einem Thema
 */
export async function removeStudentFromTheme(themeId, studentId) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    const themeRef = db.collection(THEMES_CONFIG.collectionName).doc(themeId);
    const doc = await themeRef.get();
    
    if (!doc.exists) {
      throw new Error("Thema nicht gefunden");
    }
    
    const theme = doc.data();
    
    // Entferne den Schüler
    const students = theme.students.filter(s => s.id !== studentId);
    
    // Aktualisiere das Thema in der Datenbank
    await themeRef.update({
      students: students,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Aktualisiere die lokale Kopie
    const index = allThemes.findIndex(t => t.id === themeId);
    if (index !== -1) {
      allThemes[index].students = students;
    }
    
    console.log("Schüler entfernt aus Thema:", themeId);
    return true;
  } catch (error) {
    console.error("Fehler beim Entfernen des Schülers:", error);
    throw error;
  }
}

/**
 * Aktualisiert die Bewertung eines Schülers
 */
export async function updateStudentAssessment(themeId, studentId, assessmentData) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    const themeRef = db.collection(THEMES_CONFIG.collectionName).doc(themeId);
    const doc = await themeRef.get();
    
    if (!doc.exists) {
      throw new Error("Thema nicht gefunden");
    }
    
    const theme = doc.data();
    const students = theme.students || [];
    
    // Finde den Schüler
    const studentIndex = students.findIndex(s => s.id === studentId);
    if (studentIndex === -1) {
      throw new Error("Schüler nicht gefunden");
    }
    
    // Aktualisiere die Bewertung des Schülers
    students[studentIndex].assessment = {
      ...students[studentIndex].assessment,
      ...assessmentData,
      updated_at: new Date().toISOString()
    };
    
    // Wenn eine endgültige Note vorhanden ist, setze den Status auf abgeschlossen
    if (assessmentData.finalGrade) {
      students[studentIndex].status = STUDENT_STATUS.COMPLETED;
    } else {
      students[studentIndex].status = STUDENT_STATUS.IN_PROGRESS;
    }
    
    // Aktualisiere das Thema in der Datenbank
    await themeRef.update({
      students: students,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Aktualisiere die lokale Kopie
    const themeIndex = allThemes.findIndex(t => t.id === themeId);
    if (themeIndex !== -1) {
      allThemes[themeIndex].students = students;
      allThemes[themeIndex].status = calculateThemeStatus(allThemes[themeIndex]);
    }
    
    console.log("Bewertung aktualisiert für Schüler:", students[studentIndex].name);
    return students[studentIndex];
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Bewertung:", error);
    throw error;
  }
}

/**
 * Berechnet die Durchschnittsnote für einen Schüler
 */
export async function calculateStudentAverage(themeId, studentId) {
  try {
    // Finde das Thema
    const theme = allThemes.find(t => t.id === themeId);
    if (!theme) {
      throw new Error("Thema nicht gefunden");
    }
    
    // Finde den Schüler
    const student = theme.students.find(s => s.id === studentId);
    if (!student) {
      throw new Error("Schüler nicht gefunden");
    }
    
    // Prüfe, ob es eine Bewertung gibt
    if (!student.assessment) {
      return null;
    }
    
    // Lade das Bewertungsraster
    const templateId = theme.assessment_template_id || "standard";
    const template = await getAssessmentTemplate(templateId);
    
    if (!template) {
      throw new Error("Bewertungsraster nicht gefunden");
    }
    
    // Berechne den gewichteten Durchschnitt
    let sum = 0;
    let weightSum = 0;
    
    for (const category of template.categories) {
      const value = student.assessment[category.id];
      const weight = category.weight || 1;
      
      if (value && value > 0) {
        sum += value * weight;
        weightSum += weight;
      }
    }
    
    if (weightSum === 0) {
      return null;
    }
    
    return (sum / weightSum).toFixed(1);
  } catch (error) {
    console.error("Fehler bei der Durchschnittsberechnung:", error);
    return null;
  }
}

/**
 * Filtert Themen nach verschiedenen Kriterien
 */
export function filterThemes(filters = {}) {
  let filtered = [...allThemes];
  
  // Nach Schuljahr filtern
  if (filters.schoolYear) {
    filtered = filtered.filter(theme => theme.school_year === filters.schoolYear);
  }
  
  // Nach Status filtern
  if (filters.status) {
    filtered = filtered.filter(theme => theme.status === filters.status);
  }
  
  // Nach erstellendem Lehrer filtern
  if (filters.createdBy) {
    filtered = filtered.filter(theme => theme.created_by === filters.createdBy);
  }
  
  // Nach zugewiesenem Lehrer filtern (sucht in allen Schülern)
  if (filters.assignedTeacher) {
    filtered = filtered.filter(theme => 
      theme.students && 
      theme.students.some(student => student.assigned_teacher === filters.assignedTeacher)
    );
  }
  
  // Nach Bewertungsstatus filtern
  if (filters.assessmentStatus) {
    filtered = filtered.filter(theme => {
      if (!theme.students || theme.students.length === 0) {
        return false;
      }
      
      if (filters.assessmentStatus === STUDENT_STATUS.COMPLETED) {
        return theme.students.every(s => s.status === STUDENT_STATUS.COMPLETED);
      } else if (filters.assessmentStatus === STUDENT_STATUS.PENDING) {
        return theme.students.some(s => s.status === STUDENT_STATUS.PENDING);
      } else if (filters.assessmentStatus === STUDENT_STATUS.IN_PROGRESS) {
        return theme.students.some(s => s.status === STUDENT_STATUS.IN_PROGRESS);
      }
      
      return true;
    });
  }
  
  return filtered;
}

/**
 * Liefert alle Themen zurück, bei denen der Lehrer berechtigt ist, Schüler zu bewerten
 */
export function getThemesForAssessment(teacherCode) {
  return allThemes.filter(theme => {
    return theme.students && 
           theme.students.some(student => student.assigned_teacher === teacherCode);
  });
}

/**
 * Liefert alle Themen zurück, die der Lehrer erstellt hat
 */
export function getThemesCreatedByTeacher(teacherCode) {
  return allThemes.filter(theme => theme.created_by === teacherCode);
}

/**
 * Liefert alle Schüler zurück, die dem Lehrer zur Bewertung zugewiesen sind
 */
export function getStudentsForTeacher(teacherCode) {
  const students = [];
  
  allThemes.forEach(theme => {
    if (theme.students) {
      theme.students.forEach(student => {
        if (student.assigned_teacher === teacherCode) {
          students.push({
            ...student,
            theme: {
              id: theme.id,
              title: theme.title,
              deadline: theme.deadline
            }
          });
        }
      });
    }
  });
  
  return students;
}
