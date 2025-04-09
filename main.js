// js/main.js
import { DEFAULT_TEACHERS, ASSESSMENT_CATEGORIES } from "./constants.js";
import { supabaseClient, initDatabase } from "./supabaseClient.js";
import { teacherData, currentUser, loadTeacherData, saveTeacherData } from "./dataService.js";
import {
  showLoader,
  hideLoader,
  showNotification,
  formatDate,
  getAvailableDates,
  getAvailableTopics,
  calculateAverageGrade,
  getYearFromDate,
  getAvailableYears
} from "./uiService.js";

// Globale Variablen (nur zur Übersicht; können weiter modularisiert werden)
let selectedStudent = null;
let studentToDelete = null;
let selectedGradeStudent = null;
let infoTextSaveTimer = null;
let lastSelectedDate = null;
let lastSelectedTopic = null;
let currentSelectedStudentId = null;

// DOM-Referenzen
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

// Datum für Voreinstellung
const today = new Date();
const defaultDate =
  today.getFullYear() +
  "-" +
  String(today.getMonth() + 1).padStart(2, "0") +
  "-" +
  String(today.getDate()).padStart(2, "0");

// Anwendung initialisieren
document.addEventListener("DOMContentLoaded", function () {
  init();
});

async function init() {
  if (examDate) {
    examDate.value = lastSelectedDate || defaultDate;
  }
  showLoader();
  await initDatabase();
  initTeacherGrid();
  setupEventListeners();
  hideLoader();
}

// Initialisiert die Lehrerauswahl
function initTeacherGrid() {
  if (!teacherGrid) return;
  teacherGrid.innerHTML = "";
  DEFAULT_TEACHERS.forEach((teacher) => {
    const card = document.createElement("div");
    card.className = "teacher-card";
    card.dataset.code = teacher.code;
    card.dataset.name = teacher.name;
    card.innerHTML = `
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50' y='60' font-family='Arial' font-size='30' text-anchor='middle' fill='%23666'%3E${teacher.code.charAt(
        0
      )}%3C/text%3E%3C/svg%3E" alt="${teacher.name}">
      <h3>${teacher.name}</h3>
    `;
    card.addEventListener("click", () => {
      showPasswordModal(teacher);
    });
    teacherGrid.appendChild(card);
  });
}

// Öffnet das Passwort-Fenster
function showPasswordModal(teacher) {
  loginPrompt.textContent = `Passwort für ${teacher.name} eingeben:`;
  passwordInput.value = "";
  passwordModal.style.display = "flex";
  // currentUser-Objekt befüllen
  currentUser.name = teacher.name;
  currentUser.code = teacher.code;
  currentUser.password = teacher.password;
}

// Setzt alle Event-Listener
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
      if (e.key === "Enter") login();
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

// Login-Funktion
async function login() {
  if (!currentUser || !passwordInput) return;
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

// Logout-Funktion
function logout() {
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
    infoTextSaveTimer = null;
  }
  currentUser.name = null;
  currentUser.code = null;
  teacherData.students = [];
  teacherData.assessments = {};
  loginSection.style.display = "block";
  appSection.style.display = "none";
  showNotification("Abmeldung erfolgreich.");
}

// Tab: Schüler
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
  const topic = newStudentTopic.value.trim();

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

  // Neue ID generieren
  const newId = Date.now().toString(36) + Math.random().toString(36).substring(2);

  const newStudent = {
    id: newId,
    name: name,
    examDate: date,
    topic: topic,
    createdAt: new Date().toISOString()
  };
  teacherData.students.push(newStudent);
  teacherData.assessments[newId] = {};

  ASSESSMENT_CATEGORIES.forEach((cat) => {
    teacherData.assessments[newId][cat.id] = 2;
  });
  teacherData.assessments[newId].infoText = "";
  teacherData.assessments[newId].finalGrade = 2.0;

  const saved = await saveTeacherData();
  hideLoader();
  if (saved) {
    newStudentName.value = "";
    newStudentTopic.value = "";
    examDate.value = lastSelectedDate;
    updateStudentsTab();
    populateAssessmentDateSelect();
    populateAssessmentTopicSelect();
    populateOverviewTopicSelect();
    showNotification(`Prüfling "${name}" wurde hinzugefügt.`);
  }
}

// Bearbeiten
function showEditStudentModal(student) {
  editStudentName.value = student.name;
  editExamDate.value = student.examDate;
  editStudentTopic.value = student.topic || "";
  selectedStudent = student;
  editStudentModal.style.display = "flex";
}

async function saveEditedStudent() {
  if (!selectedStudent) return;
  const name = editStudentName.value.trim();
  const date = editExamDate.value;
  const topic = editStudentTopic.value.trim();
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

function showDeleteConfirmation() {
  studentToDelete = selectedStudent;
  deleteStudentName.textContent = studentToDelete.name;
  editStudentModal.style.display = "none";
  confirmDeleteModal.style.display = "flex";
}

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
  } else {
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
  const selectedTopic = assessmentTopicSelect.value;
  assessmentStudentList.innerHTML = "";

  if (!selectedDate && !selectedTopic) {
    assessmentStudentList.innerHTML = "<li>Datum oder Thema wählen</li>";
    assessmentContent.innerHTML = `
      <div class="welcome-card">
        <h2>Willkommen</h2>
        <p>Bitte ein Prüfungsdatum oder ein Thema auswählen.</p>
      </div>
    `;
    currentSelectedStudentId = null;
    return;
  }
  let filtered = teacherData.students;
  if (selectedDate) filtered = filtered.filter((s) => s.examDate === selectedDate);
  if (selectedTopic) filtered = filtered.filter((s) => s.topic === selectedTopic);

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
  filtered.sort((a, b) => new Date(b.examDate) - new Date(a.examDate));

  filtered.forEach((student) => {
    const li = document.createElement("li");
    li.className = "student-item";
    li.dataset.id = student.id;
    const ass = teacherData.assessments[student.id] || {};
    const finalGrade = ass.finalGrade || "-";
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

  let studentToSelect = null;
  if (currentSelectedStudentId) {
    studentToSelect = document.querySelector(
      `.student-item[data-id="${currentSelectedStudentId}"]`
    );
  }
  if (!studentToSelect && filtered.length > 0) {
    studentToSelect = document.querySelector(".student-item");
  }
  if (studentToSelect) studentToSelect.click();
}

function showAssessmentForm(student) {
  selectedStudent = student;
  const ass = teacherData.assessments[student.id] || {};
  const avg = calculateAverageGrade(ass);
  const finalGrade = ass.finalGrade || avg || "-";
  const infoText = ass.infoText || "";

  let html = `
    <div class="assessment-container">
      <div class="student-header">
        <h2>${student.name}</h2>
        <p>Prüfungsdatum: ${formatDate(student.examDate)}</p>
        ${student.topic ? `<p>Thema: ${student.topic}</p>` : ""}
      </div>

      <div class="info-text-container">
        <h3>Informationen</h3>
        <textarea id="studentInfoText" rows="5" placeholder="Notizen...">${infoText}</textarea>
      </div>

      <div class="final-grade-display">Ø ${avg || "0.0"}</div>

      <div class="final-grade-input">
        <label for="finalGrade">Endnote:</label>
        <input type="number" id="finalGrade" min="1" max="6" step="0.5" value="${
          finalGrade !== "-" ? finalGrade : ""
        }">
        <button id="saveFinalGradeBtn">Speichern</button>
        <button id="useAverageBtn">Durchschnitt übernehmen</button>
      </div>
  `;

  ASSESSMENT_CATEGORIES.forEach((category) => {
    const grade = ass[category.id] || 0;
    html += `
      <div class="assessment-category">
        <div class="category-header">
          <h3>${category.name}</h3>
        </div>
        <div class="category-grade">${grade > 0 ? grade.toFixed(1) : "-"}</div>
        <div class="grade-buttons" data-category="${category.id}">
    `;
    for (let i = 1; i <= 6; i++) {
      for (let dec of [0, 0.5]) {
        const g = i + dec;
        if (g <= 6) {
          const selected = grade === g ? " selected" : "";
          html += `
            <button class="grade-button grade-${Math.floor(g)}${selected}" 
                    data-grade="${g}">
              ${g.toFixed(1)}
            </button>
          `;
        }
      }
    }
    const zeroSel = grade === 0 ? " selected" : "";
    html += `
          <button class="grade-button grade-0${zeroSel}" data-grade="0">-</button>
        </div>
      </div>
    `;
  });

  html += `</div>`;
  assessmentContent.innerHTML = html;

  document.querySelectorAll(".grade-buttons .grade-button").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const catId = btn.parentElement.dataset.category;
      const val = parseFloat(btn.dataset.grade);

      btn.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");

      btn.parentElement.previousElementSibling.textContent = val > 0 ? val.toFixed(1) : "-";

      teacherData.assessments[student.id][catId] = val;

      const newAvg = calculateAverageGrade(teacherData.assessments[student.id]);
      const avgDisplay = document.querySelector(".final-grade-display");
      avgDisplay.textContent = `Ø ${newAvg || "0.0"}`;

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
        showNotification("Bitte gültige Note (1-6) eingeben.", "warning");
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
        showNotification("Kein Durchschnitt vorhanden.", "warning");
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

function updateStudentGradeInList(studentId, finalGrade) {
  const item = document.querySelector(`.student-item[data-id="${studentId}"]`);
  if (item) {
    const gradeElem = item.querySelector(".average-grade");
    if (gradeElem) {
      gradeElem.textContent = finalGrade;
      gradeElem.className = `average-grade grade-${Math.round(finalGrade)}`;
    }
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
    const ass = teacherData.assessments[student.id] || {};
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${student.name}</td>
      <td>${formatDate(student.examDate)}</td>
      <td>${student.topic || "-"}</td>
      <td>${ass.presentation || "-"}</td>
      <td>${ass.content || "-"}</td>
      <td>${ass.language || "-"}</td>
      <td>${ass.impression || "-"}</td>
      <td>${ass.examination || "-"}</td>
      <td>${ass.reflection || "-"}</td>
      <td>${ass.expertise || "-"}</td>
      <td>${ass.documentation || "-"}</td>
      <td>${ass.finalGrade !== undefined ? ass.finalGrade : "-"}</td>
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

function openEditGradeModal(student) {
  selectedGradeStudent = student;
  const ass = teacherData.assessments[student.id] || {};
  editFinalGrade.value = ass.finalGrade || "";
  editGradeModal.style.display = "flex";
}

async function saveEditedGrade() {
  if (!selectedGradeStudent) return;
  const val = parseFloat(editFinalGrade.value);
  if (isNaN(val) || val < 1 || val > 6) {
    showNotification("Bitte gültige Note (1-6) eingeben.", "warning");
    return;
  }
  teacherData.assessments[selectedGradeStudent.id].finalGrade = val;
  showLoader();
  const saved = await saveTeacherData();
  hideLoader();
  if (saved) {
    updateOverviewTab();
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
  const useTxt = document.getElementById("exportTXT").checked;
  const year = settingsYearSelect.value;
  const day = settingsDateSelect.value;

  let filtered = teacherData.students;
  if (year) {
    filtered = filtered.filter((s) => getYearFromDate(s.examDate) === year);
  }
  if (day) {
    filtered = filtered.filter((s) => s.examDate === day);
  }

  const exportObj = { students: [], assessments: {} };
  filtered.forEach((student) => {
    exportObj.students.push(student);
    exportObj.assessments[student.id] = teacherData.assessments[student.id];
  });

  const fileName = `WBS_Daten_${new Date().getTime()}`;
  if (useTxt) {
    let txtContent = "";
    filtered.forEach((s) => {
      const ass = teacherData.assessments[s.id] || {};
      txtContent += `Name: ${s.name}, Datum: ${s.examDate}, Thema: ${s.topic}\n`;
      ASSESSMENT_CATEGORIES.forEach((c) => {
        txtContent += `- ${c.name}: ${ass[c.id] || "-"}\n`;
      });
      txtContent += `- Endnote: ${ass.finalGrade || "-"}\n\n`;
    });
    downloadFile(`${fileName}.txt`, txtContent, "text/plain");
  } else {
    const jsonString = JSON.stringify(exportObj, null, 2);
    downloadFile(`${fileName}.json`, jsonString, "application/json");
  }
}

function downloadFile(name, content, mime) {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
}

function confirmDeleteAllData() {
  if (!deleteVerificationCode) return;
  if (deleteVerificationCode.value.trim() !== (currentUser.code || "")) {
    showNotification("Bestätigungscode ist falsch.", "error");
    return;
  }
  showLoader();
  supabaseClient
    .from("wbs_data")
    .delete()
    .eq("teacher_code", currentUser.code)
    .then(({ error }) => {
      hideLoader();
      if (error) {
        console.error(error);
        showNotification("Fehler beim Löschen.", "error");
      } else {
        teacherData.students = [];
        teacherData.assessments = {};
        updateStudentsTab();
        updateAssessmentTab();
        updateOverviewTab();
        showNotification("Alle Daten wurden gelöscht.");
      }
    });
}
