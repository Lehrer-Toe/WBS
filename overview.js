import { showNotification, formatDate, calculateAverageGrade, getAvailableYears, getAvailableDates } from './utils.js';
import { getTeacherData, getCurrentUser } from './auth.js';
import { ASSESSMENT_CATEGORIES } from './students.js';

// Übersichts-Jahresauswahl befüllen
export function populateOverviewYearSelect(overviewYearSelect) {
  const years = getAvailableYears();
  
  overviewYearSelect.innerHTML = '<option value="">Alle Jahre</option>';
  
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    overviewYearSelect.appendChild(option);
  });
}

// Übersichts-Datumsauswahl basierend auf ausgewähltem Jahr befüllen
export function populateOverviewDateSelect(selectedYear, overviewDateSelect) {
  const dates = getAvailableDates(selectedYear);
  
  overviewDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    overviewDateSelect.appendChild(option);
  });
}

// Übersichtsinhalt basierend auf ausgewähltem Jahr und Datum aktualisieren
export function updateOverviewContent(selectedYear, selectedDate, overviewTable, showEditGradeModalFn) {
  const teacherData = getTeacherData();
  
  const tbody = overviewTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  // Prüflinge basierend auf Auswahl filtern
  let filteredStudents = [...teacherData.students];
  
  if (selectedYear) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === selectedYear);
  }
  
  if (selectedDate) {
    filteredStudents = filteredStudents.filter(s => s.examDate === selectedDate);
  }
  
  // Nach Datum sortieren (neueste zuerst)
  filteredStudents.sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
  
  if (filteredStudents.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="10">Keine Prüflinge gefunden</td>';
    tbody.appendChild(tr);
    return;
  }
  
  filteredStudents.forEach(student => {
    const assessment = teacherData.assessments[student.id] || {};
    const avgGrade = calculateAverageGrade(assessment);
    const finalGrade = assessment.finalGrade || avgGrade || '-';
    
    const tr = document.createElement('tr');
    
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${formatDate(student.examDate)}</td>
    `;
    
    // Spalten für jede Bewertungskategorie hinzufügen
    ASSESSMENT_CATEGORIES.forEach(category => {
      const grade = assessment[category.id] || '-';
      tr.innerHTML += `<td>${grade}</td>`;
    });
    
    tr.innerHTML += `
      <td><strong>${finalGrade}</strong></td>
      <td>
        <button class="edit-btn" data-id="${student.id}">✏️</button>
      </td>
    `;
    
    tr.querySelector('.edit-btn').addEventListener('click', () => {
      // Prüfling finden und Noten-Bearbeitungsmodal anzeigen
      showEditGradeModalFn(student);
    });
    
    tbody.appendChild(tr);
  });
}

// Daten basierend auf ausgewähltem Jahr und Datum exportieren
export function exportData(selectedYear, selectedDate) {
  const teacherData = getTeacherData();
  const currentUser = getCurrentUser();
  
  // Prüflinge basierend auf Auswahl filtern
  let filteredStudents = [...teacherData.students];
  
  if (selectedYear) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === selectedYear);
  }
  
  if (selectedDate) {
    filteredStudents = filteredStudents.filter(s => s.examDate === selectedDate);
  }
  
  if (filteredStudents.length === 0) {
    showNotification("Keine Daten zum Exportieren gefunden.", "warning");
    return;
  }
  
  // Nach Datum sortieren (neueste zuerst)
  filteredStudents.sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
  
  // CSV-Inhalt erstellen
  let csvContent = "Name;Datum;Organisation;Arbeitsverhalten;Zusammenarbeit;Arbeitsqualität;Reflexion;Dokumentation;Durchschnitt;Endnote\n";
  
  filteredStudents.forEach(student => {
    const assessment = teacherData.assessments[student.id] || {};
    const avgGrade = calculateAverageGrade(assessment) || '-';
    const finalGrade = assessment.finalGrade || avgGrade;
    
    csvContent += `${student.name};${formatDate(student.examDate)};`;
    
    // Spalten für jede Bewertungskategorie hinzufügen
    ASSESSMENT_CATEGORIES.forEach(category => {
      const grade = assessment[category.id] || '-';
      csvContent += `${grade};`;
    });
    
    csvContent += `${avgGrade};${finalGrade}\n`;
  });
  
  // Download-Link erstellen
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  
  // Dateinamen basierend auf Auswahl erstellen
  let filename = 'WBS_Bewertungen';
  if (selectedYear) filename += `_${selectedYear}`;
  if (selectedDate) filename += `_${formatDate(selectedDate).replace(/\./g, '')}`;
  filename += `_${currentUser.code}.csv`;
  
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification("Daten wurden exportiert.");
}

// Hilfsfunktion: Jahr aus Datum extrahieren
function getYearFromDate(isoDateString) {
  return isoDateString.split('-')[0];
}