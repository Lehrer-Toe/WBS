// js/firebaseClient.js - Erweiterte Version
// Direkte Firebase-Konfiguration für den Browser
export let db = null;
export let auth = null;

// Fallback-Konfiguration falls firebaseConfig.js nicht verfügbar ist
const FALLBACK_CONFIG = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

let FIREBASE_CONFIG = FALLBACK_CONFIG;

// Versuche firebaseConfig.js zu importieren
try {
  const configModule = await import("./firebaseConfig.js");
  FIREBASE_CONFIG = configModule.FIREBASE_CONFIG || FALLBACK_CONFIG;
} catch (error) {
  console.warn("firebaseConfig.js nicht gefunden, verwende Fallback-Konfiguration");
}

/**
 * Initialisiert die Verbindung zu Firebase
 */
export async function initDatabase() {
  try {
    // Prüfen, ob die Konfiguration gültig ist
    if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
      console.error("Firebase-Konfiguration unvollständig:", FIREBASE_CONFIG);
      return false;
    }

    // Firebase initialisieren
    firebase.initializeApp(FIREBASE_CONFIG);
    
    // Firestore-Instanz abrufen
    db = firebase.firestore();
    auth = firebase.auth();
    
    // Offline-Persistenz aktivieren (optional)
    try {
      await db.enablePersistence({synchronizeTabs: true}).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Persistenz konnte nicht aktiviert werden, möglicherweise mehrere Tabs geöffnet');
        } else if (err.code === 'unimplemented') {
          console.warn('Ihr Browser unterstützt keine Persistenz');
        }
      });
    } catch (persistenceError) {
      console.warn("Persistenz-Fehler, nicht kritisch:", persistenceError);
    }
    
    console.log("Firebase erfolgreich initialisiert");

    // Initialisiere System-Einstellungen, falls sie noch nicht existieren
    await ensureSystemSettings();
    
    // Initialisiere Standard-Bewertungsraster
    await ensureDefaultAssessmentTemplate();
    
    // NEU: Überprüfe und aktualisiere Datenstruktur
    await migrateDataStructure();
    
    return true;
  } catch (error) {
    console.error("Fehler bei der Firebase-Initialisierung:", error);
    alert("Fehler bei der Firebase-Initialisierung. Bitte prüfen Sie die Konsole für Details.");
    return false;
  }
}

/**
 * Prüft, ob Systemeinstellungen existieren und erstellt sie, falls nicht
 */
export async function ensureSystemSettings() {
  if (!db) return false;

  try {
    const settingsRef = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    const doc = await settingsRef.get();

    if (!doc.exists) {
      console.log("Systemeinstellungen werden initialisiert...");
      
      // NEU: Erweiterte Standard-Systemeinstellungen
      const currentYear = new Date().getFullYear();
      const defaultSettings = {
        ...DEFAULT_SYSTEM_SETTINGS,
        currentSchoolYear: `${currentYear}/${currentYear + 1}`,
        schoolYearEnd: null,
        lastAssessmentDate: null,
        version: "2.0",
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp()
      };
      
      await settingsRef.set(defaultSettings);
      console.log("Systemeinstellungen erfolgreich initialisiert");
    } else {
      console.log("Systemeinstellungen bereits vorhanden");
      
      // NEU: Prüfe, ob alle neuen Felder vorhanden sind
      const data = doc.data();
      let needsUpdate = false;
      const updates = {};
      
      if (!data.schoolYearEnd) {
        updates.schoolYearEnd = null;
        needsUpdate = true;
      }
      
      if (!data.lastAssessmentDate) {
        updates.lastAssessmentDate = null;
        needsUpdate = true;
      }
      
      if (!data.version) {
        updates.version = "2.0";
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        updates.updated_at = firebase.firestore.FieldValue.serverTimestamp();
        await settingsRef.update(updates);
        console.log("Systemeinstellungen aktualisiert mit neuen Feldern");
      }
    }
    return true;
  } catch (error) {
    console.error("Fehler beim Initialisieren der Systemeinstellungen:", error);
    return false;
  }
}

/**
 * Prüft, ob die notwendigen Sammlungen existieren und erstellt sie
 */
export async function ensureCollections() {
  if (!db) return false;
  
  try {
    // In Firestore müssen Sammlungen nicht explizit erstellt werden
    // Sie entstehen automatisch beim ersten Dokument
    console.log("Firebase-Collections sind bereit");
    return true;
  } catch (error) {
    console.error("Fehler beim Prüfen der Collections:", error);
    return false;
  }
}

/**
 * Lädt die Systemeinstellungen
 */
export async function getSystemSettings() {
  if (!db) return null;

  try {
    const settingsRef = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    const doc = await settingsRef.get();

    if (doc.exists) {
      return doc.data();
    } else {
      // Falls keine Einstellungen vorhanden sind, erstelle sie
      await ensureSystemSettings();
      const newDoc = await settingsRef.get();
      return newDoc.data();
    }
  } catch (error) {
    console.error("Fehler beim Laden der Systemeinstellungen:", error);
    return null;
  }
}

/**
 * Aktualisiert die Systemeinstellungen
 */
export async function updateSystemSettings(settings) {
  if (!db) return false;

  try {
    const settingsRef = db.collection(SYSTEM_SETTINGS.collectionName).doc(SYSTEM_SETTINGS.documentName);
    
    // NEU: Erweiterte Validierung der Einstellungen
    const validatedSettings = validateSystemSettings(settings);
    
    await settingsRef.update({
      ...validatedSettings,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log("Systemeinstellungen erfolgreich aktualisiert");
    return true;
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Systemeinstellungen:", error);
    return false;
  }
}

/**
 * NEU: Validiert Systemeinstellungen vor dem Speichern
 */
function validateSystemSettings(settings) {
  const validated = { ...settings };
  
  // Schuljahr validieren
  if (validated.currentSchoolYear) {
    const schoolYearPattern = /^\d{4}\/\d{4}$/;
    if (!schoolYearPattern.test(validated.currentSchoolYear)) {
      console.warn("Ungültiges Schuljahr-Format:", validated.currentSchoolYear);
      delete validated.currentSchoolYear;
    }
  }
  
  // Datumsfelder validieren
  if (validated.schoolYearEnd) {
    const endDate = new Date(validated.schoolYearEnd);
    if (isNaN(endDate.getTime())) {
      console.warn("Ungültiges Schuljahresende:", validated.schoolYearEnd);
      delete validated.schoolYearEnd;
    }
  }
  
  if (validated.lastAssessmentDate) {
    const assessmentDate = new Date(validated.lastAssessmentDate);
    if (isNaN(assessmentDate.getTime())) {
      console.warn("Ungültiges Bewertungsdatum:", validated.lastAssessmentDate);
      delete validated.lastAssessmentDate;
    }
  }
  
  return validated;
}

/**
 * Initialisiert das Standardbewertungsraster, falls es noch nicht existiert
 */
export async function ensureDefaultAssessmentTemplate() {
  if (!db) return false;

  try {
    const templateRef = db.collection("wbs_assessment_templates").doc("standard");
    const doc = await templateRef.get();

    if (!doc.exists) {
      console.log("Erstelle Standard-Bewertungsraster...");
      
      await templateRef.set({
        name: "Standard-Bewertungsraster",
        description: "Das Standard-Bewertungsraster für alle Themen",
        isDefault: true,
        created_by: "SYSTEM",
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        version: "2.0",
        categories: DEFAULT_ASSESSMENT_CATEGORIES.map(cat => ({
          id: cat.id,
          name: cat.name,
          weight: 1
        }))
      });
      
      console.log("Standard-Bewertungsraster erfolgreich erstellt");
      return true;
    } else {
      // NEU: Prüfe, ob das Standard-Raster aktualisiert werden muss
      const data = doc.data();
      if (!data.version || data.version !== "2.0") {
        console.log("Aktualisiere Standard-Bewertungsraster...");
        
        await templateRef.update({
          version: "2.0",
          description: "Das Standard-Bewertungsraster für alle Themen",
          updated_at: firebase.firestore.FieldValue.serverTimestamp(),
          categories: DEFAULT_ASSESSMENT_CATEGORIES.map(cat => ({
            id: cat.id,
            name: cat.name,
            weight: 1
          }))
        });
        
        console.log("Standard-Bewertungsraster aktualisiert");
      }
      return true;
    }
  } catch (error) {
    console.error("Fehler beim Initialisieren des Standard-Bewertungsrasters:", error);
    return false;
  }
}

/**
 * NEU: Migriert die Datenstruktur auf die neue Version
 */
export async function migrateDataStructure() {
  if (!db) return false;
  
  try {
    console.log("Prüfe Datenstruktur-Migration...");
    
    // 1. Migriere Themen (füge fehlende Felder hinzu)
    await migrateThemes();
    
    // 2. Migriere Schüler (füge Klassen-Felder hinzu)
    await migrateStudents();
    
    // 3. Migriere Bewertungsraster (aktualisiere Struktur)
    await migrateAssessmentTemplates();
    
    console.log("Datenstruktur-Migration abgeschlossen");
    return true;
  } catch (error) {
    console.error("Fehler bei der Datenstruktur-Migration:", error);
    return false;
  }
}

/**
 * NEU: Migriert Themen-Dokumente
 */
async function migrateThemes() {
  try {
    const themesRef = db.collection("wbs_themes");
    const snapshot = await themesRef.get();
    
    if (snapshot.empty) {
      console.log("Keine Themen zum Migrieren gefunden");
      return;
    }
    
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      let needsUpdate = false;
      const updates = {};
      
      // Prüfe auf fehlende Felder
      if (!data.assessment_template_id) {
        updates.assessment_template_id = "standard";
        needsUpdate = true;
      }
      
      if (!data.school_year) {
        const currentYear = new Date().getFullYear();
        updates.school_year = `${currentYear}/${currentYear + 1}`;
        needsUpdate = true;
      }
      
      if (!data.version) {
        updates.version = "2.0";
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        updates.migrated_at = firebase.firestore.FieldValue.serverTimestamp();
        batch.update(doc.ref, updates);
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`${updateCount} Themen migriert`);
    } else {
      console.log("Alle Themen sind bereits aktuell");
    }
  } catch (error) {
    console.error("Fehler bei der Themen-Migration:", error);
  }
}

/**
 * NEU: Migriert Schüler-Daten (fügt Klassen-Felder hinzu)
 */
async function migrateStudents() {
  try {
    const themesRef = db.collection("wbs_themes");
    const snapshot = await themesRef.get();
    
    if (snapshot.empty) {
      console.log("Keine Themen mit Schülern zum Migrieren gefunden");
      return;
    }
    
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      
      if (data.students && Array.isArray(data.students)) {
        let studentsUpdated = false;
        const updatedStudents = data.students.map(student => {
          if (!student.class) {
            studentsUpdated = true;
            return {
              ...student,
              class: "", // Leeres Feld für spätere Befüllung
              migrated_at: new Date().toISOString()
            };
          }
          return student;
        });
        
        if (studentsUpdated) {
          batch.update(doc.ref, {
            students: updatedStudents,
            students_migrated_at: firebase.firestore.FieldValue.serverTimestamp()
          });
          updateCount++;
        }
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`${updateCount} Themen mit Schüler-Migration aktualisiert`);
    } else {
      console.log("Alle Schüler-Daten sind bereits aktuell");
    }
  } catch (error) {
    console.error("Fehler bei der Schüler-Migration:", error);
  }
}

/**
 * NEU: Migriert Bewertungsraster-Struktur
 */
async function migrateAssessmentTemplates() {
  try {
    const templatesRef = db.collection("wbs_assessment_templates");
    const snapshot = await templatesRef.get();
    
    if (snapshot.empty) {
      console.log("Keine Bewertungsraster zum Migrieren gefunden");
      return;
    }
    
    const batch = db.batch();
    let updateCount = 0;
    
    snapshot.forEach(doc => {
      const data = doc.data();
      let needsUpdate = false;
      const updates = {};
      
      // Prüfe auf fehlende Felder
      if (!data.version) {
        updates.version = "2.0";
        needsUpdate = true;
      }
      
      // Prüfe Kategorien-Struktur
      if (data.categories && Array.isArray(data.categories)) {
        const updatedCategories = data.categories.map(cat => {
          if (typeof cat === 'string') {
            // Alte String-Struktur zu Objekt-Struktur konvertieren
            return {
              id: cat.toLowerCase().replace(/[^a-z0-9]/g, "_"),
              name: cat,
              weight: 1
            };
          } else if (cat && !cat.weight) {
            // Fehlende Gewichtung hinzufügen
            return {
              ...cat,
              weight: 1
            };
          }
          return cat;
        });
        
        if (JSON.stringify(updatedCategories) !== JSON.stringify(data.categories)) {
          updates.categories = updatedCategories;
          needsUpdate = true;
        }
      }
      
      if (needsUpdate) {
        updates.migrated_at = firebase.firestore.FieldValue.serverTimestamp();
        batch.update(doc.ref, updates);
        updateCount++;
      }
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`${updateCount} Bewertungsraster migriert`);
    } else {
      console.log("Alle Bewertungsraster sind bereits aktuell");
    }
  } catch (error) {
    console.error("Fehler bei der Bewertungsraster-Migration:", error);
  }
}

/**
 * NEU: Prüft die Datenbank-Gesundheit
 */
export async function checkDatabaseHealth() {
  if (!db) return { status: "disconnected", issues: ["Keine Datenbankverbindung"] };
  
  const health = {
    status: "healthy",
    issues: [],
    collections: {},
    lastChecked: new Date().toISOString()
  };
  
  try {
    // Prüfe System-Einstellungen
    const systemSettings = await getSystemSettings();
    if (!systemSettings) {
      health.issues.push("Systemeinstellungen nicht verfügbar");
      health.status = "warning";
    } else {
      health.collections.systemSettings = {
        exists: true,
        version: systemSettings.version || "unknown"
      };
    }
    
    // Prüfe Lehrer-Collection
    const teachersDoc = await db.collection("wbs_teachers").doc("teachers_list").get();
    health.collections.teachers = {
      exists: teachersDoc.exists,
      count: teachersDoc.exists && teachersDoc.data().teachers ? teachersDoc.data().teachers.length : 0
    };
    
    // Prüfe Themen-Collection
    const themesSnapshot = await db.collection("wbs_themes").limit(1).get();
    health.collections.themes = {
      exists: !themesSnapshot.empty,
      accessible: true
    };
    
    // Prüfe Bewertungsraster-Collection
    const templatesSnapshot = await db.collection("wbs_assessment_templates").limit(1).get();
    health.collections.assessmentTemplates = {
      exists: !templatesSnapshot.empty,
      accessible: true
    };
    
    if (health.issues.length > 0) {
      health.status = health.issues.length > 2 ? "error" : "warning";
    }
    
  } catch (error) {
    console.error("Fehler bei der Gesundheitsprüfung:", error);
    health.status = "error";
    health.issues.push(`Datenbankfehler: ${error.message}`);
  }
  
  return health;
}

/**
 * NEU: Bereinigt verwaiste Daten
 */
export async function cleanupOrphanedData() {
  if (!db) return { cleaned: 0, errors: [] };
  
  const result = { cleaned: 0, errors: [] };
  
  try {
    console.log("Starte Datenbereinigung...");
    
    // 1. Bereinige Themen ohne gültigen Ersteller
    const teachersDoc = await db.collection("wbs_teachers").doc("teachers_list").get();
    const validTeachers = teachersDoc.exists && teachersDoc.data().teachers 
      ? teachersDoc.data().teachers.map(t => t.code) 
      : [];
    
    const themesSnapshot = await db.collection("wbs_themes").get();
    const batch = db.batch();
    
    themesSnapshot.forEach(doc => {
      const theme = doc.data();
      if (theme.created_by && !validTeachers.includes(theme.created_by)) {
        console.log(`Lösche verwaistes Thema: ${theme.title} (Ersteller: ${theme.created_by})`);
        batch.delete(doc.ref);
        result.cleaned++;
      }
    });
    
    if (result.cleaned > 0) {
      await batch.commit();
      console.log(`${result.cleaned} verwaiste Themen bereinigt`);
    }
    
  } catch (error) {
    console.error("Fehler bei der Datenbereinigung:", error);
    result.errors.push(error.message);
  }
  
  return result;
}
