// js/modules/infoModule.js - Informationen für Lehrer

import { 
  systemSettings, 
  systemInformations,
  loadSystemInformations,
  formatDateForDisplay,
  getDaysUntil
} from "../adminService.js";
import { 
  showLoader, 
  hideLoader, 
  showNotification
} from "../uiService.js";

/**
 * Referenz auf die DOM-Elemente
 */
let elements = {
  infoTab: null,
  currentSchoolYearInfo: null,
  schoolYearEndInfo: null,
  assessmentDeadlineInfo: null,
  teacherInfoList: null
};

/**
 * Initialisiert das Info-Modul
 */
export function initInfoModule() {
  // DOM-Elemente abrufen
  loadDOMElements();
  
  // Event-Listener hinzufügen
  setupEventListeners();
  
  // Initial laden wenn Benutzer eingeloggt ist
  document.addEventListener("userLoggedIn", async () => {
    await updateInfoTab();
  });
}

/**
 * Lädt alle benötigten DOM-Elemente
 */
function loadDOMElements() {
  elements.infoTab = document.getElementById("info-tab");
  elements.currentSchoolYearInfo = document.getElementById("currentSchoolYearInfo");
  elements.schoolYearEndInfo = document.getElementById("schoolYearEndInfo");
  elements.assessmentDeadlineInfo = document.getElementById("assessmentDeadlineInfo");
  elements.teacherInfoList = document.getElementById("teacherInfoList");
}

/**
 * Richtet die Event-Listener ein
 */
function setupEventListeners() {
  // Event-Listener für Tab-Wechsel
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", function() {
      const tabId = this.dataset.tab;
      
      if (tabId === "info") {
        updateInfoTab();
      }
    });
  });
  
  // Event-Listener für System-Updates
  document.addEventListener("systemSettingsUpdated", () => {
    updateSchoolYearInfo();
  });
}

/**
 * Aktualisiert den Info-Tab
 */
export async function updateInfoTab() {
  if (!elements.infoTab) return;
  
  try {
    showLoader();
    
    // Lade System-Informationen
    await loadSystemInformations();
    
    // Aktualisiere Schuljahr-Informationen
    updateSchoolYearInfo();
    
    // Aktualisiere Informationsliste
    updateTeacherInfoList();
    
  } catch (error) {
    console.error("Fehler beim Laden der Informationen:", error);
    showNotification("Fehler beim Laden der Informationen.", "error");
  } finally {
    hideLoader();
  }
}

/**
 * Aktualisiert die Schuljahr-Informationen
 */
function updateSchoolYearInfo() {
  if (!elements.currentSchoolYearInfo) return;
  
  // Aktuelles Schuljahr
  const currentSchoolYear = systemSettings.currentSchoolYear || "Nicht festgelegt";
  elements.currentSchoolYearInfo.innerHTML = `
    <strong>Aktuelles Schuljahr:</strong> 
    <span class="school-year-highlight">${currentSchoolYear}</span>
  `;
  
  // Schuljahresende
  if (elements.schoolYearEndInfo) {
    if (systemSettings.schoolYearEnd) {
      const daysToEnd = getDaysUntil(systemSettings.schoolYearEnd);
      const formattedDate = formatDateForDisplay(systemSettings.schoolYearEnd);
      
      let warningClass = "";
      let warningText = "";
      
      if (daysToEnd !== null) {
        if (daysToEnd < 0) {
          warningText = ` (${Math.abs(daysToEnd)} Tage überschritten)`;
          warningClass = "deadline-urgent-small";
        } else if (daysToEnd <= 7) {
          warningText = ` (in ${daysToEnd} Tagen)`;
          warningClass = "deadline-urgent-small";
        } else if (daysToEnd <= 30) {
          warningText = ` (in ${daysToEnd} Tagen)`;
          warningClass = "deadline-warning-small";
        } else {
          warningText = ` (in ${daysToEnd} Tagen)`;
        }
      }
      
      elements.schoolYearEndInfo.innerHTML = `
        <strong>Schuljahresende:</strong> 
        ${formattedDate}
        <span class="${warningClass}">${warningText}</span>
      `;
    } else {
      elements.schoolYearEndInfo.innerHTML = `
        <strong>Schuljahresende:</strong> Nicht festgelegt
      `;
    }
  }
  
  // Bewertungsfrist
  if (elements.assessmentDeadlineInfo) {
    if (systemSettings.lastAssessmentDate) {
      const daysToDeadline = getDaysUntil(systemSettings.lastAssessmentDate);
      const formattedDate = formatDateForDisplay(systemSettings.lastAssessmentDate);
      
      let warningClass = "";
      let warningText = "";
      
      if (daysToDeadline !== null) {
        if (daysToDeadline < 0) {
          warningText = ` (${Math.abs(daysToDeadline)} Tage überschritten)`;
          warningClass = "deadline-urgent-small";
        } else if (daysToDeadline <= 3) {
          warningText = ` (in ${daysToDeadline} Tagen)`;
          warningClass = "deadline-urgent-small";
        } else if (daysToDeadline <= 14) {
          warningText = ` (in ${daysToDeadline} Tagen)`;
          warningClass = "deadline-warning-small";
        } else {
          warningText = ` (in ${daysToDeadline} Tagen)`;
        }
      }
      
      elements.assessmentDeadlineInfo.innerHTML = `
        <strong>Letzte Bewertungsfrist:</strong> 
        ${formattedDate}
        <span class="${warningClass}">${warningText}</span>
      `;
    } else {
      elements.assessmentDeadlineInfo.innerHTML = `
        <strong>Letzte Bewertungsfrist:</strong> Nicht festgelegt
      `;
    }
  }
}

/**
 * Aktualisiert die Liste der Informationen für Lehrer
 */
function updateTeacherInfoList() {
  if (!elements.teacherInfoList) return;
  
  elements.teacherInfoList.innerHTML = "";
  
  // Nur aktive Informationen anzeigen
  const activeInfos = systemInformations.filter(info => info.active);
  
  if (!activeInfos || activeInfos.length === 0) {
    elements.teacherInfoList.innerHTML = `
      <div class="empty-state">
        <p>Derzeit keine aktuellen Informationen verfügbar.</p>
      </div>
    `;
    return;
  }
  
  // Sortiere nach Priorität und Datum
  const sortedInfos = activeInfos.sort((a, b) => {
    // Erst nach Priorität
    const priorityOrder = { urgent: 0, important: 1, normal: 2 };
    const aPriority = priorityOrder[a.priority] || 2;
    const bPriority = priorityOrder[b.priority] || 2;
    
    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }
    
    // Dann nach Datum (neueste zuerst)
    const aDate = new Date(a.created_at || 0);
    const bDate = new Date(b.created_at || 0);
    return bDate - aDate;
  });
  
  sortedInfos.forEach(info => {
    const infoItem = document.createElement("div");
    infoItem.className = `teacher-info-item priority-${info.priority}`;
    
    const createdDate = info.created_at ? formatDateForDisplay(info.created_at) : "Unbekannt";
    
    infoItem.innerHTML = `
      <div class="teacher-info-header">
        <h3 class="teacher-info-title">${info.title}</h3>
        <div class="teacher-info-date">${createdDate}</div>
      </div>
      <div class="teacher-info-content">${formatInfoContent(info.content)}</div>
      ${info.priority !== 'normal' ? `<div class="info-priority-indicator priority-${info.priority}">${getPriorityText(info.priority)}</div>` : ''}
    `;
    
    elements.teacherInfoList.appendChild(infoItem);
  });
}

/**
 * Formatiert den Inhalt einer Information (einfache Zeilenumbrüche)
 */
function formatInfoContent(content) {
  if (!content) return "";
  
  // Konvertiere Zeilenumbrüche zu HTML
  return content.replace(/\n/g, '<br>');
}

/**
 * Gibt Prioritäts-Text zurück
 */
function getPriorityText(priority) {
  switch (priority) {
    case 'important': return 'Wichtig';
    case 'urgent': return 'Dringend';
    default: return 'Normal';
  }
}

/**
 * Lädt und aktualisiert alle Informationen
 */
export async function refreshInfo() {
  try {
    await loadSystemInformations();
    updateSchoolYearInfo();
    updateTeacherInfoList();
    showNotification("Informationen aktualisiert.");
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Informationen:", error);
    showNotification("Fehler beim Aktualisieren der Informationen.", "error");
  }
}

/**
 * Prüft auf wichtige Deadline-Warnungen
 */
export function checkDeadlineWarnings() {
  const warnings = [];
  
  // Prüfe Schuljahresende
  if (systemSettings.schoolYearEnd) {
    const daysToEnd = getDaysUntil(systemSettings.schoolYearEnd);
    
    if (daysToEnd !== null && daysToEnd >= 0 && daysToEnd <= 14) {
      warnings.push({
        type: daysToEnd <= 7 ? "urgent" : "warning",
        message: `Schuljahresende in ${daysToEnd} Tagen (${formatDateForDisplay(systemSettings.schoolYearEnd)})`
      });
    }
  }
  
  // Prüfe Bewertungsfrist
  if (systemSettings.lastAssessmentDate) {
    const daysToDeadline = getDaysUntil(systemSettings.lastAssessmentDate);
    
    if (daysToDeadline !== null && daysToDeadline >= 0 && daysToDeadline <= 7) {
      warnings.push({
        type: daysToDeadline <= 3 ? "urgent" : "warning",
        message: `Bewertungsfrist in ${daysToDeadline} Tagen (${formatDateForDisplay(systemSettings.lastAssessmentDate)})`
      });
    }
  }
  
  // Zeige Warnungen als Benachrichtigungen
  warnings.forEach(warning => {
    showNotification(warning.message, warning.type === "urgent" ? "error" : "warning");
  });
  
  return warnings;
}
