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
  const years = new Set();
  const currentYear = new Date().getFullYear();
  
  // Jahre vom aktuellen Jahr bis 10 Jahre in die Zukunft, beginnend mit aktuellem Jahr
  for (let i = 0; i <= 10; i++) {
    years.add((currentYear + i).toString());
  }
  
  // Auch Jahre aus vorhandenen Schülerdaten hinzufügen
  teacherData.students.forEach(student => {
    years.add(getYearFromDate(student.examDate));
  });
  
  // Absteigend sortieren mit aktuellem Jahr zuerst
  return Array.from(years).sort((a, b) => a - b).reverse();
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