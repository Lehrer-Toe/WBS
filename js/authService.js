// js/authService.js - Firebase Authentication Service
import { auth, db } from "./firebaseClient.js";
import { showLoader, hideLoader, showNotification } from "./uiService.js";
import { currentUser } from "./dataService.js";

/**
 * Aktueller Firebase Auth-Benutzer
 */
let firebaseUser = null;

/**
 * Initialisiert den Auth-Listener
 */
export function initAuthListener() {
  if (!auth) {
    console.error("Firebase Auth ist nicht initialisiert!");
    return;
  }

  auth.onAuthStateChanged(async (user) => {
    if (user) {
      console.log("Benutzer angemeldet:", user.email);
      firebaseUser = user;
      
      // Lade Benutzerdaten aus Firestore
      await loadUserDataFromFirestore(user.uid);
      
      // Event auslösen
      document.dispatchEvent(new CustomEvent("authStateChanged", { 
        detail: { isAuthenticated: true, user } 
      }));
    } else {
      console.log("Kein Benutzer angemeldet");
      firebaseUser = null;
      
      // Event auslösen
      document.dispatchEvent(new CustomEvent("authStateChanged", { 
        detail: { isAuthenticated: false } 
      }));
    }
  });
}

/**
 * Meldet einen Benutzer mit E-Mail und Passwort an
 */
export async function signInWithEmail(email, password) {
  if (!auth) {
    throw new Error("Firebase Auth ist nicht initialisiert!");
  }

  try {
    showLoader();
    
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    firebaseUser = userCredential.user;
    
    console.log("Anmeldung erfolgreich:", firebaseUser.email);
    return userCredential.user;
  } catch (error) {
    console.error("Anmeldefehler:", error);
    
    // Benutzerfreundliche Fehlermeldungen
    let message = "Anmeldung fehlgeschlagen";
    
    switch (error.code) {
      case 'auth/invalid-email':
        message = "Ungültige E-Mail-Adresse";
        break;
      case 'auth/user-disabled':
        message = "Dieser Benutzer wurde deaktiviert";
        break;
      case 'auth/user-not-found':
        message = "Benutzer nicht gefunden";
        break;
      case 'auth/wrong-password':
        message = "Falsches Passwort";
        break;
      case 'auth/invalid-credential':
        message = "Ungültige Anmeldedaten";
        break;
      case 'auth/too-many-requests':
        message = "Zu viele fehlgeschlagene Anmeldeversuche. Bitte versuchen Sie es später erneut.";
        break;
    }
    
    throw new Error(message);
  } finally {
    hideLoader();
  }
}

/**
 * Registriert einen neuen Benutzer (nur für Admins)
 */
export async function createUserWithEmail(email, password, userData) {
  if (!auth) {
    throw new Error("Firebase Auth ist nicht initialisiert!");
  }

  try {
    // Neuen Benutzer erstellen
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Benutzerdaten in Firestore speichern
    await db.collection("users").doc(user.uid).set({
      email: email,
      name: userData.name,
      code: userData.code,
      permissions: userData.permissions || {},
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: firebaseUser ? firebaseUser.uid : 'system'
    });
    
    console.log("Benutzer erfolgreich erstellt:", email);
    return user;
  } catch (error) {
    console.error("Fehler beim Erstellen des Benutzers:", error);
    
    let message = "Fehler beim Erstellen des Benutzers";
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = "Diese E-Mail-Adresse wird bereits verwendet";
        break;
      case 'auth/invalid-email':
        message = "Ungültige E-Mail-Adresse";
        break;
      case 'auth/weak-password':
        message = "Das Passwort ist zu schwach (mindestens 6 Zeichen)";
        break;
    }
    
    throw new Error(message);
  }
}

/**
 * Meldet den aktuellen Benutzer ab
 */
export async function signOut() {
  if (!auth) {
    throw new Error("Firebase Auth ist nicht initialisiert!");
  }

  try {
    await auth.signOut();
    firebaseUser = null;
    
    // Benutzerdaten zurücksetzen
    currentUser.name = null;
    currentUser.code = null;
    currentUser.email = null;
    currentUser.permissions = {};
    currentUser.uid = null;
    
    console.log("Benutzer abgemeldet");
  } catch (error) {
    console.error("Fehler beim Abmelden:", error);
    throw error;
  }
}

/**
 * Lädt Benutzerdaten aus Firestore
 */
async function loadUserDataFromFirestore(uid) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return;
  }

  try {
    const userDoc = await db.collection("users").doc(uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      
      // Aktualisiere currentUser
      currentUser.uid = uid;
      currentUser.email = userData.email;
      currentUser.name = userData.name;
      currentUser.code = userData.code;
      currentUser.permissions = userData.permissions || {};
      
      console.log("Benutzerdaten geladen:", currentUser);
    } else {
      console.warn("Keine Benutzerdaten in Firestore gefunden");
      
      // Fallback: Verwende E-Mail als Namen
      currentUser.uid = uid;
      currentUser.email = firebaseUser.email;
      currentUser.name = firebaseUser.email.split('@')[0];
      currentUser.code = firebaseUser.email.substring(0, 3).toUpperCase();
      currentUser.permissions = {};
    }
  } catch (error) {
    console.error("Fehler beim Laden der Benutzerdaten:", error);
  }
}

/**
 * Aktualisiert das Passwort des aktuellen Benutzers
 */
export async function updatePassword(newPassword) {
  if (!firebaseUser) {
    throw new Error("Kein Benutzer angemeldet");
  }

  try {
    await firebaseUser.updatePassword(newPassword);
    console.log("Passwort erfolgreich geändert");
  } catch (error) {
    console.error("Fehler beim Ändern des Passworts:", error);
    
    let message = "Fehler beim Ändern des Passworts";
    
    switch (error.code) {
      case 'auth/weak-password':
        message = "Das neue Passwort ist zu schwach (mindestens 6 Zeichen)";
        break;
      case 'auth/requires-recent-login':
        message = "Bitte melden Sie sich erneut an, um das Passwort zu ändern";
        break;
    }
    
    throw new Error(message);
  }
}

/**
 * Sendet eine E-Mail zum Zurücksetzen des Passworts
 */
export async function sendPasswordResetEmail(email) {
  if (!auth) {
    throw new Error("Firebase Auth ist nicht initialisiert!");
  }

  try {
    await auth.sendPasswordResetEmail(email);
    console.log("Passwort-Reset-E-Mail gesendet an:", email);
  } catch (error) {
    console.error("Fehler beim Senden der Reset-E-Mail:", error);
    
    let message = "Fehler beim Senden der E-Mail";
    
    switch (error.code) {
      case 'auth/invalid-email':
        message = "Ungültige E-Mail-Adresse";
        break;
      case 'auth/user-not-found':
        message = "Kein Benutzer mit dieser E-Mail-Adresse gefunden";
        break;
    }
    
    throw new Error(message);
  }
}

/**
 * Prüft, ob ein Benutzer angemeldet ist
 */
export function isAuthenticated() {
  return firebaseUser !== null;
}

/**
 * Gibt den aktuellen Firebase-Benutzer zurück
 */
export function getCurrentFirebaseUser() {
  return firebaseUser;
}

/**
 * Prüft, ob der aktuelle Benutzer Admin ist
 */
export function isAdmin() {
  return currentUser.permissions && currentUser.permissions.isAdmin === true;
}

/**
 * Prüft, ob der aktuelle Benutzer eine bestimmte Berechtigung hat
 */
export function hasPermission(permission) {
  return currentUser.permissions && currentUser.permissions[permission] === true;
}

/**
 * Aktualisiert Benutzerberechtigungen (nur für Admins)
 */
export async function updateUserPermissions(uid, permissions) {
  if (!db) {
    throw new Error("Firestore ist nicht initialisiert!");
  }

  if (!isAdmin()) {
    throw new Error("Keine Berechtigung für diese Aktion");
  }

  try {
    await db.collection("users").doc(uid).update({
      permissions: permissions,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log("Benutzerberechtigungen aktualisiert");
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Berechtigungen:", error);
    throw error;
  }
}

/**
 * Lädt alle Benutzer (nur für Admins)
 */
export async function loadAllUsers() {
  if (!db) {
    throw new Error("Firestore ist nicht initialisiert!");
  }

  if (!isAdmin()) {
    throw new Error("Keine Berechtigung für diese Aktion");
  }

  try {
    const snapshot = await db.collection("users").get();
    const users = [];
    
    snapshot.forEach(doc => {
      users.push({
        uid: doc.id,
        ...doc.data()
      });
    });
    
    return users;
  } catch (error) {
    console.error("Fehler beim Laden der Benutzer:", error);
    throw error;
  }
}

/**
 * Löscht einen Benutzer (nur für Admins)
 * Hinweis: Dies löscht nur die Firestore-Daten, nicht den Auth-Benutzer
 */
export async function deleteUserData(uid) {
  if (!db) {
    throw new Error("Firestore ist nicht initialisiert!");
  }

  if (!isAdmin()) {
    throw new Error("Keine Berechtigung für diese Aktion");
  }

  try {
    await db.collection("users").doc(uid).delete();
    console.log("Benutzerdaten gelöscht");
  } catch (error) {
    console.error("Fehler beim Löschen der Benutzerdaten:", error);
    throw error;
  }
}
