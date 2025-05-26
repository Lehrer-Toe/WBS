// js/storageUtil.js - Utility for handling offline storage

/**
 * Offline Storage Utility
 * 
 * Diese Datei stellt Funktionen für die lokale Speicherung von Daten bereit,
 * um die Offline-Funktionalität der Anwendung zu unterstützen.
 */

// Namespace für den Local Storage
const STORAGE_PREFIX = 'wbs_app_';

/**
 * Speichert Daten im Local Storage
 * @param {string} key - Schlüssel
 * @param {any} data - Zu speichernde Daten (werden automatisch in JSON konvertiert)
 * @returns {boolean} Erfolg
 */
export function saveToStorage(key, data) {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    const serializedData = JSON.stringify(data);
    localStorage.setItem(prefixedKey, serializedData);
    return true;
  } catch (error) {
    console.error(`Fehler beim Speichern von "${key}" im Local Storage:`, error);
    return false;
  }
}

/**
 * Lädt Daten aus dem Local Storage
 * @param {string} key - Schlüssel
 * @param {any} defaultValue - Standardwert falls kein Eintrag gefunden
 * @returns {any} Die geladenen Daten oder der Standardwert
 */
export function loadFromStorage(key, defaultValue = null) {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    const serializedData = localStorage.getItem(prefixedKey);
    
    if (serializedData === null) {
      return defaultValue;
    }
    
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Fehler beim Laden von "${key}" aus dem Local Storage:`, error);
    return defaultValue;
  }
}

/**
 * Löscht Daten aus dem Local Storage
 * @param {string} key - Schlüssel
 * @returns {boolean} Erfolg
 */
export function removeFromStorage(key) {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    localStorage.removeItem(prefixedKey);
    return true;
  } catch (error) {
    console.error(`Fehler beim Löschen von "${key}" aus dem Local Storage:`, error);
    return false;
  }
}

/**
 * Prüft, ob ein Schlüssel im Local Storage existiert
 * @param {string} key - Schlüssel
 * @returns {boolean} Existiert der Schlüssel
 */
export function existsInStorage(key) {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    return localStorage.getItem(prefixedKey) !== null;
  } catch (error) {
    console.error(`Fehler beim Prüfen von "${key}" im Local Storage:`, error);
    return false;
  }
}

/**
 * Speichert Daten temporär im Session Storage
 * @param {string} key - Schlüssel
 * @param {any} data - Zu speichernde Daten
 * @returns {boolean} Erfolg
 */
export function saveToSessionStorage(key, data) {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    const serializedData = JSON.stringify(data);
    sessionStorage.setItem(prefixedKey, serializedData);
    return true;
  } catch (error) {
    console.error(`Fehler beim Speichern von "${key}" im Session Storage:`, error);
    return false;
  }
}

/**
 * Lädt Daten aus dem Session Storage
 * @param {string} key - Schlüssel
 * @param {any} defaultValue - Standardwert falls kein Eintrag gefunden
 * @returns {any} Die geladenen Daten oder der Standardwert
 */
export function loadFromSessionStorage(key, defaultValue = null) {
  try {
    const prefixedKey = STORAGE_PREFIX + key;
    const serializedData = sessionStorage.getItem(prefixedKey);
    
    if (serializedData === null) {
      return defaultValue;
    }
    
    return JSON.parse(serializedData);
  } catch (error) {
    console.error(`Fehler beim Laden von "${key}" aus dem Session Storage:`, error);
    return defaultValue;
  }
}

/**
 * Löscht alle Daten der Anwendung aus dem Local Storage
 * @returns {boolean} Erfolg
 */
export function clearAllAppData() {
  try {
    const keysToRemove = [];
    
    // Alle Anwendungs-Keys sammeln
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(STORAGE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    
    // Keys löschen
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`${keysToRemove.length} Einträge aus dem Local Storage gelöscht`);
    return true;
  } catch (error) {
    console.error("Fehler beim Löschen aller App-Daten:", error);
    return false;
  }
}

/**
 * Speichert die letzte Online-Zeit
 */
export function updateLastOnlineTime() {
  try {
    localStorage.setItem(STORAGE_PREFIX + 'last_online', new Date().toISOString());
  } catch (error) {
    console.error("Fehler beim Speichern der letzten Online-Zeit:", error);
  }
}

/**
 * Ruft die letzte Online-Zeit ab
 * @returns {Date|null} Letzte Online-Zeit oder null
 */
export function getLastOnlineTime() {
  try {
    const timestamp = localStorage.getItem(STORAGE_PREFIX + 'last_online');
    return timestamp ? new Date(timestamp) : null;
  } catch (error) {
    console.error("Fehler beim Abrufen der letzten Online-Zeit:", error);
    return null;
  }
}

/**
 * Prüft, ob Local Storage verfügbar ist
 * @returns {boolean} Ist Local Storage verfügbar
 */
export function isStorageAvailable() {
  try {
    const testKey = STORAGE_PREFIX + 'test';
    localStorage.setItem(testKey, 'test');
    const result = localStorage.getItem(testKey) === 'test';
    localStorage.removeItem(testKey);
    return result;
  } catch (error) {
    return false;
  }
}

// Event-Listener für Online/Offline-Status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Anwendung ist wieder online');
    updateLastOnlineTime();
    // Event auslösen, dass die Anwendung wieder online ist
    document.dispatchEvent(new Event('appOnline'));
  });
  
  window.addEventListener('offline', () => {
    console.log('Anwendung ist offline');
    // Event auslösen, dass die Anwendung offline ist
    document.dispatchEvent(new Event('appOffline'));
  });
  
  // Speichere initial die Online-Zeit
  if (navigator.onLine) {
    updateLastOnlineTime();
  }
}
