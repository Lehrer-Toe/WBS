import { getTeacherData } from './auth.js';

// Datum formatieren
export function formatDate(isoDateString) {
  const date = new Date(isoDateString + "T00:00:00");
  if(isNaN(date.getTime())) return isoDateString;
  
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// Benachrichtigung anzeigen
export function showNotification(message, type = "success") {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Loader anzeigen
export function showLoader() {
  document.getElementById("mainLoader").style.display = "flex";
}

// Loader ausblenden
export function hideLoader() {
  document.getElementById("mainLoader").style.display = "none";
}

// Durchschnittsnote berechnen
export function calculateAverageGrade(assessment) {
  if (!assessment) return null;
  
  let sum = 0;
  let count = 0;
  
  // Import aus students.js würde hier einen zirkulären Import erzeugen
  const CATEGORIES = [
    { id: "organization", name: "Organisation" },
    { id: "workBehavior", name: "Arbeitsverhalten" },
    { id: "teamwork", name: "Zusammenarbeit" },
    { id: "quality", name: "Arbeitsqualität" },
    { id: "reflection", name: "Reflexion" },
    { id: "documentation", name: "Dokumentation" }
  ];
  
  CATEGORIES.forEach(category => {
    if (assessment[category.id] && assessment[category.id] > 0) {
      sum += assessment[category.id];
      count++;
    }
  });
  
  if (count === 0) return null;
  
  return (sum / count).toFixed(1);
}

// Jahr aus Datum extrahieren
export function getYearFromDate(isoDateString) {
  return isoDateString.split('-')[0];
}

// Verfügbare Jahre abrufen
export function getAvailableYears() {
  const teacherData = getTeacherData();
  const years = new Set();
  for (let i = 2025; i <= 2035; i++) {
    years.add(i.toString());
  }
  
  teacherData.students.forEach(student => {
    years.add(getYearFromDate(student.examDate));
  });
  
  return Array.from(years).sort();
}

// Verfügbare Daten abrufen
export function getAvailableDates(year = null) {
  const teacherData = getTeacherData();
  const dates = new Set();
  
  teacherData.students.forEach(student => {
    if (!year || getYearFromDate(student.examDate) === year) {
      dates.add(student.examDate);
    }
  });
  
  return Array.from(dates).sort().reverse(); // Neueste Daten zuerst
}

// ID generieren
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}