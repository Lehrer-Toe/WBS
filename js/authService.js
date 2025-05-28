// js/authService.js - Neue Firebase Auth Integration
import { auth, db } from "./firebaseClient.js";
import { showLoader, hideLoader, showNotification } from "./uiService.js";

/**
 * Aktueller Benutzer
 */
export let currentUser = {
  uid: null,
  email: null,
  name: null,
  role: 'teacher', // 'teacher' oder 'admin'
  permissions: {},
  isLoggedIn: false
};

/**
 * Benutzertypen
 */
export const USER_ROLES = {
  TEACHER: 'teacher',
  ADMIN: 'admin'
};

/**
 * Registriert einen neuen Benutzer (nur für Admins)
 */
export async function registerUser(email, password, userData) {
  if (!auth) {
    throw new Error("Firebase Auth ist nicht initialisiert");
  }
  
  try {
    showLoader();
    
    // Erstelle neuen Benutzer
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Erstelle Benutzerprofil in Firestore
    const userProfile = {
      uid: user.uid,
      email: email,
      name: userData.name || "",
      role: userData.role || USER_ROLES.TEACHER,
      permissions: userData.permissions || {},
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      isActive: true
    };
    
    await db.collection("users").doc(user.uid).set(userProfile);
    
    console.log("Neuer Benutzer registriert:", email);
    return user;
  } catch (error) {
    console.error("Fehler bei der Registrierung:", error);
    throw error;
  } finally {
    hideLoader();
  }
}

/**
 * Meldet einen Benutzer an
 */
export async function loginUser(email, password) {
  if (!auth) {
    throw new Error("Firebase Auth ist nicht initialisiert");
  }
  
  try {
    showLoader();
    
    // Anmeldung bei Firebase Auth
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Lade Benutzerprofil aus Firestore
    const userDoc = await db.collection("users").doc(user.uid).get();
    
    if (!userDoc.exists) {
      throw new Error("Benutzerprofil nicht gefunden");
    }
    
    const userData = userDoc.data();
    
    // Prüfe, ob Benutzer aktiv ist
    if (!userData.isActive) {
      throw new Error("Ihr Konto wurde deaktiviert. Kontaktieren Sie den Administrator.");
    }
    
    // Aktualisiere currentUser
    currentUser = {
      uid: user.uid,
      email: user.email,
      name: userData.name || user.email,
      role: userData.role || USER_ROLES.TEACHER,
      permissions: userData.permissions || {},
      isLoggedIn: true
    };
    
    // Letzte Anmeldung aktualisieren
    await db.collection("users").doc(user.uid).update({
      lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log("Benutzer angemeldet:", currentUser.email);
    return currentUser;
  } catch (error) {
    console.error("Fehler bei der Anmeldung:", error);
    throw error;
  } finally {
    hideLoader();
  }
}

/**
 * Meldet den aktuellen Benutzer ab
 */
export async function logoutUser() {
  if (!auth) return;
  
  try {
    await auth.signOut();
    
    // Setze currentUser zurück
    currentUser = {
      uid: null,
      email: null,
      name: null,
      role: 'teacher',
      permissions: {},
      isLoggedIn: false
    };
    
    console.log("Benutzer abgemeldet");
    return true;
  } catch (error) {
    console.error("Fehler bei der Abmeldung:", error);
    throw error;
  }
}

/**
 * Überwacht den Authentifizierungsstatus
 */
export function initAuthStateListener() {
  if (!auth) return;
  
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      try {
        // Lade Benutzerprofil
        const userDoc = await db.collection("users").doc(user.uid).get();
        
        if (userDoc.exists) {
          const userData = userDoc.data();
          
          currentUser = {
            uid: user.uid,
            email: user.email,
            name: userData.name || user.email,
            role: userData.role || USER_ROLES.TEACHER,
            permissions: userData.permissions || {},
            isLoggedIn: true
          };
          
          // Event für erfolgreiche Anmeldung
          document.dispatchEvent(new CustomEvent('userLoggedIn', {
            detail: currentUser
          }));
        }
      } catch (error) {
        console.error("Fehler beim Laden des Benutzerprofils:", error);
      }
    } else {
      // Benutzer abgemeldet
      currentUser = {
        uid: null,
        email: null,
        name: null,
        role: 'teacher',
        permissions: {},
        isLoggedIn: false
      };
      
      // Event für Abmeldung
      document.dispatchEvent(new Event('userLoggedOut'));
    }
  });
}

/**
 * Aktualisiert das Benutzerprofil
 */
export async function updateUserProfile(userId, userData) {
  if (!db) {
    throw new Error("Firestore ist nicht initialisiert");
  }
  
  try {
    const userRef = db.collection("users").doc(userId);
    const updates = {
      ...userData,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    await userRef.update(updates);
    
    // Aktualisiere currentUser, falls es der aktuelle Benutzer ist
    if (currentUser.uid === userId) {
      currentUser = {
        ...currentUser,
        ...userData
      };
    }
    
    return true;
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Profils:", error);
    throw error;
  }
}

/**
 * Lädt alle Benutzer (nur für Admins)
 */
export async function loadAllUsers() {
  if (!db) {
    throw new Error("Firestore ist nicht initialisiert");
  }
  
  if (currentUser.role !== USER_ROLES.ADMIN) {
    throw new Error("Keine Berechtigung");
  }
  
  try {
    const snapshot = await db.collection("users").orderBy("name").get();
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Fehler beim Laden der Benutzer:", error);
    throw error;
  }
}

/**
 * Deaktiviert/Aktiviert einen Benutzer (nur für Admins)
 */
export async function toggleUserStatus(userId, isActive) {
  if (currentUser.role !== USER_ROLES.ADMIN) {
    throw new Error("Keine Berechtigung");
  }
  
  try {
    await db.collection("users").doc(userId).update({
      isActive: isActive,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error("Fehler beim Ändern des Benutzerstatus:", error);
    throw error;
  }
}

/**
 * Ändert das Passwort des aktuellen Benutzers
 */
export async function changePassword(newPassword) {
  if (!auth.currentUser) {
    throw new Error("Kein Benutzer angemeldet");
  }
  
  try {
    await auth.currentUser.updatePassword(newPassword);
    return true;
  } catch (error) {
    console.error("Fehler beim Ändern des Passworts:", error);
    throw error;
  }
}

/**
 * Sendet eine Passwort-Reset-E-Mail
 */
export async function sendPasswordResetEmail(email) {
  if (!auth) {
    throw new Error("Firebase Auth ist nicht initialisiert");
  }
  
  try {
    await auth.sendPasswordResetEmail(email);
    return true;
  } catch (error) {
    console.error("Fehler beim Senden der Passwort-Reset-E-Mail:", error);
    throw error;
  }
}

/**
 * Prüft, ob der aktuelle Benutzer Admin ist
 */
export function isAdmin() {
  return currentUser.role === USER_ROLES.ADMIN;
}

/**
 * Prüft, ob der aktuelle Benutzer eine bestimmte Berechtigung hat
 */
export function hasPermission(permission) {
  return currentUser.permissions && currentUser.permissions[permission] === true;
}

/**
 * Gibt die aktuellen Benutzerdaten zurück
 */
export function getUserData() {
  return { ...currentUser };
}
