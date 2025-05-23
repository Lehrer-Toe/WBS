// js/constants.js

/**
 * Standard-Bewertungskategorien (können überschrieben werden)
 * Diese werden als Fallback verwendet, wenn keine eigenen Kategorien definiert sind
 */
export const DEFAULT_ASSESSMENT_CATEGORIES = [
  { id: "presentation", name: "Präsentation", weight: 1 },
  { id: "content", name: "Inhalt", weight: 1 },
  { id: "language", name: "Sprache", weight: 1 },
  { id: "impression", name: "Eindruck", weight: 1 },
  { id: "examination", name: "Prüfung", weight: 1 },
  { id: "reflection", name: "Reflexion", weight: 1 },
  { id: "expertise", name: "Fachwissen", weight: 1 },
  { id: "documentation", name: "Dokumentation", weight: 1 }
];

/**
 * Standard-Bewertungsraster-Templates
 */
export const DEFAULT_ASSESSMENT_TEMPLATES = [
  {
    id: "wbs_standard",
    name: "WBS Standard",
    description: "Standard-Bewertungskriterien für WBS-Prüfungen",
    categories: DEFAULT_ASSESSMENT_CATEGORIES,
    isDefault: true,
    createdBy: "system",
    createdAt: new Date().toISOString()
  },
  {
    id: "presentation_focus",
    name: "Präsentations-Fokus",
    description: "Bewertung mit Schwerpunkt auf Präsentationsfähigkeiten",
    categories: [
      { id: "presentation_skill", name: "Präsentationsfähigkeit", weight: 2 },
      { id: "content_structure", name: "Inhaltsstruktur", weight: 1 },
      { id: "visual_aids", name: "Visuelle Hilfsmittel", weight: 1 },
      { id: "audience_engagement", name: "Publikumseinbindung", weight: 1 },
      { id: "time_management", name: "Zeitmanagement", weight: 1 }
    ],
    isDefault: false,
    createdBy: "system",
    createdAt: new Date().toISOString()
  }
];

/**
 * Standard-Benutzer für die Anmeldung
 * Diese werden durch die dynamisch geladenen Lehrer ergänzt/ersetzt
 */
export const DEFAULT_TEACHERS = [
  { name: "Kretz", code: "KRE", password: "Luna" },
  { name: "Riffel", code: "RIF", password: "Luna" },
  { name: "Töllner", code: "TOE", password: "Luna" }
];

/**
 * Admin-Konfiguration
 */
export const ADMIN_CONFIG = {
  username: "admin",
  password: "WBS2024Admin!",
  collectionName: "wbs_teachers"
};

/**
 * Anwendungs-Konfiguration
 */
export const APP_CONFIG = {
  name: "Zeig, was du kannst",
  version: "2.0",
  description: "Bewertungssystem für Schülerleistungen"
};
