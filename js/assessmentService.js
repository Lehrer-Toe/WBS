// js/assessmentService.js

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
 * Lädt alle Bewertungsraster aus Firebase
 */
export async function loadAssessmentTemplates() {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    // Fallback auf Standard-Raster
    assessmentTemplates = [{
      id: "standard",
      name: "Standard-Bewertungsraster",
      isDefault: true,
      created_by: "SYSTEM",
      categories: DEFAULT_ASSESSMENT_CATEGORIES
    }];
    return true;
  }

  try {
    console.log("Lade Bewertungsraster...");
    const snapshot = await db.collection(ASSESSMENT_TEMPLATES.collectionName).get();
    
    if (snapshot.empty) {
      console.log("Keine Bewertungsraster gefunden, erstelle Standard-Raster");
      
      // Erstelle Standard-Raster
      await db.collection(ASSESSMENT_TEMPLATES.collectionName).doc("standard").set({
        name: "Standard-Bewertungsraster",
        isDefault: true,
        created_by: "SYSTEM",
        created_at: firebase.firestore.FieldValue.serverTimestamp(),
        updated_at: firebase.firestore.FieldValue.serverTimestamp(),
        categories: DEFAULT_ASSESSMENT_CATEGORIES.map(cat => ({
          id: cat.id,
          name: cat.name,
          weight: 1
        }))
      });
      
      assessmentTemplates = [{
        id: "standard",
        name: "Standard-Bewertungsraster",
        isDefault: true,
        created_by: "SYSTEM",
        categories: DEFAULT_ASSESSMENT_CATEGORIES.map(cat => ({
          id: cat.id,
          name: cat.name,
          weight: 1
        }))
      }];
    } else {
      assessmentTemplates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log(`${assessmentTemplates.length} Bewertungsraster geladen`);
    }
    
    return true;
  } catch (error) {
    console.error("Fehler beim Laden der Bewertungsraster:", error);
    
    // Fallback auf Standard-Raster
    assessmentTemplates = [{
      id: "standard",
      name: "Standard-Bewertungsraster",
      isDefault: true,
      created_by: "SYSTEM",
      categories: DEFAULT_ASSESSMENT_CATEGORIES
    }];
    
    return false;
  }
}

/**
 * Erstellt ein neues Bewertungsraster
 */
export async function createAssessmentTemplate(templateData) {
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

  try {
    // ID generieren oder verwenden
    const templateId = templateData.id || Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    
    // Neues Raster erstellen
    await db.collection(ASSESSMENT_TEMPLATES.collectionName).doc(templateId).set({
      name: templateData.name,
      description: templateData.description || "",
      isDefault: false,
      created_by: templateData.created_by,
      created_at: firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: firebase.firestore.FieldValue.serverTimestamp(),
      categories: templateData.categories.map(cat => ({
        id: cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        name: cat.name,
        weight: cat.weight || 1
      }))
    });
    
    // ID hinzufügen und Template zurückgeben
    const newTemplate = {
      id: templateId,
      ...templateData,
      isDefault: false,
      categories: templateData.categories.map(cat => ({
        id: cat.id || cat.name.toLowerCase().replace(/[^a-z0-9]/g, "_"),
        name: cat.name,
        weight: cat.weight || 1
      }))
    };
    
    // Zur globalen Liste hinzufügen
    assessmentTemplates.push(newTemplate);
    
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
export async function updateAssessmentTemplate(templateId, templateData) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  // Standard-Raster darf nicht verändert werden
  if (templateId === "standard") {
    throw new Error("Das Standard-Bewertungsraster kann nicht verändert werden");
  }

  try {
    const templateRef = db.collection(ASSESSMENT_TEMPLATES.collectionName).doc(templateId);
    const doc = await templateRef.get();
    
    if (!doc.exists) {
      throw new Error("Bewertungsraster nicht gefunden");
    }
    
    // Entferne ID und andere Felder, die nicht aktualisiert werden sollen
    const { id, created_at, created_by, isDefault, ...updateData } = templateData;
    
    // Aktualisiere das Raster
    await templateRef.update({
      ...updateData,
      updated_at: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Aktualisiere die lokale Kopie
    const index = assessmentTemplates.findIndex(t => t.id === templateId);
    if (index !== -1) {
      assessmentTemplates[index] = {
        ...assessmentTemplates[index],
        ...updateData
      };
    }
    
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
export async function deleteAssessmentTemplate(templateId) {
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return false;
  }

  // Standard-Raster darf nicht gelöscht werden
  if (templateId === "standard") {
    throw new Error("Das Standard-Bewertungsraster kann nicht gelöscht werden");
  }

  try {
    // Lösche das Raster
    await db.collection(ASSESSMENT_TEMPLATES.collectionName).doc(templateId).delete();
    
    // Entferne aus der lokalen Liste
    assessmentTemplates = assessmentTemplates.filter(template => template.id !== templateId);
    
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
  // Suche zuerst in der lokalen Liste
  let template = assessmentTemplates.find(t => t.id === templateId);
  
  if (template) {
    return template;
  }
  
  // Wenn nicht in der lokalen Liste, lade aus Firebase
  if (!db) {
    console.error("Firestore ist nicht initialisiert!");
    return null;
  }

  try {
    const doc = await db.collection(ASSESSMENT_TEMPLATES.collectionName).doc(templateId).get();
    
    if (doc.exists) {
      template = {
        id: doc.id,
        ...doc.data()
      };
      
      // Zur lokalen Liste hinzufügen
      assessmentTemplates.push(template);
      
      return template;
    } else {
      // Wenn nicht gefunden, verwende das Standard-Raster
      return assessmentTemplates.find(t => t.id === "standard") || null;
    }
  } catch (error) {
    console.error("Fehler beim Laden des Bewertungsrasters:", error);
    return null;
  }
}

/**
 * Gibt alle Bewertungsraster zurück, die von einem Lehrer erstellt wurden
 */
export function getTemplatesForTeacher(teacherCode) {
  return assessmentTemplates.filter(template => 
    template.created_by === teacherCode || template.isDefault
  );
}

/**
 * Berechnet die Durchschnittsnote basierend auf einem Bewertungsraster und den Bewertungen
 */
export function calculateAverageGrade(templateId, assessment) {
  if (!assessment) return null;
  
  // Finde das Template
  const template = assessmentTemplates.find(t => t.id === templateId);
  if (!template) return null;
  
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
