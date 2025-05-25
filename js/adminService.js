// js/adminService.js

import { db } from "./firebaseClient.js";
import { 
  ADMIN_CONFIG, 
  DEFAULT_TEACHERS, 
  TEACHER_PERMISSIONS,
  SYSTEM_SETTINGS,
  DEFAULT_SYSTEM_SETTINGS,
  ASSESSMENT_TEMPLATES,
  THEMES_CONFIG
} from "./constants.js";

/**
 * Globale Variable für alle registrierten Lehrer
 */
export let allTeachers = [];

/**
 * Aktueller Admin-Benutzer
 */
export let currentAdmin = {
  username: null,
  isLoggedIn: false
};

/**
 * Aktuelle Systemeinstellungen
 */
export let systemSettings = {...DEFAULT_SYSTEM_SETTINGS};

/**
 * Lädt alle registrierten Lehrer aus Firebase
 */
export async function loadAllTeachers() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    // Fallback auf Standard-Lehrer
    allTeachers = [...DEFAULT_TEACHERS.map(teacher => ({
      ...teacher,
      createdAt: new Date().toISOString()
    }))];
    return true;
  }

  try {
    console.log("Versuche Lehrer zu laden...");
    const docRef = db.collection(ADMIN_CONFIG.collectionName).doc("teachers_list");
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      allTeachers = data.teachers || [];
      console.log("Lehrer erfolgreich geladen:", allTeachers.length);
      return true;
    } else {
      console.log("Keine Lehrer-Daten gefunden, erstelle Standard-Lehrer...");
      // Erste Initialisierung - erstelle Dokument mit Standard-Lehrern
      allTeachers = [...DEFAULT_TEACHERS.map(teacher => ({
        ...teacher,
        createdAt: new Date().toISOString()
      }))];
      
      // Versuche zu speichern, aber ignoriere Fehler
      try {
        await saveAllTeachers();
      } catch (saveError) {
        console.warn("Konnte Standard-Lehrer nicht speichern:", saveError);
        // Weiter machen - lokale Daten verwenden
      }
      return true;
    }
  } catch (error) {
    console.error("Fehler beim Laden der Lehrer:", error);
    
    // Fallback: Verwende Standard-Lehrer aus constants.js
    console.log("Verwende Fallback-Lehrer...");
    allTeachers = [...DEFAULT_TEACHERS.map(teacher => ({
      ...teacher,
      createdAt: new Date().toISOString()
    }))];
    
    // System funktioniert trotzdem, nur ohne persistente Lehrerdaten
    return true;
  }
}

/**
 * Speichert alle Lehrer in Firebase
 */
export async function saveAllTeachers() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    await db.collection(ADMIN_CONFIG.collectionName).doc("teachers_list").set({
      teachers: allTeachers,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("Lehrer erfolgreich gespeichert");
    return true;
  } catch (error) {
    console.error("Fehler beim Speichern der Lehrer:", error);
    
    // Spezifische Fehlermeldungen
    if (error.code === 'permission-denied') {
      console.error("Berechtigung verweigert. Bitte Firebase-Regeln prüfen.");
    } else if (error.code === 'unavailable') {
      console.error("Firebase ist momentan nicht verfügbar.");
    }
    
    return false;
  }
}

/**
 * Admin-Login
 */
export function loginAdmin(username, password) {
  if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
    currentAdmin.username = username;
    currentAdmin.isLoggedIn = true;
    return true;
  }
  return false;
}

/**
 * Admin-Logout
 */
export function logoutAdmin() {
  currentAdmin.username = null;
  currentAdmin.isLoggedIn = false;
}

/**
 * Neuen Lehrer hinzufügen
 */
export async function addTeacher(name, code, password, permissions = {}) {
  // Prüfen, ob Kürzel bereits existiert
  const existing = allTeachers.find(t => t.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    throw new Error(`Kürzel "${code}" ist bereits vergeben.`);
  }

  // Standard-Berechtigungen setzen
  const defaultPermissions = {
    [TEACHER_PERMISSIONS.CREATE_THEMES]: false,
    [TEACHER_PERMISSIONS.MANAGE_TEMPLATES]: false
  };

  const newTeacher = {
    name: name.trim(),
    code: code.toUpperCase().trim(),
    password: password.trim(),
    permissions: { ...defaultPermissions, ...permissions },
    createdAt: new Date().toISOString()
  };

  allTeachers.push(newTeacher);
  
  // Versuche zu speichern
  try {
    const saved = await saveAllTeachers();
    if (!saved) {
      // Rollback bei Fehler
      allTeachers.pop();
      throw new Error("Fehler beim Speichern des Lehrers.");
    }
  } catch (error) {
    // Rollback bei Fehler
    allTeachers.pop();
    throw error;
  }

  return newTeacher;
}

/**
 * Lehrer bearbeiten
 */
export async function updateTeacher(originalCode, name, code, password, permissions = null) {
  const index = allTeachers.findIndex(t => t.code === originalCode);
  if (index === -1) {
    throw new Error("Lehrer nicht gefunden.");
  }

  // Prüfen, ob neues Kürzel bereits von anderem Lehrer verwendet wird
  if (code.toUpperCase() !== originalCode) {
    const existing = allTeachers.find(t => t.code.toUpperCase() === code.toUpperCase());
    if (existing) {
      throw new Error(`Kürzel "${code}" ist bereits vergeben.`);
    }
  }

  const oldTeacher = { ...allTeachers[index] };
  
  // Verwende die vorhandenen Berechtigungen, wenn keine neuen übergeben wurden
  const updatedPermissions = permissions || oldTeacher.permissions || {};
  
  allTeachers[index] = {
    ...allTeachers[index],
    name: name.trim(),
    code: code.toUpperCase().trim(),
    password: password.trim(),
    permissions: updatedPermissions,
    updatedAt: new Date().toISOString()
  };

  try {
    const saved = await saveAllTeachers();
    if (!saved) {
      // Rollback bei Fehler
      allTeachers[index] = oldTeacher;
      throw new Error("Fehler beim Speichern der Änderungen.");
    }
  } catch (error) {
    // Rollback bei Fehler
    allTeachers[index] = oldTeacher;
    throw error;
  }

  return allTeachers[index];
}

/**
 * Lehrer löschen
 */
export async function deleteTeacher(code) {
  const index = allTeachers.findIndex(t => t.code === code);
  if (index === -1) {
    throw new Error("Lehrer nicht gefunden.");
  }

  const deletedTeacher = allTeachers.splice(index, 1)[0];
  
  try {
    const saved = await saveAllTeachers();
    if (!saved) {
      // Rollback bei Fehler
      allTeachers.splice(index, 0, deletedTeacher);
      throw new Error("Fehler beim Löschen des Lehrers.");
    }
  } catch (error) {
    // Rollback bei Fehler
    allTeachers.splice(index, 0, deletedTeacher);
    throw error;
  }

  return deletedTeacher;
}

/**
 * Aktualisiert die Lehrerberechtigungen
 */
export async function updateTeacherPermissions(teacherCode, permissions) {
  const index = allTeachers.findIndex(t => t.code === teacherCode);
  if (index === -1) {
    throw new Error("Lehrer nicht gefunden.");
  }

  const oldTeacher = { ...allTeachers[index] };
  
  // Aktualisiere nur die Berechtigungen
  allTeachers[index] = {
    ...allTeachers[index],
    permissions: {
      ...oldTeacher.permissions,
      ...permissions
    },
    updatedAt: new Date().toISOString()
  };

  try {
    const saved = await saveAllTeachers();
    if (!saved) {
      // Rollback bei Fehler
      allTeachers[index] = oldTeacher;
      throw new Error("Fehler beim Speichern der Berechtigungen.");
    }
  } catch (error) {
    // Rollback bei Fehler
    allTeachers[index] = oldTeacher;
    throw error;
  }

  return allTeachers[index];
}

/**
 * Alle Lehrer löschen und auf Standard zurücksetzen
 */
export async function deleteAllTeachers() {
  try {
    console.log("Setze alle Lehrer auf Standard zurück...");
    
    // Zurück zu Standard-Lehrern
    allTeachers = [...DEFAULT_TEACHERS.map(teacher => ({
      ...teacher,
      createdAt: new Date().toISOString(),
      resetAt: new Date().toISOString()
    }))];
    
    // Speichern
    const saved = await saveAllTeachers();
    if (!saved) {
      throw new Error("Fehler beim Zurücksetzen der Lehrer.");
    }
    
    console.log("Alle Lehrer auf Standard zurückgesetzt");
    return true;
  } catch (error) {
    console.error("Fehler beim Zurücksetzen der Lehrer:", error);
    throw error;
  }
}

/**
 * Systemeinstellungen laden
 */
export async function loadSystemSettings() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return {...DEFAULT_SYSTEM_SETTINGS};
  }

  try {
    const docRef = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    const doc = await docRef.get();

    if (doc.exists) {
      systemSettings = doc.data();
      return systemSettings;
    } else {
      // Erste Initialisierung
      systemSettings = {...DEFAULT_SYSTEM_SETTINGS};
      
      try {
        await docRef.set({
          ...systemSettings,
          created_at: firebase.firestore.FieldValue.serverTimestamp(),
          updated_at: firebase.firestore.FieldValue.serverTimestamp()
        });
      } catch (saveError) {
        console.warn("Konnte Systemeinstellungen nicht speichern:", saveError);
      }
      
      return systemSettings;
    }
  } catch (error) {
    console.error("Fehler beim Laden der Systemeinstellungen:", error);
    return {...DEFAULT_SYSTEM_SETTINGS};
  }
}

/**
 * Systemeinstellungen speichern
 */
export async function saveSystemSettings(settings) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    const docRef = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    
    // Prüfen, ob das Dokument existiert
    const doc = await docRef.get();
    
    if (doc.exists) {
      // Aktualisieren
      await docRef.update({
        ...settings,
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      });
    } else {
      // Neu erstellen
      await docRef.set({
        ...settings,
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Lokale Systemeinstellungen aktualisieren
    systemSettings = {...settings};
    
    console.log("Systemeinstellungen erfolgreich gespeichert");
    return true;
  } catch (error) {
    console.error("Fehler beim Speichern der Systemeinstellungen:", error);
    return false;
  }
}

/**
 * Alle Themen und Bewertungsdaten löschen
 */
export async function deleteAllData() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    throw new Error("Datenbank nicht verfügbar");
  }

  try {
    console.log("Lösche alle Daten...");
    
    // Lösche alle Themen
    const themesSnapshot = await db.collection(THEMES_CONFIG.collectionName).get();
    const themesBatch = db.batch();
    
    themesSnapshot.forEach((doc) => {
      themesBatch.delete(doc.ref);
    });
    
    await themesBatch.commit();
    
    // Lösche alle Bewertungsraster (außer Standard)
    const templatesSnapshot = await db.collection(ASSESSMENT_TEMPLATES.collectionName).get();
    const templatesBatch = db.batch();
    
    templatesSnapshot.forEach((doc) => {
      if (doc.id !== "standard") {
        templatesBatch.delete(doc.ref);
      }
    });
    
    await templatesBatch.commit();
    
    console.log("Alle Daten wurden gelöscht");
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen aller Daten:", error);
    throw error;
  }
}

/**
 * Systemstatistiken abrufen
 */
export async function getSystemStats() {
  if (!db) {
    return {
      totalTeachers: allTeachers.length,
      totalThemes: 0,
      totalStudents: 0,
      totalTemplates: 0,
      firebaseStatus: "Offline",
      schoolYear: systemSettings.currentSchoolYear || "Nicht festgelegt"
    };
  }

  try {
    // Zähle alle Themen
    const themesSnapshot = await db.collection(THEMES_CONFIG.collectionName).get();
    
    // Zähle alle Bewertungsraster
    const templatesSnapshot = await db.collection(ASSESSMENT_TEMPLATES.collectionName).get();
    
    // Zähle alle Schüler (alle Themen durchlaufen und Schüler addieren)
    let totalStudents = 0;
    for (const doc of themesSnapshot.docs) {
      const theme = doc.data();
      if (theme.students && Array.isArray(theme.students)) {
        totalStudents += theme.students.length;
      }
    }
    
    return {
      totalTeachers: allTeachers.length,
      totalThemes: themesSnapshot.size,
      totalStudents: totalStudents,
      totalTemplates: templatesSnapshot.size,
      firebaseStatus: "Online",
      schoolYear: systemSettings.currentSchoolYear || "Nicht festgelegt"
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der System-Statistiken:", error);
    return {
      totalTeachers: allTeachers.length,
      totalThemes: 0,
      totalStudents: 0,
      totalTemplates: 0,
      firebaseStatus: "Error",
      schoolYear: systemSettings.currentSchoolYear || "Nicht festgelegt"
    };
  }
}

/**
 * Exportiert alle Daten aus dem System
 */
export async function exportAllData() {
  if (!db) {
    throw new Error("Datenbank nicht verfügbar");
  }

  try {
    // Alle Lehrer
    const teachers = [...allTeachers];
    
    // Systemeinstellungen
    const settings = await loadSystemSettings();
    
    // Alle Themen
    const themesSnapshot = await db.collection(THEMES_CONFIG.collectionName).get();
    const themes = themesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Alle Bewertungsraster
    const templatesSnapshot = await db.collection(ASSESSMENT_TEMPLATES.collectionName).get();
    const templates = templatesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Alle Daten zusammenfassen
    const exportData = {
      version: "1.0",
      exportDate: new Date().toISOString(),
      systemSettings: settings,
      teachers: teachers,
      themes: themes,
      assessmentTemplates: templates
    };
    
    return exportData;
  } catch (error) {
    console.error("Fehler beim Exportieren aller Daten:", error);
    throw error;
  }
}

/**
 * Importiert Daten in das System
 */
export async function importAllData(data) {
  if (!db) {
    throw new Error("Datenbank nicht verfügbar");
  }

  if (!data || !data.version) {
    throw new Error("Ungültiges Datenformat");
  }

  try {
    // Wir setzen hier Transaktionen ein, um sicherzustellen, dass entweder alles oder nichts importiert wird
    
    // 1. Systemeinstellungen importieren
    if (data.systemSettings) {
      await saveSystemSettings(data.systemSettings);
    }
    
    // 2. Lehrer importieren
    if (data.teachers && Array.isArray(data.teachers)) {
      allTeachers = [...data.teachers];
      await saveAllTeachers();
    }
    
    // 3. Bewertungsraster importieren
    if (data.assessmentTemplates && Array.isArray(data.assessmentTemplates)) {
      const templatesBatch = db.batch();
      
      // Lösche zuerst alle vorhandenen Raster (außer Standard)
      const templatesSnapshot = await db.collection(ASSESSMENT_TEMPLATES.collectionName).get();
      templatesSnapshot.forEach((doc) => {
        if (doc.id !== "standard") {
          templatesBatch.delete(doc.ref);
        }
      });
      
      // Neue Raster hinzufügen
      for (const template of data.assessmentTemplates) {
        const { id, ...templateData } = template;
        const templateRef = db.collection(ASSESSMENT_TEMPLATES.collectionName).doc(id);
        templatesBatch.set(templateRef, {
          ...templateData,
          imported_at: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      await templatesBatch.commit();
    }
    
    // 4. Themen importieren
    if (data.themes && Array.isArray(data.themes)) {
      const themesBatch = db.batch();
      
      // Lösche zuerst alle vorhandenen Themen
      const themesSnapshot = await db.collection(THEMES_CONFIG.collectionName).get();
      themesSnapshot.forEach((doc) => {
        themesBatch.delete(doc.ref);
      });
      
      // Neue Themen hinzufügen
      for (const theme of data.themes) {
        const { id, ...themeData } = theme;
        const themeRef = db.collection(THEMES_CONFIG.collectionName).doc(id);
        themesBatch.set(themeRef, {
          ...themeData,
          imported_at: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      
      await themesBatch.commit();
    }
    
    return true;
  } catch (error) {
    console.error("Fehler beim Importieren aller Daten:", error);
    throw error;
  }
}

/**
 * Prüft, ob ein Lehrer gültig ist (für Login)
 */
export function validateTeacher(code, password) {
  return allTeachers.find(t => 
    t.code.toUpperCase() === code.toUpperCase() && 
    t.password === password
  );
}

/**
 * Prüft, ob ein Lehrer die angegebene Berechtigung hat
 */
export function hasTeacherPermission(teacherCode, permission) {
  const teacher = allTeachers.find(t => t.code === teacherCode);
  if (!teacher) return false;
  
  return teacher.permissions && teacher.permissions[permission] === true;
}
export async function updateSystemDates(schoolYearEnd, lastAssessmentDate) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    const updatedSettings = {
      ...systemSettings,
      schoolYearEnd,
      lastAssessmentDate
    };
    
    const saved = await saveSystemSettings(updatedSettings);
    
    if (saved) {
      // Event auslösen für UI-Updates
      document.dispatchEvent(new CustomEvent("systemSettingsUpdated", { 
        detail: updatedSettings 
      }));
    }
    
    return saved;
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Systemdaten:", error);
    return false;
  }
}
