// js/adminService.js

import { db } from "./firebaseClient.js";
import { ADMIN_CONFIG } from "./constants.js";

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
    return false;
  }

  try {
    const docRef = db.collection(ADMIN_CONFIG.collectionName).doc("teachers_list");
    const doc = await docRef.get();

    if (doc.exists) {
      const data = doc.data();
      allTeachers = data.teachers || [];
      console.log("Lehrer erfolgreich geladen:", allTeachers.length);
      return true;
    } else {
      // Erste Initialisierung - erstelle Dokument mit Standard-Lehrern
      allTeachers = [
        { name: "Kretz", code: "KRE", password: "Luna", createdAt: new Date().toISOString() },
        { name: "Riffel", code: "RIF", password: "Luna", createdAt: new Date().toISOString() },
        { name: "Töllner", code: "TOE", password: "Luna", createdAt: new Date().toISOString() }
      ];
      await saveAllTeachers();
      return true;
    }
  } catch (error) {
    console.error("Fehler beim Laden der Lehrer:", error);
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
  const saved = await saveAllTeachers();
  
  if (!saved) {
    // Rollback bei Fehler
    allTeachers.pop();
    throw new Error("Fehler beim Speichern des Lehrers.");
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

  const saved = await saveAllTeachers();
  
  if (!saved) {
    // Rollback bei Fehler
    allTeachers[index] = oldTeacher;
    throw new Error("Fehler beim Speichern der Änderungen.");
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
  const saved = await saveAllTeachers();
  
  if (!saved) {
    // Rollback bei Fehler
    allTeachers.splice(index, 0, deletedTeacher);
    throw new Error("Fehler beim Löschen des Lehrers.");
  }

  return deletedTeacher;
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
