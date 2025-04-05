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
    newStudentName.value = "";
    examDate.value = defaultDate;
    updateStudentsTab();
    populateAssessmentDateSelect();
    showNotification(`Prüfling "${name}" wurde hinzugefügt.`);
  }
  hideLoader();
}

/**
 * Speichert die Änderungen an einem Schüler
 */
async function saveEditedStudent() {
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
      updateStudentsTab();
      populateAssessmentDateSelect();
      showNotification(`Prüfling "${name}" wurde aktualisiert.`);
    }
  }
  hideLoader();
  editStudentModal.style.display = "none";
}

/**
 * Löscht einen Schüler
 */
async function deleteStudent() {
  if (!studentToDelete) return;
  showLoader();
  teacherData.students = teacherData.students.filter(s => s.id !== studentToDelete.id);
  delete teacherData.assessments[studentToDelete.id];
  const saved = await saveTeacherData();
  if (saved) {
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

/**
 * Füllt das Jahr-Dropdown in der Übersicht
 */
function populateOverviewYearSelect() {
  if (!overviewYearSelect) return;
  const years = getAvailableYears();
  overviewYearSelect.innerHTML = '<option value="">Alle Jahre</option>';
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    overviewYearSelect.appendChild(option);
  });
}

/**
 * Füllt das Datum-Dropdown in der Übersicht
 */
function populateOverviewDateSelect() {
  if (!overviewDateSelect) return;
  const selectedYear = overviewYearSelect.value;
  const dates = getAvailableDates(selectedYear);
  overviewDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    overviewDateSelect.appendChild(option);
  });
}

/**
 * Aktualisiert den Inhalt der Übersicht
 */
function updateOverviewContent() {
  if (!overviewTable) return;
  const selectedYear = overviewYearSelect.value;
  const selectedDate = overviewDateSelect.value;
  const tbody = overviewTable.querySelector('tbody');
  tbody.innerHTML = '';
  let filteredStudents = [...teacherData.students];
  if (selectedYear) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === selectedYear);
  }
  if (selectedDate) {
    filteredStudents = filteredStudents.filter(s => s.examDate === selectedDate);
  }
  filteredStudents.sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
  if (filteredStudents.length === 0) {
    const tr = document.createElement('tr');
    tr.innerHTML = '<td colspan="12">Keine Prüflinge gefunden</td>';
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
      <td>${assessment.presentation || '-'}</td>
      <td>${assessment.content || '-'}</td>
      <td>${assessment.language || '-'}</td>
      <td>${assessment.impression || '-'}</td>
      <td>${assessment.examination || '-'}</td>
      <td>${assessment.reflection || '-'}</td>
      <td>${assessment.expertise || '-'}</td>
      <td>${assessment.documentation || '-'}</td>
      <td>${finalGrade}</td>
      <td>
        <button class="edit-btn" data-id="${student.id}">✏️</button>
      </td>
    `;
    tr.querySelector('.edit-btn').addEventListener('click', () => {
      showEditGradeModal(student);
    });
    tbody.appendChild(tr);
  });
}

/**
 * Aktualisiert den Einstellungs-Tab
 */
function updateSettingsTab() {
  populateSettingsYearSelect();
}

/**
 * Füllt das Jahr-Dropdown in den Einstellungen
 */
function populateSettingsYearSelect() {
  if (!settingsYearSelect) return;
  const years = getAvailableYears();
  settingsYearSelect.innerHTML = '<option value="">Alle Jahre</option>';
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    settingsYearSelect.appendChild(option);
  });
}

/**
 * Füllt das Datum-Dropdown in den Einstellungen
 */
function populateSettingsDateSelect() {
  if (!settingsDateSelect) return;
  const selectedYear = settingsYearSelect.value;
  const dates = getAvailableDates(selectedYear);
  settingsDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    settingsDateSelect.appendChild(option);
  });
}

/**
 * Bestätigt das Löschen aller Daten
 */
function confirmDeleteAllData() {
  const code = deleteVerificationCode.value.trim();
  if (!code || code !== currentUser.code) {
    showNotification("Falsches oder kein Lehrerkürzel.", "warning");
    return;
  }
  if (!confirm("Wirklich ALLE Daten löschen?")) {
    return;
  }
  deleteAllData();
}

/**
 * Löscht alle Daten des aktuellen Lehrers
 */
async function deleteAllData() {
  showLoader();
  teacherData = {
    students: [],
    assessments: {}
  };
  const saved = await saveTeacherData();
  if (saved) {
    updateStudentsTab();
    updateAssessmentTab();
    updateOverviewTab();
    showNotification("Alle Daten wurden gelöscht.");
  }
  hideLoader();
}