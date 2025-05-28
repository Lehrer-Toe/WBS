// js/modules/updatedThemeModule.js - Aktualisiertes Themen-Modul mit Auth-Integration
import { currentUser, getUserData, hasPermission } from "../authService.js";
import { showLoader, hideLoader, showNotification, formatDate } from "../uiService.js";
import { 
    allThemes,
    loadAllThemes,
    createTheme,
    updateTheme,
    deleteTheme,
    addStudentToTheme,
    updateStudent,
    removeStudentFromTheme,
    updateStudentAssessment,
    calculateStudentAverage,
    getThemesForAssessment
} from "../themeService.js";
import { 
    assessmentTemplates,
    loadAssessmentTemplatesForTeacher,
    getAssessmentTemplate
} from "../assessmentService.js";
import { THEMES_CONFIG, STUDENT_STATUS, THEME_STATUS } from "../constants.js";

/**
 * DOM-Elemente
 */
let elements = {
    // Themen-Tab
    themesContainer: null,
    themesList: null,
    newThemeBtn: null,
    themeFilterSelect: null,
    themeSortSelect: null,
    
    // Assessment-Tab
    assessmentStudentList: null,
    assessmentContent: null,
    assessmentFilterSelect: null,
    assessmentSortSelect: null,
    
    // Übersicht-Tab
    overviewTable: null,
    overviewSchoolYearSelect: null,
    overviewStatusSelect: null,
    exportDataBtn: null,
    
    // Templates-Tab
    templatesList: null,
    templatesCount: null,
    newTemplateForm: null,
    
    // Modals
    themeModal: null,
    studentModal: null
};

/**
 * Zustand
 */
let currentSelectedStudentId = null;
let userThemes = [];
let userAssignedStudents = [];
let teacherTemplates = [];

/**
 * Initialisiert das aktualisierte Themen-Modul
 */
export async function initUpdatedThemeModule() {
    if (!currentUser.isLoggedIn) {
        console.log("Benutzer nicht angemeldet, Themen-Modul wird nicht initialisiert");
        return;
    }
    
    loadDOMElements();
    setupEventListeners();
    
    // Lade Themen und benutzerspezifische Daten
    await loadUserData();
    
    // Initialisiere Tabs
    updateThemesTab();
    updateAssessmentTab();
    updateOverviewTab();
    updateTemplatesTab();
}

/**
 * Lädt DOM-Elemente
 */
function loadDOMElements() {
    // Themen-Tab
    elements.themesContainer = document.getElementById("themesContainer");
    elements.themesList = document.getElementById("themesList");
    elements.newThemeBtn = document.getElementById("newThemeBtn");
    elements.themeFilterSelect = document.getElementById("themeFilterSelect");
    elements.themeSortSelect = document.getElementById("themeSortSelect");
    
    // Assessment-Tab
    elements.assessmentStudentList = document.getElementById("assessmentStudentList");
    elements.assessmentContent = document.getElementById("assessmentContent");
    elements.assessmentFilterSelect = document.getElementById("assessmentFilterSelect");
    elements.assessmentSortSelect = document.getElementById("assessmentSortSelect");
    
    // Übersicht-Tab
    elements.overviewTable = document.getElementById("overviewTable");
    elements.overviewSchoolYearSelect = document.getElementById("overviewSchoolYearSelect");
    elements.overviewStatusSelect = document.getElementById("overviewStatusSelect");
    elements.exportDataBtn = document.getElementById("exportDataBtn");
    
    // Templates-Tab
    elements.templatesList = document.getElementById("teacherTemplatesList");
    elements.templatesCount = document.getElementById("templatesCount");
    elements.newTemplateForm = document.getElementById("newTeacherTemplateForm");
    
    // Modals
    elements.themeModal = document.getElementById("themeModal");
    elements.studentModal = document.getElementById("studentModal");
}

/**
 * Richtet Event-Listener ein
 */
function setupEventListeners() {
    // Neues Thema erstellen
    if (elements.newThemeBtn) {
        elements.newThemeBtn.addEventListener("click", showNewThemeModal);
    }
    
    // Filter und Sortierung
    if (elements.themeFilterSelect) {
        elements.themeFilterSelect.addEventListener("change", updateThemesList);
    }
    
    if (elements.themeSortSelect) {
        elements.themeSortSelect.addEventListener("change", updateThemesList);
    }
    
    // Assessment-Filter
    if (elements.assessmentFilterSelect) {
        elements.assessmentFilterSelect.addEventListener("change", updateAssessmentTab);
    }
    
    if (elements.assessmentSortSelect) {
        elements.assessmentSortSelect.addEventListener("change", updateAssessmentTab);
    }
    
    // Export-Button
    if (elements.exportDataBtn) {
        elements.exportDataBtn.addEventListener("click", exportUserData);
    }
}

/**
 * Lädt benutzerspezifische Daten
 */
async function loadUserData() {
    try {
        showLoader();
        
        // Lade alle Themen
        await loadAllThemes();
        
        // Filtere Themen für den aktuellen Benutzer
        userThemes = allThemes.filter(theme => theme.created_by === currentUser.uid);
        
        // Lade Schüler, die dem Benutzer zugewiesen sind
        userAssignedStudents = [];
        allThemes.forEach(theme => {
            if (theme.students) {
                theme.students.forEach(student => {
                    if (student.assigned_teacher === currentUser.uid) {
                        userAssignedStudents.push({
                            ...student,
                            theme: {
                                id: theme.id,
                                title: theme.title,
                                deadline: theme.deadline,
                                assessment_template_id: theme.assessment_template_id
                            }
                        });
                    }
                });
            }
        });
        
        // Lade Bewertungsraster des Benutzers
        teacherTemplates = await loadAssessmentTemplatesForTeacher(currentUser.uid);
        
        console.log(`${userThemes.length} Themen und ${userAssignedStudents.length} Schüler geladen`);
        
    } catch (error) {
        console.error("Fehler beim Laden der Benutzerdaten:", error);
        showNotification("Fehler beim Laden der Daten: " + error.message, "error");
    } finally {
        hideLoader();
    }
}

/**
 * Aktualisiert den Themen-Tab
 */
export function updateThemesTab() {
    if (!elements.themesList) return;
    
    // Prüfe Berechtigungen
    const canCreateThemes = hasPermission('canCreateThemes') || currentUser.role === 'admin';
    
    if (elements.newThemeBtn) {
        elements.newThemeBtn.style.display = canCreateThemes ? "block" : "none";
    }
    
    updateThemesList();
}

/**
 * Aktualisiert die Themenliste
 */
function updateThemesList() {
    if (!elements.themesList) return;
    
    let filteredThemes = [...userThemes];
    
    // Filter anwenden
    const filterValue = elements.themeFilterSelect ? elements.themeFilterSelect.value : "";
    if (filterValue) {
        filteredThemes = filteredThemes.filter(theme => theme.status === filterValue);
    }
    
    // Sortierung anwenden
    const sortValue = elements.themeSortSelect ? elements.themeSortSelect.value : "deadline";
    filteredThemes = sortThemes(filteredThemes, sortValue);
    
    // Liste leeren
    elements.themesList.innerHTML = "";
    
    if (filteredThemes.length === 0) {
        elements.themesList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📚</div>
                <h3>Keine Themen gefunden</h3>
                <p>Sie haben noch keine Themen erstellt oder die Filter zeigen keine Ergebnisse.</p>
                ${hasPermission('canCreateThemes') || currentUser.role === 'admin' ? 
                    '<button onclick="window.showNewThemeModal()" class="btn-primary btn-large">Erstes Thema erstellen</button>' : 
                    '<p>Sie haben keine Berechtigung, um Themen zu erstellen.</p>'}
            </div>
        `;
        
        // Global verfügbar machen
        window.showNewThemeModal = showNewThemeModal;
        
        return;
    }
    
    // Themen als Karten anzeigen
    filteredThemes.forEach(theme => {
        const themeCard = createThemeCard(theme);
        elements.themesList.appendChild(themeCard);
    });
}

/**
 * Erstellt eine Themen-Karte
 */
function createThemeCard(theme) {
    const card = document.createElement("div");
    card.className = `theme-card ${theme.status}`;
    card.dataset.themeId = theme.id;
    
    // Deadline-Info
    let deadlineHTML = "";
    if (theme.deadline) {
        const deadline = new Date(theme.deadline);
        const now = new Date();
        const daysRemaining = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        
        let deadlineClass = "";
        let deadlineText = "";
        
        if (daysRemaining < 0) {
            deadlineClass = "overdue";
            deadlineText = `${Math.abs(daysRemaining)} Tage überfällig`;
        } else if (daysRemaining === 0) {
            deadlineClass = "due-today";
            deadlineText = "Heute fällig";
        } else if (daysRemaining <= 7) {
            deadlineClass = "due-soon";
            deadlineText = `${daysRemaining} Tage verbleibend`;
        } else {
            deadlineClass = "due-later";
            deadlineText = `${daysRemaining} Tage verbleibend`;
        }
        
        deadlineHTML = `
            <div class="theme-deadline ${deadlineClass}">
                <span class="deadline-icon">⏰</span>
                <span class="deadline-text">${deadlineText}</span>
                <span class="deadline-date">${formatDate(theme.deadline)}</span>
            </div>
        `;
    }
    
    // Fortschritt berechnen
    const totalStudents = theme.students ? theme.students.length : 0;
    const completedStudents = theme.students ? 
        theme.students.filter(s => s.status === STUDENT_STATUS.COMPLETED).length : 0;
    const progressPercent = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;
    
    // Status-Badge
    let statusBadge = "";
    let statusText = "";
    
    switch (theme.status) {
        case THEME_STATUS.ACTIVE:
            statusBadge = "status-active";
            statusText = "Aktiv";
            break;
        case THEME_STATUS.COMPLETED:
            statusBadge = "status-completed";
            statusText = "Abgeschlossen";
            break;
        case THEME_STATUS.OVERDUE:
            statusBadge = "status-overdue";
            statusText = "Überfällig";
            break;
        default:
            statusBadge = "status-unknown";
            statusText = "Unbekannt";
    }
    
    card.innerHTML = `
        <div class="theme-header">
            <h3 class="theme-title">${theme.title}</h3>
            <span class="status-badge ${statusBadge}">${statusText}</span>
        </div>
        <div class="theme-description">
            ${theme.description || "Keine Beschreibung"}
        </div>
        ${deadlineHTML}
        <div class="theme-meta">
            <span class="theme-school-year">${theme.school_year || "Kein Schuljahr"}</span>
            <span class="theme-students-count">${totalStudents}/${THEMES_CONFIG.maxStudentsPerTheme} Schüler</span>
        </div>
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progressPercent}%"></div>
            </div>
            <div class="progress-text">${completedStudents}/${totalStudents} bewertet (${progressPercent}%)</div>
        </div>
        <div class="theme-actions">
            <button class="btn-edit btn-large" data-theme-id="${theme.id}">Bearbeiten</button>
            <button class="btn-manage-students btn-large" data-theme-id="${theme.id}">Schüler verwalten</button>
            <button class="btn-delete btn-large" data-theme-id="${theme.id}">Löschen</button>
        </div>
    `;
    
    // Event-Listener für Aktions-Buttons
    const editBtn = card.querySelector(".btn-edit");
    const manageBtn = card.querySelector(".btn-manage-students");
    const deleteBtn = card.querySelector(".btn-delete");
    
    if (editBtn) {
        editBtn.addEventListener("click", () => showEditThemeModal(theme));
    }
    
    if (manageBtn) {
        manageBtn.addEventListener("click", () => showStudentsManagement(theme));
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener("click", () => confirmDeleteTheme(theme));
    }
    
    return card;
}

/**
 * Aktualisiert den Assessment-Tab
 */
export function updateAssessmentTab() {
    if (!elements.assessmentStudentList) return;
    
    // Filtere und sortiere Schüler
    let filteredStudents = [...userAssignedStudents];
    
    const filterValue = elements.assessmentFilterSelect ? elements.assessmentFilterSelect.value : "";
    if (filterValue) {
        filteredStudents = filteredStudents.filter(student => student.status === filterValue);
    }
    
    const sortValue = elements.assessmentSortSelect ? elements.assessmentSortSelect.value : "name";
    filteredStudents = sortStudents(filteredStudents, sortValue);
    
    // Liste leeren
    elements.assessmentStudentList.innerHTML = "";
    
    if (filteredStudents.length === 0) {
        elements.assessmentStudentList.innerHTML = `
            <li class="empty-message">
                Keine Schüler zur Bewertung zugewiesen
            </li>
        `;
        
        // Inhalt-Bereich leeren
        if (elements.assessmentContent) {
            elements.assessmentContent.innerHTML = `
                <div class="welcome-card">
                    <h2>Bewertung von Schülern</h2>
                    <p>Sie sind derzeit keinem Schüler als Prüfungslehrer zugewiesen.</p>
                </div>
            `;
        }
        
        return;
    }
    
    // Schüler-Liste erstellen
    filteredStudents.forEach(student => {
        const listItem = createStudentListItem(student);
        elements.assessmentStudentList.appendChild(listItem);
    });
    
    // Ersten Schüler auswählen, falls noch keiner ausgewählt ist
    if (!currentSelectedStudentId && filteredStudents.length > 0) {
        elements.assessmentStudentList.querySelector(".student-item").click();
    }
}

/**
 * Erstellt ein Schüler-Listen-Element
 */
function createStudentListItem(student) {
    const listItem = document.createElement("li");
    listItem.className = `student-item ${student.status}`;
    listItem.dataset.studentId = student.id;
    listItem.dataset.themeId = student.theme.id;
    
    // Note anzeigen
    const grade = student.assessment && student.assessment.finalGrade ? 
        student.assessment.finalGrade : "-";
    
    listItem.innerHTML = `
        <div class="student-info">
            <div class="student-name">${student.name}</div>
            <div class="student-theme">${student.theme.title}</div>
            ${student.class ? `<div class="student-class">${student.class}</div>` : ""}
        </div>
        <div class="student-status">
            <span class="status-badge status-${student.status}">
                ${getStatusText(student.status)}
            </span>
            <div class="student-grade ${grade !== "-" ? `grade-${Math.round(grade)}` : ""}">${grade}</div>
        </div>
    `;
    
    // Event-Listener für Auswahl
    listItem.addEventListener("click", () => {
        // Alle anderen deaktivieren
        document.querySelectorAll(".student-item").forEach(item => {
            item.classList.remove("active");
        });
        
        // Diesen aktivieren
        listItem.classList.add("active");
        
        currentSelectedStudentId = student.id;
        showAssessmentForm(student);
    });
    
    return listItem;
}

/**
 * Zeigt das Bewertungsformular für einen Schüler
 */
async function showAssessmentForm(student) {
    if (!elements.assessmentContent) return;
    
    // Ladebalken anzeigen
    elements.assessmentContent.innerHTML = `
        <div class="loading-container">
            <div class="loading-spinner"></div>
            <p>Bewertungsformular wird geladen...</p>
        </div>
    `;
    
    try {
        // Bewertungsraster laden
        const templateId = student.theme.assessment_template_id || "standard";
        const template = await getAssessmentTemplate(templateId);
        
        if (!template) {
            throw new Error("Bewertungsraster nicht gefunden");
        }
        
        // Durchschnittsnote berechnen
        const avgGrade = await calculateStudentAverage(student.theme.id, student.id);
        const finalGrade = student.assessment ? student.assessment.finalGrade : null;
        
        // Bewertungsformular erstellen
        let formHTML = `
            <div class="assessment-container">
                <div class="student-header">
                    <h2>${student.name} ${student.class ? `<span class="class-badge">${student.class}</span>` : ""}</h2>
                    <p>Thema: ${student.theme.title}</p>
                    ${student.theme.deadline ? `<p>Deadline: ${formatDate(student.theme.deadline)}</p>` : ""}
                    <p>Bewertungsraster: <strong>${template.name}</strong></p>
                </div>
                
                <div class="final-grade-display">
                    Durchschnitt: ${avgGrade || "0.0"}
                </div>
                
                <div class="final-grade-input">
                    <label for="finalGrade">Endnote:</label>
                    <input type="number" id="finalGrade" min="1" max="6" step="0.1" 
                           value="${finalGrade || ""}" placeholder="z.B. 2.5">
                    <button id="saveFinalGradeBtn" class="btn-primary">Speichern</button>
                    <button id="useAverageBtn" class="btn-secondary">Durchschnitt übernehmen</button>
                </div>
        `;
        
        // Bewertungskategorien
        template.categories.forEach(category => {
            const currentGrade = student.assessment ? student.assessment[category.id] : null;
            
            formHTML += `
                <div class="assessment-category">
                    <div class="category-header">
                        <h3>${category.name}</h3>
                        ${category.weight !== 1 ? `<span class="weight-badge">Gewichtung: ${category.weight}</span>` : ""}
                    </div>
                    <div class="category-grade">${currentGrade || "-"}</div>
                    <div class="grade-buttons" data-category="${category.id}">
            `;
            
            // Note-Buttons (1.0 bis 6.0 in 0.5er Schritten)
            for (let i = 1; i <= 6; i += 0.5) {
                const isSelected = currentGrade === i;
                formHTML += `
                    <button class="grade-button grade-${Math.floor(i)} ${isSelected ? 'selected' : ''}" 
                            data-grade="${i}">
                        ${i.toFixed(1)}
                    </button>
                `;
            }
            
            // "Keine Note" Button
            const isNoGradeSelected = !currentGrade;
            formHTML += `
                    <button class="grade-button grade-0 ${isNoGradeSelected ? 'selected' : ''}" 
                            data-grade="0">
                        -
                    </button>
                </div>
            </div>
            `;
        });
        
        formHTML += `</div>`;
        
        elements.assessmentContent.innerHTML = formHTML;
        
        // Event-Listener für Bewertungsformular
        setupAssessmentEventListeners(student);
        
    } catch (error) {
        console.error("Fehler beim Laden des Bewertungsformulars:", error);
        elements.assessmentContent.innerHTML = `
            <div class="error-state">
                <h3>Fehler beim Laden</h3>
                <p>Bewertungsformular konnte nicht geladen werden: ${error.message}</p>
                <button onclick="window.location.reload()" class="btn-primary">Seite neu laden</button>
            </div>
        `;
    }
}

/**
 * Richtet Event-Listener für das Bewertungsformular ein
 */
function setupAssessmentEventListeners(student) {
    // Note-Buttons
    document.querySelectorAll(".grade-buttons .grade-button").forEach(btn => {
        btn.addEventListener("click", async () => {
            const categoryId = btn.parentElement.dataset.category;
            const gradeValue = parseFloat(btn.dataset.grade);
            
            // Button-Darstellung aktualisieren
            const buttons = btn.parentElement.querySelectorAll("button");
            buttons.forEach(b => b.classList.remove("selected"));
            btn.classList.add("selected");
            
            // Kategorie-Anzeige aktualisieren
            const gradeDisplay = btn.parentElement.previousElementSibling;
            gradeDisplay.textContent = gradeValue > 0 ? gradeValue.toFixed(1) : "-";
            
            // Bewertung speichern
            await saveAssessmentValue(student, categoryId, gradeValue);
        });
    });
    
    // Endnote speichern
    const saveFinalGradeBtn = document.getElementById("saveFinalGradeBtn");
    if (saveFinalGradeBtn) {
        saveFinalGradeBtn.addEventListener("click", async () => {
            const finalGradeInput = document.getElementById("finalGrade");
            const value = parseFloat(finalGradeInput.value);
            
            if (isNaN(value) || value < 1 || value > 6) {
                showNotification("Bitte eine gültige Note zwischen 1.0 und 6.0 eingeben.", "warning");
                return;
            }
            
            await saveAssessmentValue(student, "finalGrade", value);
        });
    }
    
    // Durchschnitt übernehmen
    const useAverageBtn = document.getElementById("useAverageBtn");
    if (useAverageBtn) {
        useAverageBtn.addEventListener("click", async () => {
            const avgGrade = await calculateStudentAverage(student.theme.id, student.id);
            if (!avgGrade) {
                showNotification("Kein Durchschnitt verfügbar.", "warning");
                return;
            }
            
            const finalGradeInput = document.getElementById("finalGrade");
            finalGradeInput.value = avgGrade;
            
            await saveAssessmentValue(student, "finalGrade", parseFloat(avgGrade));
        });
    }
}

/**
 * Speichert einen Bewertungswert
 */
async function saveAssessmentValue(student, key, value) {
    try {
        showLoader();
        
        const assessment = { ...student.assessment };
        assessment[key] = value;
        
        await updateStudentAssessment(student.theme.id, student.id, assessment);
        
        // Lokalen Schüler aktualisieren
        const studentIndex = userAssignedStudents.findIndex(s => s.id === student.id);
        if (studentIndex !== -1) {
            userAssignedStudents[studentIndex].assessment = assessment;
            
            // Status aktualisieren
            if (key === "finalGrade") {
                userAssignedStudents[studentIndex].status = STUDENT_STATUS.COMPLETED;
            } else {
                userAssignedStudents[studentIndex].status = STUDENT_STATUS.IN_PROGRESS;
            }
        }
        
        // UI aktualisieren
        if (key === "finalGrade") {
            updateAssessmentTab();
        }
        
        // Durchschnitt neu berechnen und anzeigen
        const avgGrade = await calculateStudentAverage(student.theme.id, student.id);
        const avgDisplay = document.querySelector(".final-grade-display");
        if (avgDisplay) {
            avgDisplay.textContent = `Durchschnitt: ${avgGrade || "0.0"}`;
        }
        
        showNotification("Bewertung gespeichert.", "success");
        
    } catch (error) {
        console.error("Fehler beim Speichern der Bewertung:", error);
        showNotification("Fehler beim Speichern: " + error.message, "error");
    } finally {
        hideLoader();
    }
}

/**
 * Aktualisiert den Übersichts-Tab
 */
export function updateOverviewTab() {
    if (!elements.overviewTable) return;
    
    const tbody = elements.overviewTable.querySelector("tbody");
    if (!tbody) return;
    
    tbody.innerHTML = "";
    
    if (userThemes.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    Keine Themen vorhanden
                </td>
            </tr>
        `;
        return;
    }
    
    // Themen in Tabelle anzeigen
    userThemes.forEach(theme => {
        const row = document.createElement("tr");
        row.className = theme.status;
        
        const totalStudents = theme.students ? theme.students.length : 0;
        const completedStudents = theme.students ? 
            theme.students.filter(s => s.status === STUDENT_STATUS.COMPLETED).length : 0;
        const progressPercent = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;
        
        row.innerHTML = `
            <td>${theme.title}</td>
            <td>${theme.school_year || "-"}</td>
            <td>${theme.deadline ? formatDate(theme.deadline) : "-"}</td>
            <td><span class="status-badge status-${theme.status}">${getStatusText(theme.status)}</span></td>
            <td>
                <div class="progress-bar-container">
                    <div class="progress-bar" style="width: ${progressPercent}%"></div>
                    <span class="progress-text">${progressPercent}%</span>
                </div>
            </td>
            <td>
                <button class="btn-details btn-compact" data-theme-id="${theme.id}">Details</button>
            </td>
        `;
        
        // Event-Listener für Details-Button
        row.querySelector(".btn-details").addEventListener("click", () => {
            showThemeDetails(theme);
        });
        
        tbody.appendChild(row);
    });
}

/**
 * Aktualisiert den Templates-Tab
 */
export function updateTemplatesTab() {
    if (!elements.templatesCount) return;
    
    elements.templatesCount.textContent = 
        `Sie haben ${teacherTemplates.length} von 5 Bewertungsrastern erstellt.`;
    
    // Weitere Template-Funktionalität hier implementieren
}

/**
 * Globale Funktionen für andere Module
 */
window.showNewThemeModal = showNewThemeModal;

/**
 * Hilfsfunktionen
 */
function showNewThemeModal() {
    showNotification("Neues Thema erstellen - Diese Funktion wird implementiert.", "info");
}

function showEditThemeModal(theme) {
    showNotification(`Thema "${theme.title}" bearbeiten - Diese Funktion wird implementiert.`, "info");
}

function showStudentsManagement(theme) {
    showNotification(`Schüler für "${theme.title}" verwalten - Diese Funktion wird implementiert.`, "info");
}

function confirmDeleteTheme(theme) {
    if (confirm(`Möchten Sie das Thema "${theme.title}" wirklich löschen?`)) {
        showNotification(`Thema "${theme.title}" löschen - Diese Funktion wird implementiert.`, "info");
    }
}

function showThemeDetails(theme) {
    showNotification(`Details für "${theme.title}" - Diese Funktion wird implementiert.`, "info");
}

function exportUserData() {
    showNotification("Daten exportieren - Diese Funktion wird implementiert.", "info");
}

function sortThemes(themes, sortBy) {
    return themes.sort((a, b) => {
        switch (sortBy) {
            case "title":
                return a.title.localeCompare(b.title);
            case "status":
                return a.status.localeCompare(b.status);
            case "deadline":
                if (!a.deadline && !b.deadline) return 0;
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline) - new Date(b.deadline);
            default:
                return 0;
        }
    });
}

function sortStudents(students, sortBy) {
    return students.sort((a, b) => {
        switch (sortBy) {
            case "name":
                return a.name.localeCompare(b.name);
            case "class":
                return (a.class || "").localeCompare(b.class || "");
            case "status":
                return a.status.localeCompare(b.status);
            case "deadline":
                if (!a.theme.deadline && !b.theme.deadline) return 0;
                if (!a.theme.deadline) return 1;
                if (!b.theme.deadline) return -1;
                return new Date(a.theme.deadline) - new Date(b.theme.deadline);
            default:
                return 0;
        }
    });
}

function getStatusText(status) {
    switch (status) {
        case STUDENT_STATUS.PENDING:
            return "Offen";
        case STUDENT_STATUS.IN_PROGRESS:
            return "In Bearbeitung";
        case STUDENT_STATUS.COMPLETED:
            return "Bewertet";
        case THEME_STATUS.ACTIVE:
            return "Aktiv";
        case THEME_STATUS.COMPLETED:
            return "Abgeschlossen";
        case THEME_STATUS.OVERDUE:
            return "Überfällig";
        default:
            return status;
    }
}

/**
 * Globale Funktion für automatischen Sprung zur Bewertung
 * Diese wird von der Schülerübersicht aufgerufen
 */
window.jumpToStudentAssessment = function(studentId, themeId) {
    // Aktiviere Assessment-Tab
    if (window.setActiveTab) {
        window.setActiveTab('assessment');
    }
    
    // Warte kurz, dann wähle den Schüler aus
    setTimeout(() => {
        currentSelectedStudentId = studentId;
        
        // Finde den Schüler in der Liste
        const studentItem = document.querySelector(`.student-item[data-student-id="${studentId}"]`);
        if (studentItem) {
            studentItem.click();
            studentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            // Falls der Schüler nicht in der aktuellen Liste ist, aktualisiere sie
            updateAssessmentTab();
            
            // Versuche es nochmal nach dem Update
            setTimeout(() => {
                const studentItem = document.querySelector(`.student-item[data-student-id="${studentId}"]`);
                if (studentItem) {
                    studentItem.click();
                    studentItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 500);
        }
    }, 300);
};
