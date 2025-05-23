// js/uiService.js
import { DEFAULT_ASSESSMENT_CATEGORIES, DEFAULT_TEACHERS } from "./constants.js";
import { teacherData, getAssignedStudents } from "./dataService.js";

/**
 * Zeigt den Ladebildschirm
 */
export function showLoader() {
  const mainLoader = document.getElementById("mainLoader");
  if (mainLoader) {
    mainLoader.style.display = "flex";
  }
}

/**
 * Versteckt den Ladebildschirm
 */
export function hideLoader() {
  const mainLoader = document.getElementById("mainLoader");
  if (mainLoader) {
    mainLoader.style.display = "none";
  }
}

/**
 * Zeigt eine Benachrichtigung
 * @param {string} message - Anzuzeigender Text
 * @param {string} type - Art der Benachrichtigung (success, warning, error)
 */
export function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Formatiert einen ISO-Datumstring in deutsches Format
 * @param {string} isoDateString - ISO-Datum (YYYY-MM-DD)
 * @returns {string} Formatiertes Datum (DD.MM.YYYY)
 */
export function formatDate(isoDateString) {
  if (!isoDateString) return "";
  const date = new Date(isoDateString + "T00:00:00");
  if (isNaN(date.getTime())) return isoDateString;
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

/**
 * Extrahiert das Jahr aus einem ISO-Datum
 * @param {string} isoDateString - ISO-Datum (YYYY-MM-DD)
 * @returns {string} Jahr
 */
export function getYearFromDate(isoDateString) {
  return isoDateString.split("-")[0];
}

/**
 * Gibt verfügbare Jahre zurück - aktuelles Jahr immer an erster Stelle,
 * dann aufsteigend bis 10 Jahre in die Zukunft
 * @returns {string[]} Liste von Jahren
 */
export function getAvailableYears() {
  const years = new Set();
  const currentYear = new Date().getFullYear();

  // Aktuelle Jahre plus 10 Jahre in die Zukunft
  for (let i = 0; i <= 10; i++) {
    years.add((currentYear + i).toString());
  }

  // Jahre aus vorhandenen Daten (nur zugewiesene Schüler)
  const assignedStudents = getAssignedStudents();
  assignedStudents.forEach((student) => {
    years.add(getYearFromDate(student.examDate));
  });

  // Extrahiere das aktuelle Jahr
  const currentYearStr = currentYear.toString();
  
  // Filtere das aktuelle Jahr heraus und sortiere die übrigen Jahre numerisch aufsteigend
  let yearArray = Array.from(years)
    .filter(y => y !== currentYearStr)
    .sort((a, b) => parseInt(a) - parseInt(b));
  
  // Füge das aktuelle Jahr an erster Stelle ein
  yearArray.unshift(currentYearStr);
  
  return yearArray;
}

/**
 * Gibt verfügbare Daten zurück (nur für zugewiesene Schüler)
 * @param {string} year - Optional: Jahr filtern
 * @returns {string[]} Liste von Daten
 */
export function getAvailableDates(year = null) {
  const dates = new Set();
  const assignedStudents = getAssignedStudents();
  
  assignedStudents.forEach((student) => {
    if (!year || getYearFromDate(student.examDate) === year) {
      dates.add(student.examDate);
    }
  });
  return Array.from(dates).sort().reverse();
}

/**
 * Gibt verfügbare Themen zurück (nur für zugewiesene Schüler)
 * @param {string} selectedDate - Optional: Datum filtern
 * @returns {string[]} Liste von Themen
 */
export function getAvailableTopics(selectedDate = null) {
  const topics = new Set();
  let filteredStudents = getAssignedStudents();
  
  if (selectedDate) {
    filteredStudents = filteredStudents.filter((s) => s.examDate === selectedDate);
  }
  
  filteredStudents.forEach((student) => {
    if (student.topic && student.topic.trim() !== "") {
      topics.add(student.topic);
    }
  });
  return Array.from(topics).sort();
}

/**
 * Berechnet den Durchschnitt der Bewertungen (Fallback für Standard-Kategorien)
 * @param {Object} assessment - Bewertungsobjekt
 * @returns {string|null} Durchschnittsnote oder null
 */
export function calculateAverageGrade(assessment) {
  if (!assessment) return null;
  let sum = 0;
  let count = 0;
  
  DEFAULT_ASSESSMENT_CATEGORIES.forEach((category) => {
    if (assessment[category.id] && assessment[category.id] > 0) {
      sum += assessment[category.id];
      count++;
    }
  });
  
  if (count === 0) return null;
  return (sum / count).toFixed(1);
}

/**
 * Berechnet den gewichteten Durchschnitt basierend auf Template-Kategorien
 * @param {Object} assessment - Bewertungsobjekt
 * @param {Object} template - Template mit Kategorien und Gewichtungen
 * @returns {string|null} Durchschnittsnote oder null
 */
export function calculateWeightedAverageGrade(assessment, template) {
  if (!assessment || !template || !template.categories) {
    return calculateAverageGrade(assessment); // Fallback
  }
  
  let sum = 0;
  let totalWeight = 0;
  
  template.categories.forEach((category) => {
    if (assessment[category.id] && assessment[category.id] > 0) {
      const weight = category.weight || 1;
      sum += assessment[category.id] * weight;
      totalWeight += weight;
    }
  });
  
  if (totalWeight === 0) return null;
  return (sum / totalWeight).toFixed(1);
}

/**
 * Initialisiert das Lehrer-Grid für die Anmeldung - DYNAMISCH aus Firebase
 * @param {HTMLElement} teacherGrid - DOM-Element für das Grid
 * @param {Function} showPasswordModalCallback - Callback für Passwortdialog
 * @param {Array} teachersArray - Array mit Lehrer-Objekten (optional)
 */
export function initTeacherGrid(teacherGrid, showPasswordModalCallback, teachersArray = null) {
  if (!teacherGrid) return;
  
  console.log("Initialisiere Lehrer-Grid...");
  teacherGrid.innerHTML = "";
  
  // Verwende übergebenes Array, globales allTeachers oder Fallback zu DEFAULT_TEACHERS
  let teachersToShow = teachersArray;
  
  if (!teachersToShow && window.allTeachers && window.allTeachers.length > 0) {
    teachersToShow = window.allTeachers;
    console.log("Verwende globale allTeachers:", teachersToShow.length);
  }
  
  if (!teachersToShow || teachersToShow.length === 0) {
    teachersToShow = DEFAULT_TEACHERS;
    console.log("Verwende DEFAULT_TEACHERS als Fallback");
  }
  
  console.log("Anzahl Lehrer im Grid:", teachersToShow.length);
    
  teachersToShow.forEach((teacher) => {
    const card = document.createElement("div");
    card.className = "teacher-card";
    card.dataset.code = teacher.code;
    card.dataset.name = teacher.name;
    card.innerHTML = `
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50' y='60' font-family='Arial' font-size='30' text-anchor='middle' fill='%23666'%3E${teacher.code.charAt(0)}%3C/text%3E%3C/svg%3E" alt="${teacher.name}">
      <h3>${teacher.name}</h3>
    `;
    card.addEventListener("click", () => {
      showPasswordModalCallback(teacher);
    });
    teacherGrid.appendChild(card);
  });
}

/**
 * Erstellt HTML für Bewertungskriterien-Tags
 * @param {Array} categories - Array von Kategorie-Objekten
 * @returns {string} HTML-String für Kriterien-Tags
 */
export function createCriteriaTagsHTML(categories) {
  if (!categories || categories.length === 0) return "";
  
  return categories.map(cat => 
    `<span class="criterion-tag">${cat.name}${cat.weight && cat.weight > 1 ? ` (×${cat.weight})` : ''}</span>`
  ).join('');
}

/**
 * Erstellt HTML für Template-Auswahl-Optionen
 * @param {Array} templates - Array von Template-Objekten
 * @param {string} selectedId - ID des ausgewählten Templates
 * @returns {string} HTML-String für Select-Optionen
 */
export function createTemplateOptionsHTML(templates, selectedId = null) {
  if (!templates || templates.length === 0) return "";
  
  return templates.map(template => 
    `<option value="${template.id}" ${template.id === selectedId ? 'selected' : ''}>
      ${template.name}${template.isDefault ? ' (Standard)' : ''}
     </option>`
  ).join('');
}

/**
 * Erstellt HTML für Lehrer-Auswahl-Optionen
 * @param {Array} teachers - Array von Lehrer-Objekten
 * @param {string} currentTeacherCode - Code des aktuellen Lehrers
 * @param {string} selectedCode - Code des ausgewählten Lehrers
 * @returns {string} HTML-String für Select-Optionen
 */
export function createTeacherOptionsHTML(teachers, currentTeacherCode, selectedCode = null) {
  if (!teachers || teachers.length === 0) return "";
  
  let html = `<option value="${currentTeacherCode}" ${currentTeacherCode === selectedCode ? 'selected' : ''}>
    Aktueller Lehrer (Sie)
  </option>`;
  
  teachers.forEach(teacher => {
    if (teacher.code !== currentTeacherCode) {
      html += `<option value="${teacher.code}" ${teacher.code === selectedCode ? 'selected' : ''}>
        ${teacher.name}
       </option>`;
    }
  });
  
  return html;
}

/**
 * Validiert Eingabefelder
 * @param {Array} fields - Array von Objekten mit {element, name, required}
 * @returns {Object} {isValid: boolean, errors: Array}
 */
export function validateFields(fields) {
  const errors = [];
  
  fields.forEach(field => {
    const value = field.element ? field.element.value.trim() : "";
    
    if (field.required && !value) {
      errors.push(`${field.name} ist erforderlich.`);
    }
    
    if (field.minLength && value.length < field.minLength) {
      errors.push(`${field.name} muss mindestens ${field.minLength} Zeichen lang sein.`);
    }
    
    if (field.maxLength && value.length > field.maxLength) {
      errors.push(`${field.name} darf maximal ${field.maxLength} Zeichen lang sein.`);
    }
    
    if (field.pattern && !field.pattern.test(value)) {
      errors.push(`${field.name} hat ein ungültiges Format.`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
}

/**
 * Zeigt Validierungsfehler als Benachrichtigung an
 * @param {Array} errors - Array von Fehlermeldungen
 */
export function showValidationErrors(errors) {
  if (errors && errors.length > 0) {
    const message = errors.join("\n");
    showNotification(message, "error");
  }
}

/**
 * Debounce-Funktion für Performance-Optimierung
 * @param {Function} func - Funktion, die ausgeführt werden soll
 * @param {number} wait - Wartezeit in Millisekunden
 * @returns {Function} Debounced-Funktion
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Erstellt eine sichere HTML-Darstellung von Text (XSS-Schutz)
 * @param {string} text - Text, der escaped werden soll
 * @returns {string} HTML-sicherer Text
 */
export function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Formatiert eine Zahl als Note (1.0, 1.5, etc.)
 * @param {number} grade - Numerische Note
 * @returns {string} Formatierte Note
 */
export function formatGrade(grade) {
  if (typeof grade !== 'number' || isNaN(grade)) return "-";
  return grade.toFixed(1);
}

/**
 * Bestimmt CSS-Klasse basierend auf Note
 * @param {number} grade - Numerische Note
 * @returns {string} CSS-Klasse
 */
export function getGradeClass(grade) {
  if (typeof grade !== 'number' || isNaN(grade)) return "grade-none";
  
  const rounded = Math.round(grade);
  return `grade-${Math.max(1, Math.min(6, rounded))}`;
}

/**
 * Prüft, ob ein Element im Viewport sichtbar ist
 * @param {HTMLElement} element - DOM-Element
 * @returns {boolean} Sichtbarkeit
 */
export function isElementInViewport(element) {
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * Smooth Scroll zu einem Element
 * @param {HTMLElement} element - Ziel-Element
 * @param {Object} options - Scroll-Optionen
 */
export function scrollToElement(element, options = {}) {
  if (!element) return;
  
  const defaultOptions = {
    behavior: 'smooth',
    block: 'start',
    inline: 'nearest'
  };
  
  element.scrollIntoView({ ...defaultOptions, ...options });
}

/**
 * Erstellt eine Download-Datei
 * @param {string} filename - Dateiname
 * @param {string} content - Dateiinhalt
 * @param {string} mimeType - MIME-Type
 */
export function downloadFile(filename, content, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
