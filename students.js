import { showNotification, showLoader, hideLoader, formatDate, generateId } from './utils.js';
import { getCurrentUser, getTeacherData } from './auth.js';
import { saveTeacherData } from './database.js';

// Konstanten für Bewertungskategorien
export const ASSESSMENT_CATEGORIES = [
  { id: "organization", name: "Organisation" },
  { id: "workBehavior", name: "Arbeitsverhalten" },
  { id: "teamwork", name: "Zusammenarbeit" },
  { id: "quality", name: "Arbeitsqualität" },
  { id: "reflection", name: "Reflexion" },
  { id: "documentation", name: "Dokumentation" }
];

// Prüfen, ob ein Prüfling bereits an diesem Prüfungstag existiert
export function isStudentOnExamDay(studentId, examDate) {
  const teacherData = getTeacherData();
  return teacherData.students.some(s => 
    s.id !== studentId && s.examDate === examDate
  );
}

// Studenten-Tab aktualisieren
export function updateStudentsTab(studentsTable) {
  const teacherData = getTeacherData();
  const tbody = studentsTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  if (teacherData.students.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="3">Keine Prüflinge vorhanden</td>';
    tbody.appendChild(tr);
    return;
  }
  
  // Prüflinge nach Prüfungsdatum sortieren (neueste zuerst)
  const sortedStudents = [...teacherData.students].sort((a, b) => {
    return new Date(b.examDate) - new Date(a.examDate);
  });
  
  sortedStudents.forEach(student => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${formatDate(student.examDate)}</td>
      <td>
        <button class="edit-btn" data-id="${student.id}">✏️</button>
      </td>
    `;
    
    tr.querySelector('.edit-btn').addEventListener('click', () => {
      // Event-Handler für Bearbeiten-Button hinzufügen
      const event = new CustomEvent('editStudent', { detail: student });
      document.dispatchEvent(event);
    });
    
    tbody.appendChild(tr);
  });
}

// Neuen Prüfling hinzufügen
export async function addNewStudent(name, date, updateStudentsTabFn, populateAssessmentDateSelectFn) {
  const teacherData = getTeacherData();
  const currentUser = getCurrentUser();

  if (!name) {
    showNotification("Bitte geben Sie einen Namen ein.", "warning");
    return false;
  }
  
  // Prüfen, ob Prüfling bereits an diesem Prüfungsdatum existiert
  const existingStudent = teacherData.students.find(s => 
    s.name.toLowerCase() === name.toLowerCase() && s.examDate === date
  );
  
  if (existingStudent) {
    showNotification(`Ein Prüfling mit dem Namen "${name}" existiert bereits für dieses Datum.`, "warning");
    return false;
  }
  
  // Prüfen, ob bereits ein anderer Prüfling diesem Datum zugewiesen ist
  if (isStudentOnExamDay(null, date)) {
    if (!confirm(`Es existiert bereits ein Prüfling für den ${formatDate(date)}. Möchten Sie trotzdem fortfahren?`)) {
      return false;
    }
  }
  
  // Neuen Prüfling erstellen
  const newStudent = {
    id: generateId(),
    name: name,
    examDate: date,
    createdAt: new Date().toISOString()
  };
  
  showLoader();
  
  // Zu Prüflings-Array hinzufügen
  teacherData.students.push(newStudent);
  
  // Bewertung initialisieren
  teacherData.assessments[newStudent.id] = {};
  ASSESSMENT_CATEGORIES.forEach(category => {
    // Standardnote ist 2
    teacherData.assessments[newStudent.id][category.id] = 2;
  });
  
  // Endnote als Durchschnitt setzen
  teacherData.assessments[newStudent.id].finalGrade = 2.0;
  
  // Daten speichern
  const saved = await saveTeacherData(currentUser.code, currentUser.name, teacherData);
  
  if (saved) {
    // UI aktualisieren
    updateStudentsTabFn();
    populateAssessmentDateSelectFn();
    
    showNotification(`Prüfling "${name}" wurde hinzugefügt.`);
    hideLoader();
    return true;
  }
  
  hideLoader();
  return false;
}

// Prüfling bearbeiten
export async function saveEditedStudent(student, name, date, updateStudentsTabFn, populateAssessmentDateSelectFn) {
  const teacherData = getTeacherData();
  const currentUser = getCurrentUser();

  if (!name) {
    showNotification("Bitte geben Sie einen Namen ein.", "warning");
    return false;
  }
  
  // Prüfen, ob das Bearbeiten ein Duplikat erzeugen würde
  const existingStudent = teacherData.students.find(s => 
    s.id !== student.id && 
    s.name.toLowerCase() === name.toLowerCase() && 
    s.examDate === date
  );
  
  if (existingStudent) {
    showNotification(`Ein Prüfling mit dem Namen "${name}" existiert bereits für dieses Datum.`, "warning");
    return false;
  }
  
  // Prüfen, ob bereits ein anderer Prüfling diesem Datum zugewiesen ist
  if (date !== student.examDate && isStudentOnExamDay(student.id, date)) {
    if (!confirm(`Es existiert bereits ein Prüfling für den ${formatDate(date)}. Möchten Sie trotzdem fortfahren?`)) {
      return false;
    }
  }
  
  showLoader();
  
  // Prüfling aktualisieren
  const index = teacherData.students.findIndex(s => s.id === student.id);
  if (index !== -1) {
    teacherData.students[index].name = name;
    teacherData.students[index].examDate = date;
    
    // Daten speichern
    const saved = await saveTeacherData(currentUser.code, currentUser.name, teacherData);
    
    if (saved) {
      // UI aktualisieren
      updateStudentsTabFn();
      populateAssessmentDateSelectFn();
      
      showNotification(`Prüfling "${name}" wurde aktualisiert.`);
      hideLoader();
      return true;
    }
  }
  
  hideLoader();
  return false;
}

// Prüfling löschen
export async function deleteStudent(student, updateStudentsTabFn, populateAssessmentDateSelectFn, updateOverviewTabFn) {
  const teacherData = getTeacherData();
  const currentUser = getCurrentUser();

  if (!student) return false;
  
  showLoader();
  
  // Prüfling entfernen
  teacherData.students = teacherData.students.filter(s => s.id !== student.id);
  
  // Bewertung entfernen
  delete teacherData.assessments[student.id];
  
  // Daten speichern
  const saved = await saveTeacherData(currentUser.code, currentUser.name, teacherData);
  
  if (saved) {
    // UI aktualisieren
    updateStudentsTabFn();
    populateAssessmentDateSelectFn();
    updateOverviewTabFn();
    
    showNotification(`Prüfling "${student.name}" wurde gelöscht.`);
    hideLoader();
    return true;
  }
  
  hideLoader();
  return false;
}