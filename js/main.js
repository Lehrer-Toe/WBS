// js/main.js

import { initDatabase } from "./supabaseClient.js";
import {
  teacherData,
  currentUser,
  loadTeacherData,
  saveTeacherData
} from "./dataService.js";
import {
  showLoader,
  hideLoader,
  showNotification,
  formatDate,
  getAvailableDates,
  getAvailableTopics,
  getAvailableYears,
  calculateAverageGrade,
  initTeacherGrid
} from "./uiService.js";
import { ASSESSMENT_CATEGORIES, DEFAULT_TEACHERS } from "./constants.js";

// Globale Zustände
let selectedStudent = null;
let studentToDelete = null;
let selectedGradeStudent = null;
let infoTextSaveTimer = null;
let lastSelectedDate = null;
let lastSelectedTopic = null;
let currentSelectedStudentId = null;
let stickyAverageElement = null; // Für die Sticky-Durchschnittsanzeige

// DOM-Elemente
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
const newStudentTopic = document.getElementById("newStudentTopic");
const examDate = document.getElementById("examDate");
const addStudentBtn = document.getElementById("addStudentBtn");
const studentsTable = document.getElementById("studentsTable");

const assessmentDateSelect = document.getElementById("assessmentDateSelect");
const assessmentTopicSelect = document.getElementById("assessmentTopicSelect");
const assessmentStudentList = document.getElementById("assessmentStudentList");
const assessmentContent = document.getElementById("assessmentContent");

const overviewYearSelect = document.getElementById("overviewYearSelect");
const overviewDateSelect = document.getElementById("overviewDateSelect");
const overviewTopicSelect = document.getElementById("overviewTopicSelect");
const overviewTable = document.getElementById("overviewTable");
const printBtn = document.getElementById("printBtn");

const settingsYearSelect = document.getElementById("settingsYearSelect");
const settingsDateSelect = document.getElementById("settingsDateSelect");
const exportDataBtn = document.getElementById("exportDataBtn");
const deleteVerificationCode = document.getElementById("deleteVerificationCode");
const deleteDataBtn = document.getElementById("deleteDataBtn");

const editStudentModal = document.getElementById("editStudentModal");
const closeEditStudentModal = document.getElementById("closeEditStudentModal");
const editStudentName = document.getElementById("editStudentName");
const editStudentTopic = document.getElementById("editStudentTopic");
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

const today = new Date();
const defaultDate =
  today.getFullYear() +
  "-" +
  String(today.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(today.getDate()).padStart(2, "0");

// Start
document.addEventListener("DOMContentLoaded", async () => {
  console.log("WBS Bewertungssystem wird initialisiert...");
  showLoader();
  try {
    await initDatabase();
    initTeacherGrid(teacherGrid, showPasswordModal);
    setupEventListeners();
    if (examDate) {
      examDate.value = defaultDate;
    }
    createStickyAverageElement();
  } catch (error) {
    console.error("Fehler bei der Initialisierung:", error);
    showNotification("Fehler bei der Initialisierung. Bitte Seite neu laden.", "error");
  } finally {
    hideLoader();
  }
});

// Erstellt das Element für die schwebende Durchschnittsanzeige
function createStickyAverageElement() {
  stickyAverageElement = document.createElement("div");
  stickyAverageElement.className = "sticky-average";
  stickyAverageElement.textContent = "Ø 0.0";
  document.body.appendChild(stickyAverageElement);

  // Scroll-Event-Listener für die Sticky-Anzeige
  window.addEventListener("scroll", () => {
    if (!assessmentContent) return;
    if (!assessmentContent.querySelector(".final-grade-display")) return;
    
    const rect = assessmentContent.querySelector(".final-grade-display").getBoundingClientRect();
    if (rect.top < 0) {
      stickyAverageElement.style.display = "block";
    } else {
      stickyAverageElement.style.display = "none";
    }
  });
}

// Zeigt den Passwortdialog
function showPasswordModal(teacher) {
  loginPrompt.textContent = `Bitte das Passwort für ${teacher.name} eingeben:`;
  passwordInput.value = "";
  passwordModal.style.display = "flex";
  passwordInput.focus();
  currentUser.name = teacher.name;
  currentUser.code = teacher.code;
  currentUser.password = teacher.password;
}

// Initialisiert alle nötigen Event-Listener
function setupEventListeners() {
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
      if (e.key === "Enter") {
        login();
      }
    });
  }
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const tabId = tab.dataset.tab;
      tabs.forEach((t) => t.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`${tabId}-tab`).classList.add("active");
      switch (tabId) {
        case "students":
          updateStudentsTab();
          break;
        case "assessment":
          updateAssessmentTab();
          break;
        case "overview":
          updateOverviewTab();
          break;
        case "settings":
          updateSettingsTab();
          break;
      }
    });
  });

  if (addStudentBtn) {
    addStudentBtn.addEventListener("click", addNewStudent);
  }

  if (assessmentDateSelect) {
    assessmentDateSelect.addEventListener("change", () => {
      lastSelectedDate = assessmentDateSelect.value;
      populateAssessmentTopicSelect();
      updateAssessmentStudentList();
    });
  }
  if (assessmentTopicSelect) {
    assessmentTopicSelect.addEventListener("change", () => {
      lastSelectedTopic = assessmentTopicSelect.value;
      updateAssessmentStudentList();
    });
  }

  if (overviewYearSelect) {
    overviewYearSelect.addEventListener("change", () => {
      populateOverviewDateSelect();
      populateOverviewTopicSelect();
      updateOverviewContent();
    });
  }
  if (overviewDateSelect) {
    overviewDateSelect.addEventListener("change", updateOverviewContent);
  }
  if (overviewTopicSelect) {
    overviewTopicSelect.addEventListener("change", updateOverviewContent);
  }
  if (printBtn) {
    printBtn.addEventListener("click", printOverviewData);
  }

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

// Generiert eine eindeutige ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Führt den Login aus
async function login() {
  if (passwordInput.value === currentUser.password) {
    passwordModal.style.display = "none";
    showLoader();
    await loadTeacherData();
    loginSection.style.display = "none";
    appSection.style.display = "block";
    teacherAvatar.textContent = currentUser.code.charAt(0);
    teacherName.textContent = currentUser.name;
    updateStudentsTab();
    hideLoader();
    showNotification(`Willkommen, ${currentUser.name}!`);
  } else {
    showNotification("Falsches Passwort!", "error");
  }
}

// Logout
function logout() {
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
    infoTextSaveTimer = null;
  }
  currentUser.name = null;
  currentUser.code = null;
  currentUser.password = null;
  teacherData.students = [];
  teacherData.assessments = {};
  loginSection.style.display = "block";
  appSection.style.display = "none";
  showNotification("Abmeldung erfolgreich.");
}

// Aktualisiert den "Schüler anlegen"-Tab
function updateStudentsTab() {
  if (!studentsTable) return;
  const tbody = studentsTable.querySelector("tbody");
  tbody.innerHTML = "";
  if (teacherData.students.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="4">Keine Prüflinge vorhanden</td>';
    tbody.appendChild(tr);
    return;
  }
  const sorted = [...teacherData.students].sort(
    (a, b) => new Date(b.examDate) - new Date(a.examDate)
  );
  sorted.forEach((student) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${formatDate(student.examDate)}</td>
      <td>${student.topic || "-"}</td>
      <td>
        <button class="edit-btn" data-id="${student.id}">✏️</button>
      </td>
    `;
    tr.querySelector(".edit-btn").addEventListener("click", () => {
      showEditStudentModal(student);
    });
    tbody.appendChild(tr);
  });
}

// Neuen Prüfling hinzufügen
async function addNewStudent() {
  const name = newStudentName.value.trim();
  const date = examDate.value;
  const topic = newStudentTopic ? newStudentTopic.value.trim() : "";
  
  lastSelectedDate = date;
  if (topic) {
    lastSelectedTopic = topic;
  }
  
  if (!name) {
    showNotification("Bitte einen Namen eingeben.", "warning");
    return;
  }
  
  const existing = teacherData.students.find(
    (s) => s.name.toLowerCase() === name.toLowerCase() && s.examDate === date
  );
  
  if (existing) {
    showNotification(`Prüfling "${name}" existiert bereits.`, "warning");
    return;
  }
  
  showLoader();
  const newId = generateId();
  const newStudent = {
    id: newId,
    name: name,
    examDate: date,
    topic: topic,
    createdAt: new Date().toISOString()
  };
  
  teacherData.students.push(newStudent);
  teacherData.assessments[newId] = {};
  
  // Standardnoten setzen
  ASSESSMENT_CATEGORIES.forEach(category => {
    teacherData.assessments[newId][category.id] = 2;
  });
  teacherData.assessments[newId].infoText = "";
  teacherData.assessments[newId].finalGrade = 2.0;

  const saved = await saveTeacherData();
  hideLoader();
  if (saved) {
    newStudentName.value = "";
    if (newStudentTopic) newStudentTopic.value = "";
    examDate.value = lastSelectedDate;
    updateStudentsTab();
    populateAssessmentDateSelect();
    populateAssessmentTopicSelect();
    populateOverviewTopicSelect();
    showNotification(`Prüfling "${name}" wurde hinzugefügt.`);
  }
}

// Zeigt das Modal zum Bearbeiten eines Prüflings
function showEditStudentModal(student) {
  editStudentName.value = student.name;
  editExamDate.value = student.examDate;
  if (editStudentTopic) {
    editStudentTopic.value = student.topic || "";
  }
  selectedStudent = student;
  editStudentModal.style.display = "flex";
}

// Speichert Änderungen am Prüfling
async function saveEditedStudent() {
  if (!selectedStudent) return;
  
  const name = editStudentName.value.trim();
  const date = editExamDate.value;
  const topic = editStudentTopic ? editStudentTopic.value.trim() : "";
  
  if (date !== selectedStudent.examDate) {
    lastSelectedDate = date;
  }
  if (topic && topic !== selectedStudent.topic) {
    lastSelectedTopic = topic;
  }
  
  if (!name) {
    showNotification("Bitte einen Namen eingeben.", "warning");
    return;
  }
  
  const existing = teacherData.students.find(
    (s) =>
      s.id !== selectedStudent.id &&
      s.name.toLowerCase() === name.toLowerCase() &&
      s.examDate === date
  );
  
  if (existing) {
    showNotification(`Prüfling "${name}" existiert bereits.`, "warning");
    return;
  }
  
  showLoader();
  selectedStudent.name = name;
  selectedStudent.examDate = date;
  selectedStudent.topic = topic;
  
  const saved = await saveTeacherData();
  hideLoader();
  if (saved) {
    updateStudentsTab();
    populateAssessmentDateSelect();
    populateAssessmentTopicSelect();
    populateOverviewTopicSelect();
    showNotification(`Prüfling "${name}" wurde aktualisiert.`);
    editStudentModal.style.display = "none";
  }
}

// Bestätigung zum Löschen
function showDeleteConfirmation() {
  studentToDelete = selectedStudent;
  deleteStudentName.textContent = studentToDelete.name;
  editStudentModal.style.display = "none";
  confirmDeleteModal.style.display = "flex";
}

// Löscht einen Prüfling
async function deleteStudent() {
  if (!studentToDelete) return;
  showLoader();
  teacherData.students = teacherData.students.filter((s) => s.id !== studentToDelete.id);
  delete teacherData.assessments[studentToDelete.id];
  const saved = await saveTeacherData();
  hideLoader();
  if (saved) {
    updateStudentsTab();
    populateAssessmentDateSelect();
    populateAssessmentTopicSelect();
    updateOverviewTab();
    showNotification(`Prüfling "${studentToDelete.name}" wurde gelöscht.`);
    confirmDeleteModal.style.display = "none";
    studentToDelete = null;
  }
}

// Bewertungs-Tab
function updateAssessmentTab() {
  populateAssessmentDateSelect();
  populateAssessmentTopicSelect();
  updateAssessmentStudentList();
}

function populateAssessmentDateSelect() {
  if (!assessmentDateSelect) return;
  const dates = getAvailableDates();
  assessmentDateSelect.innerHTML = '<option value="">Alle Termine</option>';
  if (dates.length === 0) return;
  let defaultVal = null;
  if (lastSelectedDate && dates.includes(lastSelectedDate)) {
    defaultVal = lastSelectedDate;
  } else if (dates.includes(defaultDate)) {
    defaultVal = defaultDate;
  } else if (dates.length > 0) {
    defaultVal = dates[0];
  }
  dates.forEach((date) => {
    const option = document.createElement("option");
    option.value = date;
    option.textContent = formatDate(date);
    if (date === defaultVal) {
      option.selected = true;
    }
    assessmentDateSelect.appendChild(option);
  });
  if (assessmentDateSelect.value) {
    lastSelectedDate = assessmentDateSelect.value;
  }
}

function populateAssessmentTopicSelect() {
  if (!assessmentTopicSelect) return;
  const selectedDate = assessmentDateSelect.value;
  const topics = getAvailableTopics(selectedDate);
  assessmentTopicSelect.innerHTML = '<option value="">Alle Themen</option>';
  if (topics.length === 0) return;
  let defaultTopic = null;
  if (lastSelectedTopic && topics.includes(lastSelectedTopic)) {
    defaultTopic = lastSelectedTopic;
  }
  topics.forEach((topic) => {
    const option = document.createElement("option");
    option.value = topic;
    option.textContent = topic;
    if (topic === defaultTopic) {
      option.selected = true;
    }
    assessmentTopicSelect.appendChild(option);
  });
  if (assessmentTopicSelect.value) {
    lastSelectedTopic = assessmentTopicSelect.value;
  }
}

function updateAssessmentStudentList() {
  if (!assessmentStudentList || !assessmentContent) return;
  const selectedDate = assessmentDateSelect.value;
  const selectedTopic = assessmentTopicSelect ? assessmentTopicSelect.value : "";
  
  assessmentStudentList.innerHTML = "";
  
  if (!selectedDate && !selectedTopic) {
    assessmentStudentList.innerHTML = "<li>Bitte Datum oder Thema wählen</li>";
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Willkommen bei der WBS Bewertungsapp</h2>
        <p>Bitte einen Prüfungstag oder ein Thema wählen und anschließend einen Prüfling aus der Liste auswählen.</p>
      </div>
    `;
    currentSelectedStudentId = null;
    return;
  }
  
  let filtered = teacherData.students;
  if (selectedDate) {
    filtered = filtered.filter((s) => s.examDate === selectedDate);
  }
  if (selectedTopic) {
    filtered = filtered.filter((s) => s.topic === selectedTopic);
  }
  
  if (filtered.length === 0) {
    assessmentStudentList.innerHTML = "<li>Keine Prüflinge gefunden</li>";
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Keine Prüflinge</h2>
        <p>Für diese Auswahl gibt es keine Einträge.</p>
      </div>
    `;
    currentSelectedStudentId = null;
    return;
  }
  
  filtered.sort((a, b) => {
    const dateComp = new Date(b.examDate) - new Date(a.examDate);
    if (dateComp !== 0) return dateComp;
    return a.name.localeCompare(b.name);
  });
  
  filtered.forEach((student) => {
    const li = document.createElement("li");
    li.className = "student-item";
    li.dataset.id = student.id;
    const assessment = teacherData.assessments[student.id] || {};
    const finalGrade = assessment.finalGrade || "-";
    
    li.innerHTML = `
      <div class="student-name">${student.name}${student.topic ? ` (${student.topic})` : ""}</div>
      <div class="average-grade grade-${Math.round(finalGrade)}">${finalGrade}</div>
    `;
    
    li.addEventListener("click", () => {
      document.querySelectorAll(".student-item").forEach((item) => {
        item.classList.remove("active");
      });
      li.classList.add("active");
      currentSelectedStudentId = student.id;
      showAssessmentForm(student);
    });
    
    assessmentStudentList.appendChild(li);
  });
  
  // Wählen den vorherigen Schüler aus, wenn verfügbar, andernfalls den ersten
  let studentToSelect = null;
  
  if (currentSelectedStudentId) {
    studentToSelect = document.querySelector(`.student-item[data-id="${currentSelectedStudentId}"]`);
  }
  
  if (!studentToSelect && filtered.length > 0) {
    studentToSelect = document.querySelector(".student-item");
  }
  
  if (studentToSelect) {
    studentToSelect.click();
  }
}

// Aktualisiert die Bewertung im Schülerlistenelement ohne die ganze Liste neu zu laden
function updateStudentGradeInList(studentId, finalGrade) {
  const studentItem = document.querySelector(`.student-item[data-id="${studentId}"]`);
  if (studentItem) {
    const gradeElement = studentItem.querySelector(".average-grade");
    if (gradeElement) {
      gradeElement.textContent = finalGrade;
      gradeElement.className = `average-grade grade-${Math.round(finalGrade)}`;
    }
  }
}

function showAssessmentForm(student) {
  selectedStudent = student;
  const assessment = teacherData.assessments[student.id] || {};
  const avgGrade = calculateAverageGrade(assessment);
  const finalGrade = assessment.finalGrade || avgGrade || "-";
  const infoText = assessment.infoText || "";
  
  let html = `
    <div class="assessment-container">
      <div class="student-header">
        <h2>${student.name}</h2>
        <p>Prüfungsdatum: ${formatDate(student.examDate)}</p>
        ${student.topic ? `<p>Thema: ${student.topic}</p>` : ""}
      </div>
      
      <div class="info-text-container">
        <h3>Informationen zum Prüfling</h3>
        <textarea id="studentInfoText" rows="4" placeholder="Notizen zum Prüfling...">${infoText}</textarea>
      </div>
      
      <div class="final-grade-display">Ø ${avgGrade || "0.0"}</div>
      
      <div class="final-grade-input">
        <label for="finalGrade">Endnote:</label>
        <input type="number" id="finalGrade" min="1" max="6" step="0.5" value="${finalGrade !== "-" ? finalGrade : ""}">
        <button id="saveFinalGradeBtn">Speichern</button>
        <button id="useAverageBtn">Durchschnitt übernehmen</button>
      </div>
  `;
  
  // Kategorie-Noten
  ASSESSMENT_CATEGORIES.forEach((category) => {
    const grade = assessment[category.id] || 0;
    html += `
      <div class="assessment-category">
        <div class="category-header">
          <h3>${category.name}</h3>
        </div>
        <div class="category-grade">${grade > 0 ? grade.toFixed(1) : "-"}</div>
        <div class="grade-buttons" data-category="${category.id}">
    `;
    
    for (let i = 1; i <= 6; i++) {
      for (let decimal of [0, 0.5]) {
        const currentGrade = i + decimal;
        if (currentGrade <= 6) {
          const isSelected = (grade === currentGrade);
          html += `
            <button class="grade-button grade-${Math.floor(currentGrade)}${isSelected ? ' selected' : ''}" 
                    data-grade="${currentGrade}">
              ${currentGrade.toFixed(1)}
            </button>
          `;
        }
      }
    }
    
    const isZeroSelected = (grade === 0);
    html += `
          <button class="grade-button grade-0${isZeroSelected ? ' selected' : ''}" data-grade="0">-</button>
        </div>
      </div>
    `;
  });
  
  html += `</div>`;
  assessmentContent.innerHTML = html;
  
  // Sticky-Anzeige aktualisieren
  if (stickyAverageElement) {
    stickyAverageElement.textContent = `Ø ${avgGrade || "0.0"}`;
  }
  
  // Event-Listener für die Note-Buttons und weitere Aktionen
  document.querySelectorAll(".grade-buttons .grade-button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const categoryId = btn.parentElement.dataset.category;
      const gradeValue = parseFloat(btn.dataset.grade);
      const buttons = btn.parentElement.querySelectorAll("button");
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      
      const gradeDisplay = btn.parentElement.previousElementSibling;
      gradeDisplay.textContent = gradeValue > 0 ? gradeValue.toFixed(1) : "-";
      
      if (!teacherData.assessments[student.id]) {
        teacherData.assessments[student.id] = {};
      }
      teacherData.assessments[student.id][categoryId] = gradeValue;
      
      const newAvg = calculateAverageGrade(teacherData.assessments[student.id]);
      const avgDisplay = document.querySelector(".final-grade-display");
      avgDisplay.textContent = `Ø ${newAvg || "0.0"}`;
      
      // Sticky-Anzeige aktualisieren
      if (stickyAverageElement) {
        stickyAverageElement.textContent = `Ø ${newAvg || "0.0"}`;
      }
      
      if (!teacherData.assessments[student.id].finalGrade) {
        teacherData.assessments[student.id].finalGrade = parseFloat(newAvg);
        const fgInput = document.getElementById("finalGrade");
        if (fgInput) fgInput.value = newAvg;
      }
      
      try {
        await saveTeacherData();
        updateStudentGradeInList(student.id, teacherData.assessments[student.id].finalGrade);
      } catch (error) {
        console.error("Fehler beim Speichern:", error);
        showNotification("Fehler beim Speichern.", "error");
      }
    });
  });
  
  const saveFinalGradeBtn = document.getElementById("saveFinalGradeBtn");
  if (saveFinalGradeBtn) {
    saveFinalGradeBtn.addEventListener("click", async () => {
      const inputVal = parseFloat(document.getElementById("finalGrade").value);
      if (isNaN(inputVal) || inputVal < 1 || inputVal > 6) {
        showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
        return;
      }
      teacherData.assessments[student.id].finalGrade = inputVal;
      try {
        await saveTeacherData();
        updateStudentGradeInList(student.id, inputVal);
        showNotification("Endnote gespeichert.");
      } catch (error) {
        console.error(error);
        showNotification("Fehler beim Speichern.", "error");
      }
    });
  }
  
  const useAverageBtn = document.getElementById("useAverageBtn");
  if (useAverageBtn) {
    useAverageBtn.addEventListener("click", async () => {
      const avgGrade = calculateAverageGrade(teacherData.assessments[student.id]);
      if (!avgGrade) {
        showNotification("Es ist kein Durchschnitt vorhanden.", "warning");
        return;
      }
      document.getElementById("finalGrade").value = avgGrade;
      teacherData.assessments[student.id].finalGrade = parseFloat(avgGrade);
      try {
        await saveTeacherData();
        updateStudentGradeInList(student.id, parseFloat(avgGrade));
showNotification("Durchschnitt als Endnote übernommen.");
      } catch (error) {
        console.error(error);
        showNotification("Fehler beim Speichern.", "error");
      }
    });
  }
  
  const infoTextArea = document.getElementById("studentInfoText");
  if (infoTextArea) {
    infoTextArea.addEventListener("input", () => {
      infoTextArea.dataset.changed = "true";
    });
    setupInfoTextAutoSave(student.id);
  }
}

function setupInfoTextAutoSave(studentId) {
  if (infoTextSaveTimer) clearInterval(infoTextSaveTimer);
  infoTextSaveTimer = setInterval(async () => {
    const area = document.getElementById("studentInfoText");
    if (area && area.dataset.changed === "true") {
      teacherData.assessments[studentId].infoText = area.value;
      await saveTeacherData();
      area.dataset.changed = "false";
      showNotification("Informationstext automatisch gespeichert.");
      area.classList.add("save-flash");
      setTimeout(() => {
        area.classList.remove("save-flash");
      }, 1000);
    }
  }, 60000);
}

// Übersichts-Tab
function updateOverviewTab() {
  populateOverviewYearSelect();
  populateOverviewDateSelect();
  populateOverviewTopicSelect();
  updateOverviewContent();
}

// Verwendet die vorsortierte Jahre-Liste aus getAvailableYears()
function populateOverviewYearSelect() {
  if (!overviewYearSelect) return;
  const years = getAvailableYears();
  
  overviewYearSelect.innerHTML = '<option value="">Alle Jahre</option>';
  years.forEach((year) => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    overviewYearSelect.appendChild(opt);
  });
}

function populateOverviewDateSelect() {
  if (!overviewDateSelect) return;
  const year = overviewYearSelect.value;
  const dates = getAvailableDates(year);
  overviewDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  dates.forEach((date) => {
    const opt = document.createElement("option");
    opt.value = date;
    opt.textContent = formatDate(date);
    overviewDateSelect.appendChild(opt);
  });
}

function populateOverviewTopicSelect() {
  if (!overviewTopicSelect) return;
  overviewTopicSelect.innerHTML = '<option value="">Alle Themen</option>';
  let filtered = teacherData.students;
  const year = overviewYearSelect.value;
  if (year) {
    filtered = filtered.filter((s) => getYearFromDate(s.examDate) === year);
  }
  const d = overviewDateSelect.value;
  if (d) {
    filtered = filtered.filter((s) => s.examDate === d);
  }
  const topics = new Set();
  filtered.forEach((s) => {
    if (s.topic) topics.add(s.topic);
  });
  Array.from(topics)
    .sort()
    .forEach((topic) => {
      const opt = document.createElement("option");
      opt.value = topic;
      opt.textContent = topic;
      overviewTopicSelect.appendChild(opt);
    });
}

function updateOverviewContent() {
  if (!overviewTable) return;
  const tbody = overviewTable.querySelector("tbody");
  tbody.innerHTML = "";
  let filtered = teacherData.students;
  const year = overviewYearSelect.value;
  if (year) {
    filtered = filtered.filter((s) => getYearFromDate(s.examDate) === year);
  }
  const d = overviewDateSelect.value;
  if (d) {
    filtered = filtered.filter((s) => s.examDate === d);
  }
  const t = overviewTopicSelect.value;
  if (t) {
    filtered = filtered.filter((s) => s.topic === t);
  }
  if (filtered.length === 0) {
    const tr = document.createElement("tr");
    tr.innerHTML = '<td colspan="13">Keine Prüflinge gefunden</td>';
    tbody.appendChild(tr);
    return;
  }
  filtered.sort((a, b) => new Date(b.examDate) - new Date(a.examDate));
  filtered.forEach((student) => {
    const assessment = teacherData.assessments[student.id] || {};
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${formatDate(student.examDate)}</td>
      <td>${student.topic || "-"}</td>
      <td>${assessment.presentation || "-"}</td>
      <td>${assessment.content || "-"}</td>
      <td>${assessment.language || "-"}</td>
      <td>${assessment.impression || "-"}</td>
      <td>${assessment.examination || "-"}</td>
      <td>${assessment.reflection || "-"}</td>
      <td>${assessment.expertise || "-"}</td>
      <td>${assessment.documentation || "-"}</td>
      <td>${assessment.finalGrade !== undefined ? assessment.finalGrade : "-"}</td>
      <td>
        <button class="edit-btn" data-id="${student.id}">✏️</button>
      </td>
    `;
    tr.querySelector(".edit-btn").addEventListener("click", () => {
      openEditGradeModal(student);
    });
    tbody.appendChild(tr);
  });
}

// Drucken der Übersicht
function printOverviewData() {
  window.print();
}

// Öffnet das Modal zum Bearbeiten der Endnote
function openEditGradeModal(student) {
  selectedGradeStudent = student;
  const assessment = teacherData.assessments[student.id] || {};
  editFinalGrade.value = assessment.finalGrade || "";
  editGradeModal.style.display = "flex";
}

async function saveEditedGrade() {
  if (!selectedGradeStudent) return;
  const val = parseFloat(editFinalGrade.value);
  if (isNaN(val) || val < 1 || val > 6) {
    showNotification("Bitte eine gültige Note (1-6) eingeben.", "warning");
    return;
  }
  teacherData.assessments[selectedGradeStudent.id].finalGrade = val;
  showLoader();
  const saved = await saveTeacherData();
  hideLoader();
  if (saved) {
    updateOverviewContent();
    // Bei geöffnetem Bewertungs-Tab die Notendarstellung aktualisieren
    if (selectedGradeStudent.id === currentSelectedStudentId) {
      const finalGradeInput = document.getElementById("finalGrade");
      if (finalGradeInput) finalGradeInput.value = val;
    }
    updateStudentGradeInList(selectedGradeStudent.id, val);
    showNotification("Note aktualisiert.");
    editGradeModal.style.display = "none";
  }
}

// Einstellungen
function updateSettingsTab() {
  populateSettingsYearSelect();
  populateSettingsDateSelect();
}

function populateSettingsYearSelect() {
  if (!settingsYearSelect) return;
  const years = getAvailableYears();
  settingsYearSelect.innerHTML = '<option value="">Alle Jahre</option>';
  years.forEach((year) => {
    const opt = document.createElement("option");
    opt.value = year;
    opt.textContent = year;
    settingsYearSelect.appendChild(opt);
  });
}

function populateSettingsDateSelect() {
  if (!settingsDateSelect) return;
  const year = settingsYearSelect.value;
  const dates = getAvailableDates(year);
  settingsDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  dates.forEach((date) => {
    const opt = document.createElement("option");
    opt.value = date;
    opt.textContent = formatDate(date);
    settingsDateSelect.appendChild(opt);
  });
}

function exportData() {
  const useTxt = document.getElementById("exportTXT") && document.getElementById("exportTXT").checked;
  const year = settingsYearSelect.value;
  const day = settingsDateSelect.value;
  let filtered = teacherData.students;
  
  if (year) {
    filtered = filtered.filter((s) => getYearFromDate(s.examDate) === year);
  }
  if (day) {
    filtered = filtered.filter((s) => s.examDate === day);
  }
  
  if (useTxt) {
    let txtContent = "Export WBS Bewertungssystem\n\n";
    filtered.forEach((student) => {
      const assessment = teacherData.assessments[student.id] || {};
      txtContent += `Name: ${student.name}\n`;
      txtContent += `Datum: ${formatDate(student.examDate)}\n`;
      txtContent += `Thema: ${student.topic || '-'}\n`;
      txtContent += `Endnote: ${assessment.finalGrade || '-'}\n`;
      txtContent += `Kategorien:\n`;
      ASSESSMENT_CATEGORIES.forEach(cat => {
        txtContent += `  ${cat.name}: ${assessment[cat.id] || '-'}\n`;
      });
      txtContent += `Info-Text: ${assessment.infoText || ''}\n\n`;
      txtContent += "--------------------------------\n\n";
    });
    downloadFile(`WBS_Export.txt`, txtContent, "text/plain");
  } else {
    // JSON-Export
    const exportData = [];
    filtered.forEach((student) => {
      const assessment = teacherData.assessments[student.id] || {};
      const entry = {
        name: student.name,
        examDate: formatDate(student.examDate),
        topic: student.topic || '',
        finalGrade: assessment.finalGrade || '',
        categories: {}
      };
      ASSESSMENT_CATEGORIES.forEach(cat => {
        entry.categories[cat.name] = assessment[cat.id] || '-';
      });
      entry.infoText = assessment.infoText || '';
      exportData.push(entry);
    });
    const jsonString = JSON.stringify(exportData, null, 2);
    downloadFile(`WBS_Export.json`, jsonString, "application/json");
  }
}

function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function confirmDeleteAllData() {
  if (!deleteVerificationCode) return;
  if (deleteVerificationCode.value.trim() !== (currentUser.code || "")) {
    showNotification("Bestätigungscode ist falsch.", "error");
    return;
  }
  if (!confirm("Sollen wirklich alle Daten gelöscht werden? Das kann nicht rückgängig gemacht werden!")) {
    return;
  }
  deleteAllData();
}

async function deleteAllData() {
  if (!currentUser.code) return;
  try {
    showLoader();
    teacherData.students = [];
    teacherData.assessments = {};
    await saveTeacherData();
    updateStudentsTab();
    updateAssessmentTab();
    updateOverviewTab();
    showNotification("Alle Daten wurden gelöscht.");
  } catch (error) {
    console.error("Fehler beim Löschen aller Daten:", error);
    showNotification("Fehler beim Löschen.", "error");
  } finally {
    hideLoader();
  }
}
