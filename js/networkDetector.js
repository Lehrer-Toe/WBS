// js/networkDetector.js - Network status detector and connectivity monitoring

/**
 * Network Status Detector
 * 
 * Diese Datei stellt Funktionen für die Überwachung der Netzwerkverbindung bereit,
 * um eine bessere Offline-Unterstützung zu ermöglichen.
 */

import { updateLastOnlineTime } from './storageUtil.js';
import { showNotification } from './uiService.js';

// Aktueller Netzwerkstatus
let isOnline = navigator.onLine;
let connectionType = null;
let isSlowConnection = false;
let lastPingTime = null;
let connectionQuality = 'unknown';

// Pinging-Intervall in Millisekunden
const PING_INTERVAL = 30000; // 30 Sekunden

/**
 * Initialisiert den Netzwerkdetektor
 */
export function initNetworkDetector() {
  // Event-Listener für Online/Offline-Status
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
  
  // Aktuelle Verbindungsqualität ermitteln
  checkConnectionType();
  
  // Regelmäßige Verbindungsprüfung starten
  startConnectionMonitoring();
  
  // Sofortige Verbindungsprüfung
  checkServerConnection();
  
  // Netzwerk-Informations-API nutzen, falls verfügbar
  if ('connection' in navigator) {
    connectionType = navigator.connection.effectiveType;
    isSlowConnection = ['slow-2g', '2g', '3g'].includes(connectionType);
    
    navigator.connection.addEventListener('change', () => {
      const oldConnectionType = connectionType;
      connectionType = navigator.connection.effectiveType;
      isSlowConnection = ['slow-2g', '2g', '3g'].includes(connectionType);
      
      // Benachrichtigung bei erheblicher Änderung der Verbindungsqualität
      if (shouldNotifyConnectionChange(oldConnectionType, connectionType)) {
        showConnectionChangeNotification(oldConnectionType, connectionType);
      }
      
      // Event auslösen
      document.dispatchEvent(new CustomEvent('connectionChange', {
        detail: { type: connectionType, isSlowConnection }
      }));
    });
  }
  
  return {
    isOnline: () => isOnline,
    getConnectionType: () => connectionType,
    isSlowConnection: () => isSlowConnection,
    getConnectionQuality: () => connectionQuality
  };
}

/**
 * Handler für Online-Ereignis
 */
function handleOnline() {
  const wasOffline = !isOnline;
  isOnline = true;
  
  // Zeit der letzten Online-Verbindung aktualisieren
  updateLastOnlineTime();
  
  // Verbindung zum Server überprüfen
  checkServerConnection();
  
  // Benachrichtigung nur anzeigen, wenn zuvor offline
  if (wasOffline) {
    showNotification('Verbindung wiederhergestellt. Synchronisiere Daten...', 'success');
    
    // Event auslösen
    document.dispatchEvent(new Event('appOnline'));
  }
}

/**
 * Handler für Offline-Ereignis
 */
function handleOffline() {
  isOnline = false;
  connectionQuality = 'offline';
  
  showNotification('Keine Internetverbindung. Die App arbeitet jetzt offline.', 'warning');
  
  // Event auslösen
  document.dispatchEvent(new Event('appOffline'));
}

/**
 * Startet die regelmäßige Verbindungsüberwachung
 */
function startConnectionMonitoring() {
  setInterval(() => {
    if (navigator.onLine) {
      checkServerConnection();
    }
  }, PING_INTERVAL);
}

/**
 * Prüft die Serververbindung durch Ping
 */
async function checkServerConnection() {
  if (!navigator.onLine) return;
  
  const startTime = Date.now();
  
  try {
    // Ping-URL mit Zufallsparameter, um Cache zu umgehen
    const pingUrl = `/ping?t=${Date.now()}`;
    
    const response = await fetch(pingUrl, {
      method: 'HEAD',
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache' }
    });
    
    if (response.ok) {
      const endTime = Date.now();
      const pingTime = endTime - startTime;
      lastPingTime = pingTime;
      
      // Verbindungsqualität bestimmen
      determineConnectionQuality(pingTime);
      
      // Event auslösen
      document.dispatchEvent(new CustomEvent('serverPing', {
        detail: { pingTime, connectionQuality }
      }));
    } else {
      connectionQuality = 'poor';
    }
  } catch (error) {
    console.warn('Server-Ping fehlgeschlagen:', error);
    
    // Die Offline-API meldet möglicherweise noch "online", obwohl keine echte Verbindung besteht
    if (isOnline) {
      connectionQuality = 'poor';
      document.dispatchEvent(new CustomEvent('serverPingFailed', {
        detail: { error }
      }));
    }
  }
}

/**
 * Bestimmt die Verbindungsqualität basierend auf der Ping-Zeit
 * @param {number} pingTime - Ping-Zeit in Millisekunden
 */
function determineConnectionQuality(pingTime) {
  if (pingTime < 100) {
    connectionQuality = 'excellent';
  } else if (pingTime < 300) {
    connectionQuality = 'good';
  } else if (pingTime < 600) {
    connectionQuality = 'fair';
  } else {
    connectionQuality = 'poor';
  }
}

/**
 * Ermittelt die Art der Verbindung
 */
function checkConnectionType() {
  if ('connection' in navigator) {
    connectionType = navigator.connection.effectiveType;
    isSlowConnection = ['slow-2g', '2g', '3g'].includes(connectionType);
  } else {
    // Fallback-Erkennung: Performance-API nutzen
    connectionType = 'unknown';
    
    // Performance-API nutzen, falls verfügbar
    if ('performance' in window) {
      const navEntry = performance.getEntriesByType('navigation')[0];
      if (navEntry) {
        const loadTime = navEntry.duration;
        
        if (loadTime < 1000) {
          connectionType = '4g';
          isSlowConnection = false;
        } else if (loadTime < 3000) {
          connectionType = '3g';
          isSlowConnection = true;
        } else {
          connectionType = '2g';
          isSlowConnection = true;
        }
      }
    }
  }
}

/**
 * Prüft, ob eine Benachrichtigung bei Verbindungsänderung angezeigt werden sollte
 * @param {string} oldType - Alter Verbindungstyp
 * @param {string} newType - Neuer Verbindungstyp
 * @returns {boolean} Soll eine Benachrichtigung angezeigt werden
 */
function shouldNotifyConnectionChange(oldType, newType) {
  // Nur bei signifikanten Änderungen benachrichtigen
  if (oldType === newType) return false;
  
  const connectionRanking = {
    'slow-2g': 1,
    '2g': 2,
    '3g': 3,
    '4g': 4
  };
  
  const oldRank = connectionRanking[oldType] || 0;
  const newRank = connectionRanking[newType] || 0;
  
  // Nur bei Änderung um 2 oder mehr Stufen benachrichtigen
  return Math.abs(newRank - oldRank) >= 2;
}

/**
 * Zeigt eine Benachrichtigung bei Verbindungsänderung an
 * @param {string} oldType - Alter Verbindungstyp
 * @param {string} newType - Neuer Verbindungstyp
 */
function showConnectionChangeNotification(oldType, newType) {
  const connectionRanking = {
    'slow-2g': 1,
    '2g': 2,
    '3g': 3,
    '4g': 4
  };
  
  const oldRank = connectionRanking[oldType] || 0;
  const newRank = connectionRanking[newType] || 0;
  
  if (newRank > oldRank) {
    showNotification(`Verbindung verbessert auf ${newType}`, 'info');
  } else {
    showNotification(`Verbindung verschlechtert auf ${newType}. Einige Funktionen könnten eingeschränkt sein.`, 'warning');
  }
}

/**
 * Fügt ein Verbindungsstatusindikator zur UI hinzu
 * @param {HTMLElement} container - Container-Element für den Indikator
 */
export function addConnectionStatusIndicator(container) {
  const indicator = document.createElement('div');
  indicator.className = 'connection-indicator';
  indicator.innerHTML = `
    <span class="connection-dot ${isOnline ? 'online' : 'offline'}"></span>
    <span class="connection-text">${isOnline ? 'Online' : 'Offline'}</span>
  `;
  
  container.appendChild(indicator);
  
  // Status aktualisieren, wenn sich die Verbindung ändert
  window.addEventListener('online', () => {
    indicator.innerHTML = `
      <span class="connection-dot online"></span>
      <span class="connection-text">Online</span>
    `;
  });
  
  window.addEventListener('offline', () => {
    indicator.innerHTML = `
      <span class="connection-dot offline"></span>
      <span class="connection-text">Offline</span>
    `;
  });
  
  // Bei Änderung der Verbindungsqualität aktualisieren
  document.addEventListener('serverPing', (event) => {
    const { connectionQuality } = event.detail;
    
    indicator.innerHTML = `
      <span class="connection-dot ${connectionQuality}"></span>
      <span class="connection-text">${connectionQuality}</span>
    `;
  });
  
  return indicator;
}

// Initialisiere den Netzwerkdetektor beim Import
export const networkStatus = initNetworkDetector();
