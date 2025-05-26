// js/config.js - Environment configuration utility

/**
 * Environment Configuration Utility
 * 
 * Diese Datei stellt Konfigurationswerte für die Anwendung bereit
 * und unterstützt verschiedene Deployment-Umgebungen.
 */

// Standard-Konfiguration (für Entwicklung)
const defaultConfig = {
  appName: "Zeig, was du kannst!",
  version: "2.0",
  environment: "development",
  maxThemesPerTeacher: 10,
  maxStudentsPerTheme: 4,
  maxTemplatesPerTeacher: 5,
  debugMode: false,
  apiTimeoutMs: 10000,
  databaseProvider: "firebase", // Alternativ: "supabase"
  // Keine sensiblen Daten hier speichern
};

// Produktions-Überschreibungen
const productionOverrides = {
  environment: "production",
  debugMode: false,
};

// Netlify-Umgebungsvariablen abrufen (falls vorhanden)
function getNetlifyEnv() {
  if (typeof window !== 'undefined' && window.ENV) {
    return window.ENV;
  }
  return {};
}

// Vite-Umgebungsvariablen abrufen (falls vorhanden)
function getViteEnv() {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env;
  }
  return {};
}

/**
 * Erstellt die Anwendungskonfiguration basierend auf der aktuellen Umgebung
 */
function createConfig() {
  // Basis-Konfiguration
  let config = { ...defaultConfig };
  
  // Umgebung erkennen
  const isProduction = 
    window.location.hostname !== 'localhost' && 
    window.location.hostname !== '127.0.0.1';
  
  // Produktions-Überschreibungen anwenden
  if (isProduction) {
    config = { ...config, ...productionOverrides };
  }
  
  // Umgebungsvariablen von Netlify/Vite anwenden
  const envVars = { ...getViteEnv(), ...getNetlifyEnv() };
  
  // Überschreibe Konfiguration mit Umgebungsvariablen
  Object.entries(envVars).forEach(([key, value]) => {
    // Entferne VITE_ Präfix für übersichtlichere Konfigurationsnamen
    const configKey = key.replace(/^VITE_/, '');
    
    // Konvertiere Werte in korrekten Typ
    if (value === 'true') value = true;
    if (value === 'false') value = false;
    if (!isNaN(Number(value)) && value.trim() !== '') value = Number(value);
    
    config[configKey] = value;
  });
  
  // Debug-Ausgabe (nur in Entwicklung)
  if (config.debugMode) {
    console.log('App-Konfiguration:', config);
  }
  
  return config;
}

// Erstelle und exportiere die Konfiguration
export const CONFIG = createConfig();

/**
 * Ruft einen Konfigurationswert ab
 * @param {string} key - Der Konfigurationsschlüssel
 * @param {any} defaultValue - Standardwert, falls der Schlüssel nicht existiert
 * @returns {any} Der Konfigurationswert
 */
export function getConfig(key, defaultValue = null) {
  return CONFIG[key] !== undefined ? CONFIG[key] : defaultValue;
}

/**
 * Prüft, ob die App in Produktionsumgebung läuft
 * @returns {boolean} Ist Produktionsumgebung
 */
export function isProduction() {
  return CONFIG.environment === 'production';
}

/**
 * Prüft, ob die App im Debug-Modus läuft
 * @returns {boolean} Ist Debug-Modus aktiv
 */
export function isDebugMode() {
  return CONFIG.debugMode === true;
}
