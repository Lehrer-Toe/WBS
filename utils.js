/**
 * Formatiert ein ISO-Datumstring in deutsches Format
 */
function formatDate(isoDateString) {
  if (!isoDateString) return '';
  const date = new Date(isoDateString + "T00:00:00");
  if(isNaN(date.getTime())) return isoDateString;
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Extrahiert das Jahr aus einem ISO-Datumstring
 */
function getYearFromDate(isoDateString) {
  return isoDateString.split('-')[0];
}

/**
 * Generiert eine eindeutige ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Gibt die verfügbaren Jahre zurück
 */
function getAvailableYears() {
  const currentYear = new Date().getFullYear();
  let years = [];
  
  // Aktuelles Jahr zuerst
  years.push(currentYear.toString());
  
  // Dann Folgejahre in aufsteigender Reihenfolge
  for (let i = 1; i <= 10; i++) {
    years.push((currentYear + i).toString());
  }
  
  // Zusätzliche Jahre aus Schülerdaten hinzufügen, wenn nicht bereits vorhanden
  const additionalYears = [];
  teacherData.students.forEach(student => {
    const yearFromStudent = getYearFromDate(student.examDate);
    if (!years.includes(yearFromStudent)) {
      additionalYears.push(yearFromStudent);
    }
  });
  
  // Zusätzliche Jahre sortieren und anhängen
  if (additionalYears.length > 0) {
    additionalYears.sort((a, b) => parseInt(a) - parseInt(b));
    years = years.concat(additionalYears);
  }
  
  return years;
}

/**
 * Gibt die verfügbaren Termine zurück
 */
function getAvailableDates(year = null) {
  const dates = new Set();
  teacherData.students.forEach(student => {
    if (!year || getYearFromDate(student.examDate) === year) {
      dates.add(student.examDate);
    }
  });
  return Array.from(dates).sort().reverse();
}

/**
 * Prüft, ob bereits ein Student an einem Prüfungstag existiert
 */
function isStudentOnExamDay(studentId, examDate) {
  return teacherData.students.some(s => s.id !== studentId && s.examDate === examDate);
}

/**
 * Berechnet die Durchschnittsnote für eine Bewertung
 */
function calculateAverageGrade(assessment) {
  if (!assessment) return null;
  let sum = 0;
  let count = 0;
  ASSESSMENT_CATEGORIES.forEach(category => {
    if (assessment[category.id] && assessment[category.id] > 0) {
      sum += assessment[category.id];
      count++;
    }
  });
  if (count === 0) return null;
  return (sum / count).toFixed(1);
}