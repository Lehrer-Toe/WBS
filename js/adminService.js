// js/adminService.js

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
export async function addTeacher(name, code, password) {
  // Prüfen, ob Kürzel bereits existiert
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
export async function updateTeacher(originalCode, name, code, password) {
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
 * NEUE FUNKTION: Alle Lehrer löschen und auf Standard zurücksetzen
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
 * NEUE FUNKTION: Alle Bewertungsdaten aller Lehrer löschen
 */
export async function deleteAllTeacherData() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    throw new Error("Datenbank nicht verfügbar");
  }

  try {
    console.log("Lösche alle Bewertungsdaten...");
    
    // Hole alle Dokumente aus der wbs_data Collection
    const snapshot = await db.collection("wbs_data").get();
    
    if (snapshot.empty) {
      console.log("Keine Bewertungsdaten gefunden");
      return true;
    }
    
    // Batch-Delete für bessere Performance
    const batch = db.batch();
    let deleteCount = 0;
    
    snapshot.forEach((doc) => {
      batch.delete(doc.ref);
      deleteCount++;
    });
    
    // Batch ausführen
    await batch.commit();
    
    console.log(`${deleteCount} Bewertungsdaten-Dokumente gelöscht`);
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen der Bewertungsdaten:", error);
    throw error;
  }
}

/**
 * NEUE FUNKTION: Spezifische Lehrer-Bewertungsdaten löschen
 */
export async function deleteTeacherData(teacherCode) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    throw new Error("Datenbank nicht verfügbar");
  }

  try {
    console.log(`Lösche Bewertungsdaten für Lehrer: ${teacherCode}`);
    
    // Lösche das spezifische Dokument
    await db.collection("wbs_data").doc(teacherCode).delete();
    
    console.log(`Bewertungsdaten für ${teacherCode} gelöscht`);
    return true;
  } catch (error) {
    console.error(`Fehler beim Löschen der Daten für ${teacherCode}:`, error);
    throw error;
  }
}

/**
 * NEUE FUNKTION: System-Statistiken abrufen
 */
export async function getSystemStats() {
  if (!db) {
    return {
      totalTeachers: allTeachers.length,
      totalStudentData: 0,
      firebaseStatus: "Offline"
    };
  }

  try {
    // Zähle alle Bewertungsdokumente
    const snapshot = await db.collection("wbs_data").get();
    
    return {
      totalTeachers: allTeachers.length,
      totalStudentData: snapshot.size,
      firebaseStatus: "Online"
    };
  } catch (error) {
    console.error("Fehler beim Abrufen der System-Statistiken:", error);
    return {
      totalTeachers: allTeachers.length,
      totalStudentData: 0,
      firebaseStatus: "Error"
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
