/**
 * Main application script for WBS Bewertungssystem
 * Initializes the application and manages global functionality
 */

document.addEventListener("DOMContentLoaded", async function() {
  console.log("WBS Bewertungssystem wird initialisiert...");
  
  // DOM-Elemente
  const mainLoader = document.getElementById("mainLoader");
  const loginSection = document.getElementById("loginSection");
  const appSection = document.getElementById("appSection");
  const teacherGrid = document.getElementById("teacherGrid");
  const teacherAvatar = document.getElementById("teacherAvatar");
  const teacherName = document.getElementById("teacherName");
  const passwordModal = document.getElementById("passwordModal");
  const passwordInput = document.getElementById("passwordInput");
  const loginPrompt = document.getElementById("loginPrompt");
  const confirmLogin = document.getElementById("confirmLogin");
  const cancelLogin = document.getElementById("cancelLogin");
  const closePasswordModal = document.getElementById("closePasswordModal");
  const logoutBtn = document.getElementById("logoutBtn");
  
  const newStudentName = document.getElementById("newStudentName");
  const examDate = document.getElementById("examDate");
  const addStudentBtn = document.getElementById("addStudentBtn");
  const studentsTable = document.getElementById("studentsTable");
  
  const assessmentDateSelect = document.getElementById("assessmentDateSelect");
  const assessmentStudentList = document.getElementById("assessmentStudentList");
  const assessmentContent = document.getElementById("assessmentContent");
  
  const overviewYearSelect = document.getElementById("overviewYearSelect");
  const overviewDateSelect = document.getElementById("overviewDateSelect");
  const overviewTable = document.getElementById("overviewTable");
  
  const settingsYearSelect = document.getElementById("settingsYearSelect");
  const settingsDateSelect = document.getElementById("settingsDateSelect");
  const exportDataBtn = document.getElementById("exportDataBtn");
  const deleteVerificationCode = document.getElementById("deleteVerificationCode");
  const deleteDataBtn = document.getElementById("deleteDataBtn");
  
  const editStudentModal = document.getElementById("editStudentModal");
  const closeEditStudentModal = document.getElementById("closeEditStudentModal");
  const editStudentName = document.getElementById("editStudentName");
  const editExamDate = document.getElementById("editExamDate");
  const saveStudentBtn = document.getElementById("saveStudentBtn");
  const deleteStudentBtn = document.getElementById("deleteStudentBtn");
  
  const editGradeModal = document.getElementById("editGradeModal");
  const closeEditGradeModal = document.getElementById("closeEditGradeModal");
  const editFinalGrade = document.getElementById("editFinalGrade");
  const saveGradeBtn = document.getElementById("saveGradeBtn");
  
  const confirmDeleteModal = document.getElementById("confirmDeleteModal");
  const closeConfirmDeleteModal = document.getElementById("closeConfirmDeleteModal");
  const deleteStudentName = document.getElementById("deleteStudentName");
  const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");
  const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
  
  const tabs = document.querySelectorAll(".tab");
  const tabContents = document.querySelectorAll(".tab-content");
  
  // Standardwerte
  const defaultDate = new Date().toISOString().split('T')[0];
  
  /**
   * Zeigt eine Benachrichtigung an
   */
  function showNotification(message, type = "success") {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
  
  /**
   * Zeigt den Ladebildschirm an
   */
  function showLoader() {
    if (mainLoader) {
      mainLoader.style.display = "flex";
    }
  }
  
  /**
   * Versteckt den Ladebildschirm
   */
  function hideLoader() {
    if (mainLoader) {
      mainLoader.style.display = "none";
    }
  }
  
  /**
   * Formatiert ein ISO-Datumstring in deutsches Format
   */
  function formatDate(isoDateString) {
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
   * Gibt die verfügbaren Jahre zurück
   */
  function getAvailableYears() {
    const years = new Set();
    for (let i = 2025; i >= 2020; i--) {
      years.add(i.toString());
    }
    teacherData.students.forEach(student => {
      years.add(getYearFromDate(student.examDate));
    });
    return Array.from(years).sort();
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
   * Generiert eine eindeutige ID
   */
  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
  
  /**
   * Prüft, ob bereits ein Student an einem Prüfungstag existiert
   */
  function isStudentOnExamDay(studentId, examDate) {
    return teacherData.students.some(s => s.id !== studentId && s.examDate === examDate);
  }
  
  /**
   * Initialisiert die Anwendung
   */
  async function init() {
    if (examDate) {
      examDate.value = defaultDate;
    }
    
    // Datenbankverbindung initialisieren
    const dbInitialized = await initDatabase();
    
    if (dbInitialized) {
      initTeacherGrid();
      setupEventListeners();
    } else {
      showNotification("Fehler bei der Datenbankinitialisierung. Bitte Seite neu laden.", "error");
    }
    
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
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        const tabId = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove("active"));
        tabContents.forEach(c => c.classList.remove("active"));
        tab.classList.add("active");
        document.getElementById(`${tabId}-tab`).classList.add("active");
        switch(tabId) {
          case 'students':
            updateStudentsTab();
            break;
          case 'assessment':
            updateAssessmentTab();
            break;
          case 'overview':
            updateOverviewTab();
            break;
          case 'settings':
            updateSettingsTab();
            break;
        }
      });
    });
    
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
  
  // Anwendung initialisieren
  init();
});