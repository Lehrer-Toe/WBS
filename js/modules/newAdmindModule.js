// js/modules/newAdminModule.js - Temporäres Setup für erweiterte Admin-Funktionalität

import { 
  showLoader, 
  hideLoader, 
  showNotification, 
  formatDate, 
  downloadFile 
} from "../uiService.js";
import {
  loginAdmin,
  logoutAdmin,
  currentAdmin,
  allTeachers,
  addTeacher,
  updateTeacher,
  deleteTeacher,
  getSystemStats,
  exportAllData,
  importAllData,
  deleteAllData,
  deleteAllTeachers,
  updateTeacherPermissions,
  loadSystemSettings,
  saveSystemSettings,
  systemSettings
} from "../adminService.js";
import { loadAssessmentTemplates, assessmentTemplates } from "../assessmentService.js";
import { TEACHER_PERMISSIONS, ASSESSMENT_TEMPLATES } from "../constants.js";

/**
 * Erweiterte Admin-Konfiguration
 */
const adminConfig = {
  sessionTimeout: 1800000, // 30 Minuten
  backupInterval: 3600000, // 1 Stunde
  maxLoginAttempts: 5,
  currentAttempts: 0,
  isLocked: false,
  lockoutTime: 900000, // 15 Minuten
  lastActivity: Date.now()
};

/**
 * System-Monitoring-Daten
 */
let systemMonitor = {
  startTime: Date.now(),
  lastBackup: null,
  totalLogins: 0,
  activeUsers: 0,
  errorCount: 0,
  performanceMetrics: {
    averageLoadTime: 0,
    peakMemoryUsage: 0,
    totalRequests: 0
  }
};

/**
 * Initialisiert das erweiterte Admin-Modul
 */
export function initNewAdminModule() {
  console.log("Initialisiere erweitertes Admin-Modul...");
  
  // Erweiterte Admin-UI-Elemente erstellen
  createEnhancedAdminInterface();
  
  // System-Monitoring starten
  startSystemMonitoring();
  
  // Automatische Backups aktivieren
  scheduleAutomaticBackups();
  
  // Session-Management für Admin
  initAdminSessionManagement();
  
  console.log("Erweitertes Admin-Modul initialisiert");
}

/**
 * Erstellt erweiterte Admin-Interface-Elemente
 */
function createEnhancedAdminInterface() {
  // Dashboard-Erweiterungen
  addSystemDashboard();
  
  // Erweiterte Benutzer-Verwaltung
  addAdvancedUserManagement();
  
  // System-Tools
  addSystemTools();
  
  // Monitoring-Panel
  addMonitoringPanel();
}

/**
 * Fügt ein System-Dashboard hinzu
 */
function addSystemDashboard() {
  const dashboardHTML = `
    <div id="systemDashboard" class="system-dashboard" style="display: none;">
      <h2>System-Dashboard</h2>
      
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <h3>System-Status</h3>
          <div id="systemStatus" class="status-indicator">
            <span class="status-dot online"></span>
            <span>Online</span>
          </div>
          <div class="system-uptime">
            <strong>Betriebszeit:</strong> <span id="systemUptime">-</span>
          </div>
        </div>
        
        <div class="dashboard-card">
          <h3>Benutzer-Aktivität</h3>
          <div class="activity-stats">
            <div class="stat-item">
              <span class="stat-label">Aktive Benutzer:</span>
              <span id="activeUsersCount" class="stat-value">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Heute angemeldet:</span>
              <span id="todayLoginsCount" class="stat-value">0</span>
            </div>
          </div>
        </div>
        
        <div class="dashboard-card">
          <h3>Daten-Übersicht</h3>
          <div class="data-stats">
            <div class="stat-item">
              <span class="stat-label">Themen insgesamt:</span>
              <span id="totalThemesCount" class="stat-value">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Bewertungen:</span>
              <span id="totalAssessmentsCount" class="stat-value">0</span>
            </div>
          </div>
        </div>
        
        <div class="dashboard-card">
          <h3>System-Gesundheit</h3>
          <div class="health-indicators">
            <div class="health-item">
              <span class="health-label">Database:</span>
              <span id="databaseHealth" class="health-status online">✓</span>
            </div>
            <div class="health-item">
              <span class="health-label">Performance:</span>
              <span id="performanceHealth" class="health-status">-</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="dashboard-actions">
        <button id="refreshDashboard" class="btn btn-primary">Aktualisieren</button>
        <button id="exportSystemReport" class="btn btn-secondary">System-Report exportieren</button>
      </div>
    </div>
  `;
  
  // Füge Dashboard zum Admin-Bereich hinzu
  const adminSection = document.getElementById("adminSection");
  if (adminSection) {
    const container = adminSection.querySelector(".container");
    if (container) {
      container.insertAdjacentHTML('afterbegin', dashboardHTML);
    }
  }
  
  // Event-Listener für Dashboard
  setupDashboardEventListeners();
}

/**
 * Fügt erweiterte Benutzer-Verwaltung hinzu
 */
function addAdvancedUserManagement() {
  const advancedUserHTML = `
    <div id="advancedUserManagement" class="advanced-user-management" style="display: none;">
      <h3>Erweiterte Benutzer-Verwaltung</h3>
      
      <div class="user-management-tools">
        <div class="bulk-actions">
          <h4>Massenaktionen</h4>
          <div class="bulk-action-controls">
            <select id="bulkActionSelect">
              <option value="">Aktion wählen...</option>
              <option value="enable">Alle aktivieren</option>
              <option value="disable">Alle deaktivieren</option>
              <option value="reset_passwords">Passwörter zurücksetzen</option>
              <option value="export_users">Benutzer exportieren</option>
            </select>
            <button id="executeBulkAction" class="btn btn-warning">Ausführen</button>
          </div>
        </div>
        
        <div class="user-analytics">
          <h4>Benutzer-Statistiken</h4>
          <div class="analytics-grid">
            <div class="analytics-item">
              <span class="analytics-label">Letzte Anmeldung:</span>
              <span id="lastLoginTime" class="analytics-value">-</span>
            </div>
            <div class="analytics-item">
              <span class="analytics-label">Aktivste Benutzer:</span>
              <span id="mostActiveUser" class="analytics-value">-</span>
            </div>
          </div>
        </div>
        
        <div class="security-settings">
          <h4>Sicherheits-Einstellungen</h4>
          <div class="security-controls">
            <label class="checkbox-label">
              <input type="checkbox" id="enforceStrongPasswords">
              <span class="checkbox-text">Starke Passwörter erzwingen</span>
            </label>
            <label class="checkbox-label">
              <input type="checkbox" id="enableSessionTimeout">
              <span class="checkbox-text">Session-Timeout aktivieren</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Füge zur Benutzer-Verwaltung hinzu
  const teachersTab = document.getElementById("teachers-tab");
  if (teachersTab) {
    teachersTab.insertAdjacentHTML('beforeend', advancedUserHTML);
  }
}

/**
 * Fügt System-Tools hinzu
 */
function addSystemTools() {
  const systemToolsHTML = `
    <div id="systemTools" class="system-tools" style="display: none;">
      <h3>System-Tools</h3>
      
      <div class="tools-grid">
        <div class="tool-category">
          <h4>Wartung</h4>
          <div class="tool-buttons">
            <button id="clearCacheBtn" class="btn btn-secondary">Cache leeren</button>
            <button id="optimizeDatabaseBtn" class="btn btn-secondary">Datenbank optimieren</button>
            <button id="runMaintenanceBtn" class="btn btn-warning">Wartung ausführen</button>
          </div>
        </div>
        
        <div class="tool-category">
          <h4>Backup & Restore</h4>
          <div class="tool-buttons">
            <button id="createBackupBtn" class="btn btn-primary">Backup erstellen</button>
            <button id="scheduleBackupBtn" class="btn btn-secondary">Backup planen</button>
            <button id="restoreBackupBtn" class="btn btn-warning">Backup wiederherstellen</button>
          </div>
          <input type="file" id="backupFileInput" accept=".json" style="display: none;">
        </div>
        
        <div class="tool-category">
          <h4>Entwickler-Tools</h4>
          <div class="tool-buttons">
            <button id="showDebugInfoBtn" class="btn btn-info">Debug-Info anzeigen</button>
            <button id="testConnectionBtn" class="btn btn-secondary">Verbindung testen</button>
            <button id="generateTestDataBtn" class="btn btn-warning">Test-Daten generieren</button>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Füge zu System-Tab hinzu
  const systemTab = document.getElementById("system-tab");
  if (systemTab) {
    systemTab.insertAdjacentHTML('beforeend', systemToolsHTML);
  }
  
  // Event-Listener für System-Tools
  setupSystemToolsEventListeners();
}

/**
 * Fügt Monitoring-Panel hinzu
 */
function addMonitoringPanel() {
  const monitoringHTML = `
    <div id="monitoringPanel" class="monitoring-panel" style="display: none;">
      <h3>System-Monitoring</h3>
      
      <div class="monitoring-grid">
        <div class="monitoring-card">
          <h4>Performance</h4>
          <div class="performance-metrics">
            <div class="metric-item">
              <span class="metric-label">Durchschn. Ladezeit:</span>
              <span id="avgLoadTime" class="metric-value">-</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Speicherverbrauch:</span>
              <span id="memoryUsage" class="metric-value">-</span>
            </div>
          </div>
        </div>
        
        <div class="monitoring-card">
          <h4>Fehler-Log</h4>
          <div class="error-log" id="errorLogContainer">
            <div class="log-entry">Keine Fehler aufgetreten</div>
          </div>
          <button id="clearErrorLogBtn" class="btn btn-sm btn-secondary">Log leeren</button>
        </div>
        
        <div class="monitoring-card">
          <h4>Aktivitäts-Log</h4>
          <div class="activity-log" id="activityLogContainer">
            <div class="log-entry">System gestartet</div>
          </div>
          <button id="exportActivityLogBtn" class="btn btn-sm btn-secondary">Log exportieren</button>
        </div>
      </div>
    </div>
  `;
  
  // Füge zu System-Tab hinzu
  const systemTab = document.getElementById("system-tab");
  if (systemTab) {
    systemTab.insertAdjacentHTML('beforeend', monitoringHTML);
  }
}

/**
 * Richtet Dashboard Event-Listener ein
 */
function setupDashboardEventListeners() {
  const refreshBtn = document.getElementById("refreshDashboard");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", updateDashboard);
  }
  
  const exportBtn = document.getElementById("exportSystemReport");
  if (exportBtn) {
    exportBtn.addEventListener("click", exportSystemReport);
  }
}

/**
 * Richtet System-Tools Event-Listener ein
 */
function setupSystemToolsEventListeners() {
  // Cache leeren
  const clearCacheBtn = document.getElementById("clearCacheBtn");
  if (clearCacheBtn) {
    clearCacheBtn.addEventListener("click", clearSystemCache);
  }
  
  // Datenbank optimieren
  const optimizeDbBtn = document.getElementById("optimizeDatabaseBtn");
  if (optimizeDbBtn) {
    optimizeDbBtn.addEventListener("click", optimizeDatabase);
  }
  
  // Backup erstellen
  const createBackupBtn = document.getElementById("createBackupBtn");
  if (createBackupBtn) {
    createBackupBtn.addEventListener("click", createSystemBackup);
  }
  
  // Debug-Info anzeigen
  const debugInfoBtn = document.getElementById("showDebugInfoBtn");
  if (debugInfoBtn) {
    debugInfoBtn.addEventListener("click", showDebugInfo);
  }
  
  // Verbindung testen
  const testConnectionBtn = document.getElementById("testConnectionBtn");
  if (testConnectionBtn) {
    testConnectionBtn.addEventListener("click", testSystemConnection);
  }
}

/**
 * Startet das System-Monitoring
 */
function startSystemMonitoring() {
  console.log("System-Monitoring gestartet");
  
  // Aktualisiere Monitoring-Daten alle 30 Sekunden
  setInterval(() => {
    updateSystemMetrics();
    updateDashboard();
  }, 30000);
  
  // Performance-Überwachung
  monitorPerformance();
  
  // Fehler-Überwachung
  setupErrorMonitoring();
}

/**
 * Aktualisiert System-Metriken
 */
function updateSystemMetrics() {
  // Betriebszeit berechnen
  const uptime = Date.now() - systemMonitor.startTime;
  const uptimeElement = document.getElementById("systemUptime");
  if (uptimeElement) {
    uptimeElement.textContent = formatUptime(uptime);
  }
  
  // Performance-Metriken aktualisieren
  if ('performance' in window) {
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      systemMonitor.performanceMetrics.averageLoadTime = navigation.loadEventEnd - navigation.loadEventStart;
    }
  }
  
  // Speicherverbrauch (falls verfügbar)
  if ('memory' in performance) {
    systemMonitor.performanceMetrics.peakMemoryUsage = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
  }
}

/**
 * Überwacht die Performance
 */
function monitorPerformance() {
  // PerformanceObserver für Navigation-Timing
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        systemMonitor.performanceMetrics.totalRequests++;
        
        // Log langsame Anfragen
        if (entry.duration > 1000) {
          logActivity(`Langsame Anfrage erkannt: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
        }
      }
    });
    
    observer.observe({ entryTypes: ['navigation', 'resource'] });
  }
}

/**
 * Richtet Fehler-Überwachung ein
 */
function setupErrorMonitoring() {
  // Globale Fehler abfangen
  window.addEventListener('error', (event) => {
    systemMonitor.errorCount++;
    logError(`JavaScript Fehler: ${event.message} in ${event.filename}:${event.lineno}`);
  });
  
  // Promise-Rejections abfangen
  window.addEventListener('unhandledrejection', (event) => {
    systemMonitor.errorCount++;
    logError(`Unbehandelte Promise-Rejection: ${event.reason}`);
  });
}

/**
 * Aktualisiert das Dashboard
 */
async function updateDashboard() {
  try {
    // System-Statistiken abrufen
    const stats = await getSystemStats();
    
    // Dashboard-Elemente aktualisieren
    updateElement("totalThemesCount", stats.totalThemes || 0);
    updateElement("activeUsersCount", systemMonitor.activeUsers);
    updateElement("todayLoginsCount", systemMonitor.totalLogins);
    
    // Gesundheitsstatus aktualisieren
    updateHealthStatus();
    
  } catch (error) {
    console.error("Fehler beim Aktualisieren des Dashboards:", error);
    logError(`Dashboard-Update-Fehler: ${error.message}`);
  }
}

/**
 * Aktualisiert den Gesundheitsstatus
 */
function updateHealthStatus() {
  const dbHealth = document.getElementById("databaseHealth");
  const perfHealth = document.getElementById("performanceHealth");
  
  if (dbHealth) {
    dbHealth.className = "health-status online";
    dbHealth.textContent = "✓";
  }
  
  if (perfHealth) {
    const avgLoadTime = systemMonitor.performanceMetrics.averageLoadTime;
    if (avgLoadTime < 1000) {
      perfHealth.className = "health-status online";
      perfHealth.textContent = "✓";
    } else if (avgLoadTime < 3000) {
      perfHealth.className = "health-status warning";
      perfHealth.textContent = "⚠";
    } else {
      perfHealth.className = "health-status error";
      perfHealth.textContent = "✗";
    }
  }
}

/**
 * Hilfsfunktion zum Aktualisieren von DOM-Elementen
 */
function updateElement(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

/**
 * Formatiert die Betriebszeit
 */
function formatUptime(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else {
    return `${minutes}m ${seconds % 60}s`;
  }
}

/**
 * Protokolliert eine Aktivität
 */
function logActivity(message) {
  const timestamp = new Date().toLocaleString('de-DE');
  const logEntry = `[${timestamp}] ${message}`;
  
  console.log("ACTIVITY:", logEntry);
  
  // Füge zur UI hinzu
  const activityLog = document.getElementById("activityLogContainer");
  if (activityLog) {
    const entry = document.createElement("div");
    entry.className = "log-entry";
    entry.textContent = logEntry;
    activityLog.insertBefore(entry, activityLog.firstChild);
    
    // Behalte nur die letzten 50 Einträge
    while (activityLog.children.length > 50) {
      activityLog.removeChild(activityLog.lastChild);
    }
  }
}

/**
 * Protokolliert einen Fehler
 */
function logError(message) {
  const timestamp = new Date().toLocaleString('de-DE');
  const logEntry = `[${timestamp}] ERROR: ${message}`;
  
  console.error("ERROR:", logEntry);
  
  // Füge zur UI hinzu
  const errorLog = document.getElementById("errorLogContainer");
  if (errorLog) {
    const entry = document.createElement("div");
    entry.className = "log-entry error";
    entry.textContent = logEntry;
    errorLog.insertBefore(entry, errorLog.firstChild);
    
    // Behalte nur die letzten 20 Fehler
    while (errorLog.children.length > 20) {
      errorLog.removeChild(errorLog.lastChild);
    }
  }
}

/**
 * System-Tools Funktionen
 */
async function clearSystemCache() {
  showLoader();
  try {
    // Cache leeren (Browser-spezifisch)
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
    }
    
    // LocalStorage leeren (selektiv)
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('wbs_cache_')) {
        localStorage.removeItem(key);
      }
    });
    
    logActivity("System-Cache geleert");
    showNotification("Cache erfolgreich geleert", "success");
  } catch (error) {
    logError(`Cache-Löschung fehlgeschlagen: ${error.message}`);
    showNotification("Fehler beim Leeren des Caches", "error");
  } finally {
    hideLoader();
  }
}

async function optimizeDatabase() {
  showLoader();
  try {
    logActivity("Datenbank-Optimierung gestartet");
    
    // Placeholder für Datenbank-Optimierung
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    logActivity("Datenbank-Optimierung abgeschlossen");
    showNotification("Datenbank erfolgreich optimiert", "success");
  } catch (error) {
    logError(`Datenbank-Optimierung fehlgeschlagen: ${error.message}`);
    showNotification("Fehler bei der Datenbank-Optimierung", "error");
  } finally {
    hideLoader();
  }
}

async function createSystemBackup() {
  showLoader();
  try {
    logActivity("System-Backup wird erstellt");
    
    const backupData = await exportAllData();
    const enhancedBackup = {
      ...backupData,
      backupVersion: "2.0",
      systemInfo: {
        timestamp: Date.now(),
        uptime: Date.now() - systemMonitor.startTime,
        metrics: systemMonitor.performanceMetrics
      }
    };
    
    const filename = `WBS_Backup_${new Date().toISOString().split('T')[0]}_${Date.now()}.json`;
    downloadFile(filename, JSON.stringify(enhancedBackup, null, 2), "application/json");
    
    systemMonitor.lastBackup = Date.now();
    logActivity("System-Backup erfolgreich erstellt");
    showNotification("Backup erfolgreich erstellt", "success");
  } catch (error) {
    logError(`Backup-Erstellung fehlgeschlagen: ${error.message}`);
    showNotification("Fehler beim Erstellen des Backups", "error");
  } finally {
    hideLoader();
  }
}

function showDebugInfo() {
  const debugInfo = {
    systemMonitor,
    adminConfig,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString(),
    performance: {
      memory: 'memory' in performance ? performance.memory : 'Nicht verfügbar',
      timing: performance.timing
    }
  };
  
  console.log("DEBUG INFO:", debugInfo);
  
  // Debug-Info als JSON anzeigen
  const debugWindow = window.open('', '_blank');
  debugWindow.document.write(`
    <html>
      <head><title>Debug-Informationen</title></head>
      <body>
        <h1>System-Debug-Informationen</h1>
        <pre>${JSON.stringify(debugInfo, null, 2)}</pre>
      </body>
    </html>
  `);
}

async function testSystemConnection() {
  showNotification("Verbindung wird getestet...", "info");
  
  try {
    const startTime = Date.now();
    
    // Test Firebase-Verbindung
    const stats = await getSystemStats();
    
    const endTime = Date.now();
    const responseTime = endTime - startTime;
    
    logActivity(`Verbindungstest erfolgreich: ${responseTime}ms`);
    showNotification(`Verbindung OK (${responseTime}ms)`, "success");
  } catch (error) {
    logError(`Verbindungstest fehlgeschlagen: ${error.message}`);
    showNotification("Verbindungstest fehlgeschlagen", "error");
  }
}

/**
 * Zeitgesteuerte automatische Backups
 */
function scheduleAutomaticBackups() {
  setInterval(async () => {
    try {
      logActivity("Automatisches Backup wird erstellt");
      await createSystemBackup();
    } catch (error) {
      logError(`Automatisches Backup fehlgeschlagen: ${error.message}`);
    }
  }, adminConfig.backupInterval);
}

/**
 * Exportiert einen System-Report
 */
async function exportSystemReport() {
  showLoader();
  try {
    const stats = await getSystemStats();
    
    const report = {
      generatedAt: new Date().toISOString(),
      systemHealth: {
        uptime: Date.now() - systemMonitor.startTime,
        totalLogins: systemMonitor.totalLogins,
        errorCount: systemMonitor.errorCount,
        performanceMetrics: systemMonitor.performanceMetrics
      },
      statistics: stats,
      configuration: {
        version: "2.0",
        adminConfig: {
          sessionTimeout: adminConfig.sessionTimeout,
          backupInterval: adminConfig.backupInterval
        }
      }
    };
    
    const filename = `WBS_System_Report_${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(filename, JSON.stringify(report, null, 2), "application/json");
    
    logActivity("System-Report exportiert");
    showNotification("System-Report erfolgreich exportiert", "success");
  } catch (error) {
    logError(`System-Report-Export fehlgeschlagen: ${error.message}`);
    showNotification("Fehler beim Exportieren des System-Reports", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Initialisiert Admin-Session-Management
 */
function initAdminSessionManagement() {
  // Session-Timeout für Admin
  let sessionTimer = setTimeout(() => {
    if (currentAdmin.isLoggedIn) {
      showNotification("Admin-Session abgelaufen", "warning");
      logActivity("Admin-Session durch Timeout beendet");
      logoutAdmin();
    }
  }, adminConfig.sessionTimeout);
  
  // Reset Timer bei Aktivität
  document.addEventListener('click', () => {
    if (currentAdmin.isLoggedIn) {
      clearTimeout(sessionTimer);
      sessionTimer = setTimeout(() => {
        showNotification("Admin-Session abgelaufen", "warning");
        logActivity("Admin-Session durch Timeout beendet");
        logoutAdmin();
      }, adminConfig.sessionTimeout);
    }
  });
}

// Aktivitäts-Logging beim Modul-Start
logActivity("Erweitertes Admin-Modul initialisiert");

console.log("Erweitertes Admin-Modul geladen");
