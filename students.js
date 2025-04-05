// students.js

/**
 * Aktualisiert den Studenten-Tab
 */
function updateStudentsTab() {
  if (!studentsTable) return;
  const tbody = studentsTable.querySelector('tbody');
  tbody.innerHTML = '';
  
  if (teacherData.students.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="3">Keine Prüflinge vorhanden</td>';
    tbody.appendChild(tr);
    return;
  }
  
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
      showEditStudentModal(student);
    });
    tbody.appendChild(tr);
  });
}

/**
 * Fügt einen neuen Schüler hinzu
 */
async function addNewStudent() {
  const name = newStudentName.value.trim();
  const date = examDate.value;
  
  if (!name) {
    showNotification("Bitte einen Namen eingeben.", "warning");
    return;
  }
  
  const existingStudent = teacherData.students.find(s => 
    s.name.toLowerCase() === name.toLowerCase() && s.examDate === date
  );
  if (existingStudent) {
    showNotification(`Ein Prüfling namens "${name}" existiert bereits für dieses Datum.`, "warning");
    return;
  }
  
  if (isStudentOnExamDay(null, date)) {
    if (!confirm(`Es existiert bereits ein Prüfling am ${formatDate(date)}. Trotzdem fortfahren?`)) {
      return;
    }
  }
  
  const newStudent = {
    id: generateId(),
    name: name,
    examDate: date,
    createdAt: new Date().toISOString()
  };
  
  showLoader();
  teacherData.students.push(newStudent);
  teacherData.assessments[newStudent.id] = {};
  
  // Standardwerte für alle Bewertungskategorien setzen
  ASSESSMENT_CATEGORIES.forEach(category => {
    teacherData.assessments[newStudent.id][category.id] = 2;
  });
  
  // Leeres Textfeld für Informationen hinzufügen
  teacherData.assessments[newStudent.id].infoText = '';
  
  // Standardwert für Endnote
  teacherData.assessments[newStudent.id].finalGrade = 2.0;
  
  const saved = await saveTeacherData();
  if (saved) {
    // Neu laden, damit die lokalen Daten aktuell sind
    await loadTeacherData();
    newStudentName.value = "";
    examDate.value = defaultDate;
    updateStudentsTab();
    populateAssessmentDateSelect();
    showNotification(`Prüfling "${name}" wurde hinzugefügt.`);
  }
  hideLoader();
}

/**
 * Zeigt das Modal zum Bearbeiten eines Schülers an
 */
function showEditStudentModal(student) {
  selectedStudent = student;
  editStudentName.value = student.name;
  editExamDate.value = student.examDate;
  editStudentModal.style.display = "flex";
}

/**
 * Speichert die Änderungen an einem Schüler
 */
async function saveEditedStudent() {
  if (!selectedStudent) return;
  
  const name = editStudentName.value.trim();
  const date = editExamDate.value;
  
  if (!name) {
    showNotification("Bitte einen Namen eingeben.", "warning");
    return;
  }
  
  const existingStudent = teacherData.students.find(s => 
    s.id !== selectedStudent.id &&
    s.name.toLowerCase() === name.toLowerCase() &&
    s.examDate === date
  );
  
  if (existingStudent) {
    showNotification(`Ein Prüfling namens "${name}" existiert bereits für dieses Datum.`, "warning");
    return;
  }
  
  if (date !== selectedStudent.examDate && isStudentOnExamDay(selectedStudent.id, date)) {
    if (!confirm(`Es existiert bereits ein Prüfling am ${formatDate(date)}. Trotzdem fortfahren?`)) {
      return;
    }
  }
  
  showLoader();
  const index = teacherData.students.findIndex(s => s.id === selectedStudent.id);
  
  if (index !== -1) {
    teacherData.students[index].name = name;
    teacherData.students[index].examDate = date;
    const saved = await saveTeacherData();
    if (saved) {
      // Neu laden, damit die lokalen Daten aktuell sind
      await loadTeacherData();
      updateStudentsTab();
      populateAssessmentDateSelect();
      showNotification(`Prüfling "${name}" wurde aktualisiert.`);
    }
  }
  
  hideLoader();
  editStudentModal.style.display = "none";
}

/**
 * Zeigt die Bestätigung zum Löschen eines Schülers an
 */
function showDeleteConfirmation() {
  if (!selectedStudent) return;
  
  studentToDelete = selectedStudent;
  deleteStudentName.textContent = selectedStudent.name;
  editStudentModal.style.display = "none";
  confirmDeleteModal.style.display = "flex";
}

/**
 * Löscht einen Schüler
 */
async function deleteStudent() {
  if (!studentToDelete) {
    confirmDeleteModal.style.display = "none";
    return;
  }
  
  showLoader();
  teacherData.students = teacherData.students.filter(s => s.id !== studentToDelete.id);
  delete teacherData.assessments[studentToDelete.id];
  
  const saved = await saveTeacherData();
  if (saved) {
    // Neu laden, damit die lokalen Daten aktuell sind
    await loadTeacherData();
    updateStudentsTab();
    populateAssessmentDateSelect();
    updateOverviewTab();
    showNotification(`Prüfling "${studentToDelete.name}" wurde gelöscht.`);
  }
  
  hideLoader();
  confirmDeleteModal.style.display = "none";
  studentToDelete = null;
}

/**
 * Aktualisiert den Übersichts-Tab
 */
function updateOverviewTab() {
  populateOverviewYearSelect();
  populateOverviewDateSelect();
  updateOverviewContent();
}
