import { db } from "./firebaseClient.js";
import { 
  DEFAULT_ASSESSMENT_CATEGORIES, 
  ASSESSMENT_TEMPLATES 
} from "./constants.js";

/**
 * Globale Variable für alle Bewertungsraster
 */
export let assessmentTemplates = [];

/**
 * Lädt alle Bewertungsraster für einen bestimmten Lehrer
 */
export async function loadAssessmentTemplatesForTeacher(teacherCode) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return [];
  }

  try {
    console.log(`Lade Bewertungsraster für Lehrer ${teacherCode}...`);
    
    // Lade nur die Raster des spezifischen Lehrers
    const snapshot = await db.collection(ASSESSMENT_TEMPLATES.collectionName)
      .where("created_by", "==", teacherCode)
      .get();
    
    const templates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`${templates.length} Bewertungsraster für ${teacherCode} geladen`);
    return templates;
  } catch (error) {
    console.error("Fehler beim Laden der Bewertungsraster:", error);
    return [];
  }
}

/**
 * Lädt alle Bewertungsraster (nur für Admin)
 */
export async function loadAllAssessmentTemplates() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    assessmentTemplates = [];
    return true;
  }

  try {
    console.log("Lade alle Bewertungsraster...");
    const snapshot = await db.collection(ASSESSMENT_TEMPLATES.collectionName).get();
    
    assessmentTemplates = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log(`${assessmentTemplates.length} Bewertungsraster insgesamt geladen`);
    return true;
  } catch (error) {
    console.error("Fehler beim Laden aller Bewertungsraster:", error);
    assessmentTemplates = [];
    return false;
  }
}

/**
 * Erstellt ein neues Bewertungsraster für einen Lehrer
 */
export async function createAssessmentTemplate(templateData, teacherCode) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return null;
  }

  if (!templateData.name) {
    throw new Error("Der Name des Bewertungsrasters ist erforderlich");
  }

  if (!templateData.categories || !Array.isArray(templateData.categories) || templateData.categories.length === 0) {
    throw new Error("Mindestens eine Bewertungskategorie ist erforderlich");
  }

  // Prüfe, ob der Lehrer bereits das Maximum erreicht hat
  const existingTemplates = await loadAssessmentTemplatesForTeacher(teacherCode);
  if (existingTemplates.length >= ASSESSMENT_TEMPLATES.maxTemplatesPerTeacher) {
    throw new Error(`Sie haben bereits das Maximum von ${ASSESSMENT_TEMPLATES.maxTemplatesPerTeacher} Bewertungsrastern erreicht`);
  }

  try {
    // ID generieren
    const templateId = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Neues Raster erstellen
    await db.collection(ASSESSMENT_TEMPLATES.collectionName).doc(templateId).set({
      name: templateData.name,
      description: templateData.description || "",
      created_by: teacherCode,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      categories: templateData.categories.map(cat => ({
        id: cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        name: cat.name,
        weight: cat.weight || 1
      }))
    });
    
    const newTemplate = {
      id: templateId,
      ...templateData,
      created_by: teacherCode,
      categories: templateData.categories.map(cat => ({
        id: cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        name: cat.name,
        weight: cat.weight || 1
      }))
    };
    
    console.log("Neues Bewertungsraster erstellt:", newTemplate.name);
    return newTemplate;
  } catch (error) {
    console.error("Fehler beim Erstellen des Bewertungsrasters:", error);
    throw error;
  }
}

/**
 * Aktualisiert ein bestehendes Bewertungsraster
 */
export async function updateAssessmentTemplate(templateId, templateData, teacherCode) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    const templateRef = db.collection(ASSESSMENT_TEMPLATES.collectionName).doc(templateId);
    const doc = await templateRef.get();
    
    if (!doc.exists) {
      throw new Error("Bewertungsraster nicht gefunden");
    }
    
    const existingTemplate = doc.data();
    
    // Prüfe, ob der Lehrer der Ersteller ist
    if (existingTemplate.created_by !== teacherCode) {
      throw new Error("Sie können nur Ihre eigenen Bewertungsraster bearbeiten");
    }
    
    // Entferne ID und andere Felder, die nicht aktualisiert werden sollen
    const { id, created_at, created_by, ...updateData } = templateData;
    
    // Aktualisiere das Raster
    await templateRef.update({
      ...updateData,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    console.log("Bewertungsraster aktualisiert:", templateId);
    return true;
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Bewertungsrasters:", error);
    throw error;
  }
}

/**
 * Löscht ein Bewertungsraster
 */
export async function deleteAssessmentTemplate(templateId, teacherCode) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  try {
    const templateRef = db.collection(ASSESSMENT_TEMPLATES.collectionName).doc(templateId);
    const doc = await templateRef.get();
    
    if (!doc.exists) {
      throw new Error("Bewertungsraster nicht gefunden");
    }
    
    const existingTemplate = doc.data();
    
    // Prüfe, ob der Lehrer der Ersteller ist
    if (existingTemplate.created_by !== teacherCode) {
      throw new Error("Sie können nur Ihre eigenen Bewertungsraster löschen");
    }
    
    // Lösche das Raster
    await templateRef.delete();
    
    console.log("Bewertungsraster gelöscht:", templateId);
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen des Bewertungsrasters:", error);
    throw error;
  }
}

/**
 * Gibt ein bestimmtes Bewertungsraster zurück
 */
export async function getAssessmentTemplate(templateId) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    
    // Fallback: Standard-Raster zurückgeben
    return {
      id: "standard",
      name: "Standard-Bewertungsraster",
      categories: DEFAULT_ASSESSMENT_CATEGORIES.map(cat => ({
        ...cat,
        weight: 1
      }))
    };
  }

  try {
    const doc = await db.collection(ASSESSMENT_TEMPLATES.collectionName).doc(templateId).get();
    
    if (doc.exists) {
      return {
        id: doc.id,
        ...doc.data()
      };
    } else {
      // Wenn nicht gefunden, verwende das Standard-Raster
      return {
        id: "standard",
        name: "Standard-Bewertungsraster",
        categories: DEFAULT_ASSESSMENT_CATEGORIES.map(cat => ({
          ...cat,
          weight: 1
        }))
      };
    }
  } catch (error) {
    console.error("Fehler beim Laden des Bewertungsrasters:", error);
    
    // Fallback: Standard-Raster zurückgeben
    return {
      id: "standard",
      name: "Standard-Bewertungsraster",
      categories: DEFAULT_ASSESSMENT_CATEGORIES.map(cat => ({
        ...cat,
        weight: 1
      }))
    };
  }
}

/**
 * Berechnet die Durchschnittsnote basierend auf einem Bewertungsraster und den Bewertungen
 */
export function calculateAverageGrade(template, assessment) {
  if (!template || !assessment) return null;
  
  let sum = 0;
  let weightSum = 0;
  
  template.categories.forEach(category => {
    const value = assessment[category.id];
    const weight = category.weight || 1;
    
    if (value && value > 0) {
      sum += value * weight;
      weightSum += weight;
    }
  });
  
  if (weightSum === 0) return null;
  
  return (sum / weightSum).toFixed(1);
}
