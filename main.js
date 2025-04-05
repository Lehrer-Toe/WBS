// Event-Listener hinzufügen, wenn DOM geladen ist
document.addEventListener("DOMContentLoaded", function() {
  console.log("WBS Bewertungssystem wird initialisiert...");
  init();
});

/**
 * Initialisiert die Anwendung
 */
async function init() {
  if (examDate) {
    examDate.value = defaultDate;
  }
  
  // Datenbank initialisieren
  await initDatabase();
  initTeacherGrid();
  setupEventListeners();
  
  hideLoader();
}

/**
 * Richtet alle Event-Listener ein
 */
function setupEventListeners() {
  // Login-Bereich
  if (closePasswordModal) {
    closePasswordModal.addEventListener("click", () => {
      passwordModal.style.display = "none";
    });
  }
  if (cancelLogin) {
    cancelLogin.addEventListener("click", () => {
      passwordModal.style.display = "none";
    });
  }
  if (confirmLogin) {
    confirmLogin.addEventListener("click", login);
  }
  if (passwordInput) {
    passwordInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") login();
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
  
  // Tabs
  setupTabEventListeners();
  
  // Schüler-Tab
  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", addNewStudent);
  }
  
  // Bewertungs-Tab
  if (assessmentDateSelect) {
    assessmentDateSelect.addEventListener("change", updateAssessmentStudentList);
  }
  
  // Übersichts-Tab
  if (overviewYearSelect) {
    overviewYearSelect.addEventListener("change", () => {
      populateOverviewDateSelect();
      updateOverviewContent();
    });
  }
  if (overviewDateSelect) {
    overviewDateSelect.addEventListener("change", updateOverviewContent);
  }
  
  // Einstellungs-Tab
  if (settingsYearSelect) {
    settingsYearSelect.addEventListener("change", () => {
      populateSettingsDateSelect();
    });
  }
  if (exportDataBtn) {
    exportDataBtn.addEventListener("click", exportData);
  }
  if (deleteDataBtn) {
    deleteDataBtn.addEventListener("click", confirmDeleteAllData);
  }
  
  // Modals
  if (closeEditStudentModal) {
    closeEditStudentModal.addEventListener("click", () => {
      editStudentModal.style.display = "none";
    });
  }
  if (saveStudentBtn) {
    saveStudentBtn.addEventListener("click", saveEditedStudent);
  }
  if (deleteStudentBtn) {
    deleteStudentBtn.addEventListener("click", showDeleteConfirmation);
  }
  
  if (closeEditGradeModal) {
    closeEditGradeModal.addEventListener("click", () => {
      editGradeModal.style.display = "none";
    });
  }
  if (saveGradeBtn) {
    saveGradeBtn.addEventListener("click", saveEditedGrade);
  }
  
  if (closeConfirmDeleteModal) {
    closeConfirmDeleteModal.addEventListener("click", () => {
      confirmDeleteModal.style.display = "none";
    });
  }
  if (cancelDeleteBtn) {
    cancelDeleteBtn.addEventListener("click", () => {
      confirmDeleteModal.style.display = "none";
    });
  }
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener("click", deleteStudent);
  }
}