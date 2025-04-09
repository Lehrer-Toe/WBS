// js/constants.js

// Neue Bewertungskategorien
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

// Supabase-Verbindungsdaten
export const SUPABASE_URL = "https://mljhyhqlvllhgrzemsoh.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  + "L5H5e6Bx6yWM2ScHWIGJAL3JUDrFN4aJHUpjVxUDygA"; 
  // gekürzt dargestellt

// Standard-Lehrerdaten
export const DEFAULT_TEACHERS = [
  { name: "Kretz", code: "KRE", password: "Luna" },
  { name: "Riffel", code: "RIF", password: "Luna" },
  { name: "Töllner", code: "TOE", password: "Luna" }
];
