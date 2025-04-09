// js/constants.js

/**
 * Bewertungskategorien für alle Prüflinge
 */
export const ASSESSMENT_CATEGORIES = [
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
 * Supabase Verbindungsdaten
 */
export const SUPABASE_URL = "https://mljhyhqlvllhgrzemsoh.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1samh5aHFsdmxsaGdyemVtc29oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM3NjYwNjEsImV4cCI6MjA1OTM0MjA2MX0.L5H5e6Bx6yWM2ScHWIGJAL3JUDrFN4aJHUpjVxUDygA";

/**
 * Standard-Benutzer für die Anmeldung
 */
export const DEFAULT_TEACHERS = [
  { name: "Kretz", code: "KRE", password: "Luna" },
  { name: "Riffel", code: "RIF", password: "Luna" },
  { name: "Töllner", code: "TOE", password: "Luna" }
];
