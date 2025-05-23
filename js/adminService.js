// js/adminService.js - ÜBERARBEITET mit Schuljahr-Management

import { db } from "./firebaseClient.js";
import { ADMIN_CONFIG, DEFAULT_TEACHERS } from "./constants.js";

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
 * System-Einstellungen (NEU)
 */
export let systemSettings = {
  currentSchoolYear: getCurrentSchoolYear(),
  nextSchoolYear: getNextSchoolYear(),
  schoolYearHistory: []
};

/**
 * Lädt alle registrierten Lehrer aus Firebase
 */
export async function loadAllTeachers() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
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
      allTeachers = [...DEFAULT_TEACHERS.map(teacher => ({
        ...teacher,
        createdAt: new Date().toISOString()
      }))];
      
      try {
        await saveAllTeachers();
      } catch (saveError) {
        console.warn("Konnte Standard-Lehrer nicht speichern:", saveError);
      }
      return true;
    }
  } catch (error) {
    console.error("Fehler beim Laden der Lehrer:", error);
    
    console.log("Verwende Fallback-Lehrer...");
    allTeachers = [...DEFAULT_TEACHERS.map(teacher => ({
      ...teacher,
      createdAt: new Date().toISOString()
    }))];
    
    return true;
  }
}

/**
 * NEU: Lädt System-Einstellungen
 */
export async function loadSystemSettings() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    const docRef = db.collection(ADMIN_CONFIG.collectionName).doc("system_settings");
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      systemSettings = {
        ...systemSettings,
        ...data
      };
    }
    
    return true;
  } catch (error) {
    console.error("Fehler beim Laden der System-Einstellungen:", error);
    return false;
  }
}

/**
 * NEU: Speichert System-Einstellungen
 */
export async function saveSystemSettings() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    await db.collection(ADMIN_CONFIG.collectionName).doc("system_settings").set({
      ...systemSettings,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    console.log("System-Einstellungen erfolgreich gespeichert");
    return true;
  } catch (error) {
    console.error("Fehler beim Speichern der System-Einstellungen:", error);
    return false;
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
export async function addTeacher(name, code, password) {
  const existing = allTeachers.find(t => t.code.toUpperCase() === code.toUpperCase());
  if (existing) {
    throw new Error(`Kürzel "${code}" ist bereits vergeben.`);
  }

  const newTeacher = {
    name: name.trim(),
    code: code.toUpperCase().trim(),
    password: password.trim(),
    createdAt: new Date().toISOString()
  };

  allTeachers.push(newTeacher);
  
  try {
    const saved = await saveAllTeachers();
    if (!saved) {
      allTeachers.pop();
      throw new Error("Fehler beim Speichern des Lehrers.");
    }
  } catch (error) {
    allTeachers.pop();
    throw error;
  }

  return newTeacher;
}

/**
 * Lehrer bearbeiten
 */
export async function updateTeacher(originalCode, name, code, password) {
  const index = allTeachers.findIndex(t => t.code === originalCode);
  if (index === -1) {
    throw new Error("Lehrer nicht gefunden.");
  }

  if (code.toUpperCase() !== originalCode) {
    const existing = allTeachers.find(t => t.code.toUpperCase() === code.toUpperCase());
    if (existing) {
      throw new Error(`Kürzel "${code}" ist bereits vergeben.`);
    }
  }

  const oldTeacher = { ...allTeachers[index] };
  
  allTeachers[index] = {
    ...allTeachers[index],
    name: name.trim(),
    code: code.toUpperCase().trim(),
    password: password.trim(),
    updatedAt: new Date().toISOString()
  };

  try {
    const saved = await saveAllTeachers();
    if (!saved) {
      allTeachers[index] = oldTeacher;
      throw new Error("Fehler beim Speichern der Änderungen.");
    }
  } catch (error) {
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
      allTeachers.splice(index, 0, deletedTeacher);
      throw new Error("Fehler beim Löschen des Lehrers.");
    }
  } catch (error) {
    allTeachers.splice(index, 0, deletedTeacher);
    throw error;
  }

  return deletedTeacher;
}

/**
 * Alle Lehrer löschen und auf Standard zurücksetzen
 */
export async function deleteAllTeachers() {
  try {
    console.log("Setze alle Lehrer auf Standard zurück...");
    
    allTeachers = [...DEFAULT_TEACHERS.map(teacher => ({
      ...teacher,
      createdAt: new Date().toISOString(),
      resetAt: new Date().toISOString()
    }))];
    
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
 * Alle Bewertungsdaten aller Lehrer löschen
 */
export async function deleteAllTeacherData() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    throw new Error("Datenbank nicht verfügbar");
  }

  try {
    console.log("Lösche alle Bewertungsdaten...");
    
    const snapshot = await db.collection("wbs_data").get();
    
    if (snapshot.empty) {
      console.log("Keine Bewertungsdaten gefunden");
      return true;
    }
    
    const batch = db.batch();
    let deleteCount = 0;
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });
    
    await batch.commit();
    
    console.log(`${deleteCount} Bewertungsdaten-Dokumente gelöscht`);
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen der Bewertungsdaten:", error);
    throw error;
  }
}

/**
 * NEU: Neues Schuljahr beginnen - exportiert alte Daten und löscht sie
 */
export async function startNewSchoolYear() {
  if (!db) {
    throw new Error("Datenbank nicht verfügbar");
  }

  try {
    console.log("Beginne neues Schuljahr...");
    
    // 1. Alle Daten für Export sammeln
    const exportData = await collectAllDataForExport();
    
    // 2. Alte Daten exportieren (Download-Link generieren)
    const exportJson = JSON.stringify(exportData, null, 2);
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Schuljahr_${systemSettings.currentSchoolYear}_Export_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // 3. Schuljahr-Historie aktualisieren
    systemSettings.schoolYearHistory.push({
      schoolYear: systemSettings.currentSchoolYear,
      endedAt: new Date().toISOString(),
      dataExported: true
    });
    
    // 4. Neues Schuljahr setzen
    systemSettings.currentSchoolYear = systemSettings.nextSchoolYear;
    systemSettings.nextSchoolYear = getNextSchoolYear();
    
    // 5. Alle Bewertungsdaten löschen
    await deleteAllTeacherData();
    
    // 6. System-Einstellungen speichern
    await saveSystemSettings();
    
    console.log(`Neues Schuljahr ${systemSettings.currentSchoolYear} erfolgreich gestartet`);
    return true;
  } catch (error) {
    console.error("Fehler beim Starten des neuen Schuljahres:", error);
    throw error;
  }
}

/**
 * NEU: Sammelt alle Daten für Export
 */
export async function collectAllDataForExport() {
  if (!db) {
    throw new Error("Datenbank nicht verfügbar");
  }

  try {
    const exportData = {
      schoolYear: systemSettings.currentSchoolYear,
      exportDate: new Date().toISOString(),
      teachers: allTeachers.map(t => ({ name: t.name, code: t.code })), // Ohne Passwörter
      teacherData: {}
    };

    const snapshot = await db.collection("wbs_data").get();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      exportData.teacherData[doc.id] = {
        teacher_name: data.teacher_name,
        groups: data.data.groups || [],
        assessments: data.data.assessments || {},
        settings: data.data.settings || {}
      };
    });

    return exportData;
  } catch (error) {
    console.error("Fehler beim Sammeln der Export-Daten:", error);
    throw error;
  }
}

/**
 * NEU: Schuljahr manuell setzen
 */
export async function setCurrentSchoolYear(schoolYear) {
  systemSettings.currentSchoolYear = schoolYear;
  systemSettings.nextSchoolYear = getNextSchoolYear();
  
  try {
    await saveSystemSettings();
    return true;
  } catch (error) {
    console.error("Fehler beim Setzen des Schuljahres:", error);
    return false;
  }
}

/**
 * System-Statistiken abrufen
 */
export async function getSystemStats() {
  if (!db) {
    return {
      totalTeachers: allTeachers.length,
      totalStudentData: 0,
      firebaseStatus: "Offline",
      currentSchoolYear: systemSettings.currentSchoolYear,
      nextSchoolYear: systemSettings.nextSchoolYear
    };
  }

  try {
    const snapshot = await db.collection("wbs_data").get();
    
    return {
      totalTeachers: allTeachers.length,
      totalStudentData: snapshot.size,
      firebaseStatus: "Online",
      currentSchoolYear: systemSettings.currentSchoolYear,
      nextSchoolYear: systemSettings.nextSchoolYear
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der System-Statistiken:", error);
    return {
      totalTeachers: allTeachers.length,
      totalStudentData: 0,
      firebaseStatus: "Error",
      currentSchoolYear: systemSettings.currentSchoolYear,
      nextSchoolYear: systemSettings.nextSchoolYear
    };
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
 * Hilfsfunktionen für Schuljahr-Berechnung
 */
function getCurrentSchoolYear() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  
  if (month >= 9) return `${year}/${year + 1}`;
  else return `${year - 1}/${year}`;
}

function getNextSchoolYear() {
  const current = systemSettings.currentSchoolYear || getCurrentSchoolYear();
  const startYear = parseInt(current.split('/')[0]);
  return `${startYear + 1}/${startYear + 2}`;
}
