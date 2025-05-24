// js/constants.js

/**
 * Standard-Bewertungskriterien für alle Themen und Schüler
 * Diese können von Lehrern individuell angepasst werden
 */
export const DEFAULT_ASSESSMENT_CATEGORIES = [
  { id: "presentation", name: "Präsentation" },
  { id: "content", name: "Inhalt" },
  { id: "language", name: "Sprache" },
  { id: "impression", name: "Eindruck" },
  { id: "examination", name: "Prüfung" },
  { id: "reflection", name: "Reflexion" },
  { id: "expertise", name: "Fachwissen" },
  { id: "documentation", name: "Dokumentation" }
];

/**
 * Standard-Benutzer für die Anmeldung
 * Diese werden durch die dynamisch geladenen Lehrer ergänzt/ersetzt
 */
export const DEFAULT_TEACHERS = [
  { name: "Kretz", code: "KRE", password: "Luna", canCreateThemes: true },
  { name: "Riffel", code: "RIF", password: "Luna", canCreateThemes: false },
  { name: "Töllner", code: "TOE", password: "Luna", canCreateThemes: false }
];

/**
 * Admin-Konfiguration
 */
export const ADMIN_CONFIG = {
  username: "admin",
  password: "admin",
  collectionName: "wbs_teachers"
};

/**
 * System-Einstellungen
 */
export const SYSTEM_SETTINGS = {
  collectionName: "wbs_settings",
  documentName: "system_settings"
};

/**
 * Theme-/Gruppendaten
 */
export const THEMES_CONFIG = {
  collectionName: "wbs_themes",
  maxStudentsPerTheme: 4
};

/**
 * Bewertungsraster
 */
export const ASSESSMENT_TEMPLATES = {
  collectionName: "wbs_assessment_templates"
};

/**
 * Status für Schüler-Bewertungen
 */
export const STUDENT_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed"
};

/**
 * Bewertungsstatus für Themen
 */
export const THEME_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  OVERDUE: "overdue"
};

/**
 * Lehrer-Rechte
 */
export const TEACHER_PERMISSIONS = {
  CREATE_THEMES: "canCreateThemes",
  MANAGE_TEMPLATES: "canManageTemplates"
};

/**
 * Standard Systemeinstellungen
 */
export const DEFAULT_SYSTEM_SETTINGS = {
  currentSchoolYear: new Date().getFullYear() + "/" + (new Date().getFullYear() + 1),
  defaultAssessmentTemplate: "standard"
};
