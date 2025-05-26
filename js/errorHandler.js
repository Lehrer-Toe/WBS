// js/errorHandler.js - Error handling and reporting utility

/**
 * Error Handling Utility
 * 
 * Diese Datei stellt Funktionen für die Fehlerbehandlung und -protokollierung bereit,
 * um die Fehlerbehebung und Stabilität der Anwendung zu verbessern.
 */

import { isProduction, isDebugMode } from './config.js';
import { saveToStorage, loadFromStorage } from './storageUtil.js';

// Konstanten
const MAX_ERROR_LOG_SIZE = 50; // Maximale Anzahl der gespeicherten Fehler
const ERROR_LOG_KEY = 'error_log';

// In-Memory-Fehlerpuffer für die aktuelle Sitzung
let errorBuffer = [];

/**
 * Erfasst und protokolliert einen Fehler
 * @param {Error|string} error - Der aufgetretene Fehler oder eine Fehlermeldung
 * @param {string} context - Kontext, in dem der Fehler aufgetreten ist
 * @param {boolean} isFatal - Ist der Fehler kritisch für die Anwendung
 */
export function logError(error, context = 'unknown', isFatal = false) {
  // Fehlerdetails extrahieren
  const errorDetails = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : null,
    context,
    timestamp: new Date().toISOString(),
    isFatal,
    url: window.location.href,
    userAgent: navigator.userAgent
  };
  
  // In Memory-Puffer speichern
  errorBuffer.push(errorDetails);
  
  // Auf Entwicklungsumgebung immer protokollieren
  if (!isProduction() || isDebugMode()) {
    console.error(`[${context}] ${errorDetails.message}`, error);
  }
  
  // In Local Storage protokollieren
  const errorLog = loadFromStorage(ERROR_LOG_KEY, []);
  errorLog.unshift(errorDetails);
  
  // Log-Größe begrenzen
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.length = MAX_ERROR_LOG_SIZE;
  }
  
  saveToStorage(ERROR_LOG_KEY, errorLog);
  
  // Bei kritischen Fehlern Event auslösen
  if (isFatal) {
    document.dispatchEvent(new CustomEvent('fatalError', { detail: errorDetails }));
  }
  
  return errorDetails;
}

/**
 * Fehlerbehandlung für asynchrone Funktionen
 * @param {Function} fn - Die asynchrone Funktion
 * @param {string} context - Kontext für die Fehlerprotokollierung
 * @returns {Function} Funktion mit Fehlerbehandlung
 */
export function withErrorHandling(fn, context = 'unknown') {
  return async function(...args) {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error, context);
      throw error; // Fehler weiterleiten für weitere Behandlung
    }
  };
}

/**
 * Ruft das Fehlerprotokoll ab
 * @returns {Array} Fehlerprotokoll
 */
export function getErrorLog() {
  return loadFromStorage(ERROR_LOG_KEY, []);
}

/**
 * Löscht das Fehlerprotokoll
 */
export function clearErrorLog() {
  saveToStorage(ERROR_LOG_KEY, []);
  errorBuffer = [];
}

/**
 * Exportiert das Fehlerprotokoll als JSON-Datei
 */
export function exportErrorLog() {
  const errorLog = getErrorLog();
  const errorData = JSON.stringify(errorLog, null, 2);
  const blob = new Blob([errorData], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `error_log_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Globaler unhandled rejection Handler
 */
window.addEventListener('unhandledrejection', (event) => {
  logError(event.reason, 'unhandledRejection', true);
});

/**
 * Globaler error Handler
 */
window.addEventListener('error', (event) => {
  logError(event.error || event.message, 'globalError', true);
});

/**
 * Registriert einen benutzerdefinierten Fehlerbehandler für fatalError-Events
 * @param {Function} handler - Die Behandlungsfunktion, die das Fehlerobjekt erhält
 */
export function registerFatalErrorHandler(handler) {
  document.addEventListener('fatalError', (event) => {
    handler(event.detail);
  });
}

/**
 * Erstellt eine benutzerfreundliche Fehlermeldung
 * @param {Error|string} error - Der Fehler
 * @param {string} userMessage - Optionale benutzerfreundliche Meldung
 * @returns {string} Benutzerfreundliche Fehlermeldung
 */
export function createUserFriendlyErrorMessage(error, userMessage = null) {
  // Wenn eine benutzerdefinierte Meldung bereitgestellt wurde, verwende diese
  if (userMessage) return userMessage;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // Behandle bekannte Fehlertypen
  if (errorMessage.includes('permission-denied')) {
    return 'Sie haben keine Berechtigung für diese Aktion.';
  }
  
  if (errorMessage.includes('network') || errorMessage.includes('offline') || 
      errorMessage.includes('internet') || errorMessage.includes('connection')) {
    return 'Es besteht ein Netzwerkproblem. Bitte überprüfen Sie Ihre Internetverbindung.';
  }
  
  if (errorMessage.includes('timeout') || errorMessage.includes('timed out')) {
    return 'Die Anfrage hat zu lange gedauert. Bitte versuchen Sie es später erneut.';
  }
  
  if (errorMessage.includes('not-found') || errorMessage.includes('404')) {
    return 'Die angeforderte Ressource wurde nicht gefunden.';
  }
  
  if (errorMessage.includes('auth') || errorMessage.includes('login') || 
      errorMessage.includes('permission')) {
    return 'Es ist ein Authentifizierungsproblem aufgetreten. Bitte melden Sie sich erneut an.';
  }
  
  // Generische Meldung für unbekannte Fehler
  return 'Es ist ein Fehler aufgetreten. Bitte versuchen Sie es später erneut.';
}
