// js/uiService.js
import { ASSESSMENT_CATEGORIES, DEFAULT_TEACHERS } from "./constants.js";
import { teacherData } from "./dataService.js";

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
 * Gibt verfügbare Jahre zurück
 * @returns {string[]} Liste von Jahren
 */
export function getAvailableYears() {
  const years = new Set();
  const currentYear = new Date().getFullYear();

  // Aktuelle Jahre plus 10 Jahre in die Zukunft
  for (let i = 0; i <= 10; i++) {
    years.add((currentYear + i).toString());
  }

  // Jahre aus vorhandenen Daten
  teacherData.students.forEach((student) => {
    years.add(getYearFromDate(student.examDate));
  });

  return Array.from(years).sort((a, b) => a - b).reverse();
}

/**
 * Gibt verfügbare Daten zurück
 * @param {string} year - Optional: Jahr filtern
 * @returns {string[]} Liste von Daten
 */
export function getAvailableDates(year = null) {
  const dates = new Set();
  teacherData.students.forEach((student) => {
    if (!year || getYearFromDate(student.examDate) === year) {
      dates.add(student.examDate);
    }
  });
  return Array.from(dates).sort().reverse();
}

/**
 * Gibt verfügbare Themen zurück
 * @param {string} selectedDate - Optional: Datum filtern
 * @returns {string[]} Liste von Themen
 */
export function getAvailableTopics(selectedDate = null) {
  const topics = new Set();
  let filteredStudents = teacherData.students;
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
 * Berechnet den Durchschnitt der Bewertungen
 * @param {Object} assessment - Bewertungsobjekt
 * @returns {string|null} Durchschnittsnote oder null
 */
export function calculateAverageGrade(assessment) {
  if (!assessment) return null;
  let sum = 0;
  let count = 0;
  ASSESSMENT_CATEGORIES.forEach((category) => {
    if (assessment[category.id] && assessment[category.id] > 0) {
      sum += assessment[category.id];
      count++;
    }
  });
  if (count === 0) return null;
  return (sum / count).toFixed(1);
}

/**
 * Initialisiert das Lehrer-Grid für die Anmeldung
 * @param {HTMLElement} teacherGrid - DOM-Element für das Grid
 * @param {Function} showPasswordModalCallback - Callback für Passwortdialog
 */
export function initTeacherGrid(teacherGrid, showPasswordModalCallback) {
  if (!teacherGrid) return;
  teacherGrid.innerHTML = "";
  DEFAULT_TEACHERS.forEach((teacher) => {
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
