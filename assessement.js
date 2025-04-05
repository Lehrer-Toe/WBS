/**
 * Aktualisiert den Bewertungs-Tab
 */
function updateAssessmentTab() {
  populateAssessmentDateSelect();
  updateAssessmentStudentList();
}

/**
 * Füllt das Datum-Dropdown im Bewertungs-Tab
 */
function populateAssessmentDateSelect() {
  if (!assessmentDateSelect) return;
  const dates = getAvailableDates();
  assessmentDateSelect.innerHTML = '<option value="">Bitte wählen...</option>';
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    assessmentDateSelect.appendChild(option);
  });
}

/**
 * Aktualisiert die Schülerliste im Bewertungs-Tab
 */
function updateAssessmentStudentList() {
  if (!assessmentStudentList || !assessmentContent) return;
  const selectedDate = assessmentDateSelect.value;
  assessmentStudentList.innerHTML = '';
  if (!selectedDate) {
    assessmentStudentList.innerHTML = '<li>Bitte wählen Sie ein Datum</li>';
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Willkommen bei der WBS Bewertungsapp</h2>
        <p>Bitte wählen Sie einen Prüfungstag und Prüfling aus der Liste oder legen Sie einen neuen Prüfling an.</p>
      </div>
    `;
    return;
  }
  const studentsForDate = teacherData.students.filter(s => s.examDate === selectedDate);
  if (studentsForDate.length === 0) {
    assessmentStudentList.innerHTML = '<li>Keine Prüflinge für dieses Datum</li>';
    return;
  }
  studentsForDate.forEach(student => {
    const li = document.createElement('li');
    li.className = 'student-item';
    li.dataset.id = student.id;
    const assessment = teacherData.assessments[student.id] || {};
    const finalGrade = assessment.finalGrade || '-';
    li.innerHTML = `
      <div class="student-name">${student.name}</div>
      <div class="average-grade grade-${Math.round(finalGrade)}">${finalGrade}</div>
    `;
    li.addEventListener('click', () => {
      document.querySelectorAll('.student-item').forEach(item => {
        item.classList.remove('active');
      });
      li.classList.add('active');
      showAssessmentForm(student);
    });
    assessmentStudentList.appendChild(li);
  });
}

/**
 * Einrichten des Autosave-Timers für den Informationstext
 */
function setupInfoTextAutoSave(studentId) {
  // Bestehenden Timer löschen, falls vorhanden
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
  }
  
  // Neuen Timer einrichten
  infoTextSaveTimer = setInterval(async () => {
    const infoTextArea = document.getElementById("studentInfoText");
    if (infoTextArea && infoTextArea.dataset.changed === "true") {
      const infoText = infoTextArea.value;
      
      // Speichere den Text in der Datenstruktur
      if (teacherData.assessments[studentId]) {
        teacherData.assessments[studentId].infoText = infoText;
        await saveTeacherData();
        infoTextArea.dataset.changed = "false";
        
        // Kleine Benachrichtigung, dass gespeichert wurde
        showNotification("Informationstext wurde automatisch gespeichert.", "success");
        infoTextArea.classList.add('save-flash');
        setTimeout(() => {
          infoTextArea.classList.remove('save-flash');
        }, 1000);
      }
    }
  }, 60000); // Alle 60 Sekunden speichern
}

/**
 * Zeigt das Bewertungsformular für einen Schüler an
 */
function showAssessmentForm(student) {
  selectedStudent = student;
  const assessment = teacherData.assessments[student.id] || {};
  const avgGrade = calculateAverageGrade(assessment);
  const finalGrade = assessment.finalGrade || avgGrade || '-';
  const infoText = assessment.infoText || '';
  
  let html = `
    <div class="assessment-container">
      <div class="student-header">
        <h2>${student.name}</h2>
        <p>Prüfungsdatum: ${formatDate(student.examDate)}</p>
      </div>
      
      <div class="info-text-container">
        <h3>Informationen zum Prüfling</h3>
        <textarea id="studentInfoText" rows="6" placeholder="Notizen zum Prüfling eingeben...">${infoText}</textarea>
      </div>
      
      <div class="final-grade-display">Ø ${avgGrade || '0.0'}</div>
      
      <div class="final-grade-input">
        <label for="finalGrade">Endnote:</label>
        <input type="number" id="finalGrade" min="1" max="6" step="0.1" value="${finalGrade !== '-' ? finalGrade : ''}">
        <button id="saveFinalGradeBtn">Speichern</button>
        <button id="useAverageBtn">Durchschnitt übernehmen</button>
      </div>
  `;
  
  ASSESSMENT_CATEGORIES.forEach(category => {
    const grade = assessment[category.id] || 0;
    html += `
      <div class="assessment-category">
        <div class="category-header">
          <h3>${category.name}</h3>
        </div>
        <div class="category-grade">${grade || '-'}</div>
        <div class="grade-buttons" data-category="${category.id}">
    `;
    for (let i = 0; i <= 6; i++) {
      const isSelected = grade === i;
      html += `
        <button class="grade-button grade-${i} ${isSelected ? 'selected' : ''}" data-grade="${i}">${i}</button>
      `;
    }
    html += `
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  assessmentContent.innerHTML = html;
  
  // Eventlistener für Notenwahl-Buttons
  document.querySelectorAll(".grade-buttons .grade-button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const category = btn.parentElement.dataset.category;
      const grade = parseInt(btn.dataset.grade);
      const buttons = btn.parentElement.querySelectorAll("button");
      buttons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      btn.parentElement.previousElementSibling.textContent = grade || '-';
      if (!teacherData.assessments[student.id]) {
        teacherData.assessments[student.id] = {};
      }
      teacherData.assessments[student.id][category] = grade;
      const newAvg = calculateAverageGrade(teacherData.assessments[student.id]);
      document.querySelector(".final-grade-display").textContent = `Ø ${newAvg || '0.0'}`;
      if (!teacherData.assessments[student.id].finalGrade) {
        teacherData.assessments[student.id].finalGrade = parseFloat(newAvg);
        const fgInput = document.getElementById("finalGrade");
        if (fgInput) fgInput.value = newAvg;
      }
      await saveTeacherData();
      updateAssessmentStudentList();
    });
  });
  
  // Eventlistener für Endnote
  const saveFinalGradeBtn = document.getElementById("saveFinalGradeBtn");
  if (saveFinalGradeBtn) {
    saveFinalGradeBtn.addEventListener("click", async () => {
      const finalGradeInput = document.getElementById("finalGrade");
      const finalGradeValue = parseFloat(finalGradeInput.value);
      if (isNaN(finalGradeValue) || finalGradeValue < 1 || finalGradeValue > 6) {
        showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
        return;
      }
      teacherData.assessments[student.id].finalGrade = finalGradeValue;
      await saveTeacherData();
      updateAssessmentStudentList();
      showNotification("Endnote wurde gespeichert.");
    });
  }
  
  // Eventlistener für Durchschnitt-Button
  const useAverageBtn = document.getElementById("useAverageBtn");
  if (useAverageBtn) {
    useAverageBtn.addEventListener("click", async () => {
      const avgGrade = calculateAverageGrade(teacherData.assessments[student.id]);
      if (!avgGrade) {
        showNotification("Es gibt noch keinen Durchschnitt.", "warning");
        return;
      }
      document.getElementById("finalGrade").value = avgGrade;
      teacherData.assessments[student.id].finalGrade = parseFloat(avgGrade);
      await saveTeacherData();
      updateAssessmentStudentList();
      showNotification("Durchschnitt als Endnote übernommen.");
    });
  }
  
  // Event-Listeners für den Informationstext mit Autosave
  const infoTextArea = document.getElementById("studentInfoText");
  if (infoTextArea) {
    infoTextArea.dataset.changed = "false";
    
    infoTextArea.addEventListener("input", () => {
      infoTextArea.dataset.changed = "true";
    });
    
    infoTextArea.addEventListener("blur", async () => {
      if (infoTextArea.dataset.changed === "true") {
        teacherData.assessments[student.id].infoText = infoTextArea.value;
        await saveTeacherData();
        infoTextArea.dataset.changed = "false";
        showNotification("Informationstext gespeichert.");
      }
    });
    
    // Autosave einrichten
    setupInfoTextAutoSave(student.id);
  }
}

/**
 * Speichert eine bearbeitete Note
 */
async function saveEditedGrade() {
  const finalGradeValue = parseFloat(editFinalGrade.value);
  if (isNaN(finalGradeValue) || finalGradeValue < 1 || finalGradeValue > 6) {
    showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
    return;
  }
  showLoader();
  if (!teacherData.assessments[selectedGradeStudent.id]) {
    teacherData.assessments[selectedGradeStudent.id] = {};
    ASSESSMENT_CATEGORIES.forEach(category => {
      teacherData.assessments[selectedGradeStudent.id][category.id] = 2;
    });
  }
  teacherData.assessments[selectedGradeStudent.id].finalGrade = finalGradeValue;
  const saved = await saveTeacherData();
  if (saved) {
    updateOverviewContent();
    updateAssessmentStudentList();
    showNotification(`Endnote für "${selectedGradeStudent.name}" wurde aktualisiert.`);
  }
  hideLoader();
  editGradeModal.style.display = "none";
  selectedGradeStudent = null;
}