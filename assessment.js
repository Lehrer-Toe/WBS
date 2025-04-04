import { showNotification, formatDate, calculateAverageGrade, getAvailableDates } from './utils.js';
import { getTeacherData } from './auth.js';
import { saveTeacherData } from './database.js';
import { ASSESSMENT_CATEGORIES } from './students.js';

// Bewertungs-Datumsauswahl befüllen
export function populateAssessmentDateSelect(assessmentDateSelect) {
  const dates = getAvailableDates();
  
  assessmentDateSelect.innerHTML = '<option value="">Bitte wählen...</option>';
  
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    assessmentDateSelect.appendChild(option);
  });
}

// Bewertungs-Prüflingsliste basierend auf ausgewähltem Datum aktualisieren
export function updateAssessmentStudentList(selectedDate, assessmentStudentList, assessmentContent, showAssessmentFormFn) {
  const teacherData = getTeacherData();
  
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
      // Ausgewählten Prüfling hervorheben
      document.querySelectorAll('.student-item').forEach(item => {
        item.classList.remove('active');
      });
      li.classList.add('active');
      
      // Bewertungsformular anzeigen
      showAssessmentFormFn(student);
    });
    
    assessmentStudentList.appendChild(li);
  });
}

// Bewertungsformular für einen Prüfling anzeigen
export function showAssessmentForm(student, assessmentContent, saveAssessmentFn, updateAssessmentStudentListFn) {
  const teacherData = getTeacherData();
  const assessment = teacherData.assessments[student.id] || {};
  
  // Durchschnittsnote berechnen
  const avgGrade = calculateAverageGrade(assessment);
  const finalGrade = assessment.finalGrade || avgGrade || '-';
  
  let html = `
    <div class="assessment-container">
      <div class="student-header">
        <h2>${student.name}</h2>
        <p>Prüfungsdatum: ${formatDate(student.examDate)}</p>
      </div>
      
      <div class="final-grade-display">Ø ${avgGrade || '0.0'}</div>
      
      <div class="final-grade-input">
        <label for="finalGrade">Endnote:</label>
        <input type="number" id="finalGrade" min="1" max="6" step="0.1" value="${finalGrade !== '-' ? finalGrade : ''}">
        <button id="saveFinalGradeBtn">Speichern</button>
        <button id="useAverageBtn">Durchschnitt übernehmen</button>
      </div>
  `;
  
  // Bewertungskategorien mit kreisförmigen Buttons erstellen
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
    
    // Notenbuttons (0-6)
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
  
  // Event-Listener für Notenbuttons hinzufügen
  document.querySelectorAll(".grade-buttons .grade-button").forEach(btn => {
    btn.addEventListener("click", async () => {
      const category = btn.parentElement.dataset.category;
      const grade = parseInt(btn.dataset.grade);
      
      // Noten-Buttons UI aktualisieren
      const buttons = btn.parentElement.querySelectorAll("button");
      buttons.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      
      // Notenanzeige aktualisieren
      btn.parentElement.previousElementSibling.textContent = grade || '-';
      
      // Daten aktualisieren
      await saveAssessmentFn(student, category, grade);
      
      // Prüflingsliste aktualisieren, um neue Durchschnittsnote anzuzeigen
      updateAssessmentStudentListFn();
    });
  });
  
  // Event-Listener für Speichern-Endnote-Button hinzufügen
  document.getElementById("saveFinalGradeBtn").addEventListener("click", async () => {
    const finalGradeInput = document.getElementById("finalGrade");
    const finalGradeValue = parseFloat(finalGradeInput.value);
    
    if (isNaN(finalGradeValue) || finalGradeValue < 1 || finalGradeValue > 6) {
      showNotification("Bitte geben Sie eine gültige Note zwischen 1 und 6 ein.", "warning");
      return;
    }
    
    // Daten aktualisieren
    await saveAssessmentFn(student, 'finalGrade', finalGradeValue);
    
    // Prüflingsliste aktualisieren
    updateAssessmentStudentListFn();
    
    showNotification("Endnote wurde gespeichert.");
  });
  
  // Event-Listener für Durchschnitt-übernehmen-Button hinzufügen
  document.getElementById("useAverageBtn").addEventListener("click", async () => {
    const teacherData = getTeacherData();
    const avgGrade = calculateAverageGrade(teacherData.assessments[student.id]);
    
    if (!avgGrade) {
      showNotification("Es gibt noch keinen Durchschnitt zum Übernehmen.", "warning");
      return;
    }
    
    // Endnote-Eingabe aktualisieren
    document.getElementById("finalGrade").value = avgGrade;
    
    // Daten aktualisieren
    await saveAssessmentFn(student, 'finalGrade', parseFloat(avgGrade));
    
    // Prüflingsliste aktualisieren
    updateAssessmentStudentListFn();
    
    showNotification("Durchschnitt wurde als Endnote übernommen.");
  });
}

// Bewertung speichern
export async function saveAssessment(student, category, value) {
  const teacherData = getTeacherData();
  const currentUser = getCurrentUser();

  // Daten aktualisieren
  if (!teacherData.assessments[student.id]) {
    teacherData.assessments[student.id] = {};
  }
  
  teacherData.assessments[student.id][category] = value;
  
  // Wenn Endnote noch nicht existiert, auf Durchschnitt setzen
  if (category !== 'finalGrade' && !teacherData.assessments[student.id].finalGrade) {
    const newAvg = calculateAverageGrade(teacherData.assessments[student.id]);
    if (newAvg) {
      teacherData.assessments[student.id].finalGrade = parseFloat(newAvg);
      
      // Wenn Formular geöffnet ist, Endnote-Eingabe aktualisieren
      const finalGradeInput = document.getElementById("finalGrade");
      if (finalGradeInput) {
        finalGradeInput.value = newAvg;
      }
      
      // Durchschnittsanzeige aktualisieren
      const finalGradeDisplay = document.querySelector(".final-grade-display");
      if (finalGradeDisplay) {
        finalGradeDisplay.textContent = `Ø ${newAvg || '0.0'}`;
      }
    }
  }
  
  // Daten speichern
  return await saveTeacherData(currentUser.code, currentUser.name, teacherData);
}

// Noten-Bearbeitungsmodal anzeigen
export function showEditGradeModal(student, editGradeModal, editFinalGrade) {
  const teacherData = getTeacherData();
  const assessment = teacherData.assessments[student.id] || {};
  const finalGrade = assessment.finalGrade || calculateAverageGrade(assessment) || '';
  
  editFinalGrade.value = finalGrade;
  editGradeModal.style.display = "flex";
  
  return student;
}

// Bearbeitete Note speichern
export async function saveEditedGrade(student, finalGradeValue, 
                                     updateOverviewContentFn, updateAssessmentStudentListFn) {
  const teacherData = getTeacherData();
  const currentUser = getCurrentUser();

  if (isNaN(finalGradeValue) || finalGradeValue < 1 || finalGradeValue > 6) {
    showNotification("Bitte geben Sie eine gültige Note zwischen 1 und 6 ein.", "warning");
    return false;
  }
  
  showLoader();
  
  // Daten aktualisieren
  if (!teacherData.assessments[student.id]) {
    teacherData.assessments[student.id] = {};
    
    // Standardnoten setzen, wenn noch nicht gesetzt
    ASSESSMENT_CATEGORIES.forEach(category => {
      teacherData.assessments[student.id][category.id] = 2;
    });
  }
  
  teacherData.assessments[student.id].finalGrade = finalGradeValue;
  
  // Daten speichern
  const saved = await saveTeacherData(currentUser.code, currentUser.name, teacherData);
  
  if (saved) {
    // UI aktualisieren
    updateOverviewContentFn();
    updateAssessmentStudentListFn();
    
    showNotification(`Endnote für "${student.name}" wurde aktualisiert.`);
    hideLoader();
    return true;
  }
  
  hideLoader();
  return false;
}