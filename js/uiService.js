// js/uiService.js
import { DEFAULT_ASSESSMENT_CATEGORIES, DEFAULT_TEACHERS, THEME_STATUS, STUDENT_STATUS } from "./constants.js";
import { allThemes } from "./themeService.js";
import { assessmentTemplates } from "./assessmentService.js";

/**
 * Zeigt den Ladebildschirm
 */
export function showLoader() {
  const mainLoader = document.getElementById("mainLoader");
  if (mainLoader) {
    mainLoader.style.display = "flex";
  }
}

/**
 * Versteckt den Ladebildschirm
 */
export function hideLoader() {
  const mainLoader = document.getElementById("mainLoader");
  if (mainLoader) {
    mainLoader.style.display = "none";
  }
}

/**
 * Zeigt eine Benachrichtigung
 * @param {string} message - Anzuzeigender Text
 * @param {string} type - Art der Benachrichtigung (success, warning, error)
 */
export function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

/**
 * Formatiert einen ISO-Datumstring in deutsches Format
 * @param {string} isoDateString - ISO-Datum (YYYY-MM-DD)
 * @returns {string} Formatiertes Datum (DD.MM.YYYY)
 */
export function formatDate(isoDateString) {
  if (!isoDateString) return "";
  const date = new Date(isoDateString + "T00:00:00");
  if (isNaN(date.getTime())) return isoDateString;
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

/**
 * Formatiert einen ISO-Datumstring mit Uhrzeit in deutsches Format
 * @param {string} isoDateTimeString - ISO-Datum mit Zeit
 * @returns {string} Formatiertes Datum mit Uhrzeit (DD.MM.YYYY, HH:MM)
 */
export function formatDateTime(isoDateTimeString) {
  if (!isoDateTimeString) return "";
  const date = new Date(isoDateTimeString);
  if (isNaN(date.getTime())) return isoDateTimeString;
  
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

/**
 * Berechnet die verbleibenden Tage bis zu einem Datum
 * @param {string} dateString - Zieldatum im ISO-Format
 * @returns {number|null} Anzahl der Tage oder null, wenn kein gültiges Datum
 */
export function getDaysRemaining(dateString) {
  if (!dateString) return null;
  
  const targetDate = new Date(dateString);
  if (isNaN(targetDate.getTime())) return null;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Formatiert die verbleibenden Tage als Text mit Farbcodierung
 * @param {number} days - Anzahl der verbleibenden Tage
 * @returns {object} HTML und CSS-Klasse
 */
export function formatRemainingDays(days) {
  if (days === null) return { text: "Kein Datum", className: "" };
  
  if (days < 0) {
    return { 
      text: `${Math.abs(days)} ${Math.abs(days) === 1 ? 'Tag' : 'Tage'} überfällig`, 
      className: "overdue" 
    };
  } else if (days === 0) {
    return { text: "Heute fällig", className: "due-today" };
  } else if (days === 1) {
    return { text: "Morgen fällig", className: "due-soon" };
  } else if (days <= 7) {
    return { text: `In ${days} Tagen fällig`, className: "due-soon" };
  } else {
    return { text: `In ${days} Tagen fällig`, className: "due-later" };
  }
}

/**
 * Initialisiert das Lehrer-Grid für die Anmeldung
 * @param {HTMLElement} teacherGrid - DOM-Element für das Grid
 * @param {Function} showPasswordModalCallback - Callback für Passwortdialog
 * @param {Array} teachersArray - Array mit Lehrer-Objekten (optional)
 */
export function initTeacherGrid(teacherGrid, showPasswordModalCallback, teachersArray = null) {
  if (!teacherGrid) return;
  
  teacherGrid.innerHTML = "";
  
  // Verwende übergebenes Array, globales allTeachers oder Fallback zu DEFAULT_TEACHERS
  let teachersToShow = teachersArray;
  
  if (!teachersToShow && window.allTeachers && window.allTeachers.length > 0) {
    teachersToShow = window.allTeachers;
  }
  
  if (!teachersToShow || teachersToShow.length === 0) {
    teachersToShow = DEFAULT_TEACHERS;
  }
    
  teachersToShow.forEach((teacher) => {
    const card = document.createElement("div");
    card.className = "teacher-card";
    card.dataset.code = teacher.code;
    card.dataset.name = teacher.name;
    
    // Icon für Themen-Erstellung-Berechtigung hinzufügen
    const hasCreateThemesPermission = teacher.permissions && teacher.permissions.canCreateThemes;
    const permissionIcon = hasCreateThemesPermission ? 
      '<span class="permission-badge" title="Kann Themen erstellen">📝</span>' : '';
    
    card.innerHTML = `
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50' y='60' font-family='Arial' font-size='30' text-anchor='middle' fill='%23666'%3E${teacher.code.charAt(0)}%3C/text%3E%3C/svg%3E" alt="${teacher.name}">
      <h3>${teacher.name} ${permissionIcon}</h3>
    `;
    card.addEventListener("click", () => {
      showPasswordModalCallback(teacher);
    });
    teacherGrid.appendChild(card);
  });
}

/**
 * Erstellt ein HTML-Element für den Themenstatus
 * @param {string} status - Status des Themas
 * @returns {string} HTML für den Status-Badge
 */
export function createStatusBadge(status) {
  let className = "";
  let text = "";
  
  switch (status) {
    case THEME_STATUS.ACTIVE:
      className = "status-active";
      text = "Aktiv";
      break;
    case THEME_STATUS.COMPLETED:
      className = "status-completed";
      text = "Abgeschlossen";
      break;
    case THEME_STATUS.OVERDUE:
      className = "status-overdue";
      text = "Überfällig";
      break;
    default:
      className = "";
      text = status || "Unbekannt";
  }
  
  return `<span class="status-badge ${className}">${text}</span>`;
}

/**
 * Erstellt ein HTML-Element für den Schülerstatus
 * @param {string} status - Status des Schülers
 * @returns {string} HTML für den Status-Badge
 */
export function createStudentStatusBadge(status) {
  let className = "";
  let text = "";
  
  switch (status) {
    case STUDENT_STATUS.PENDING:
      className = "status-pending";
      text = "Offen";
      break;
    case STUDENT_STATUS.IN_PROGRESS:
      className = "status-in-progress";
      text = "In Bearbeitung";
      break;
    case STUDENT_STATUS.COMPLETED:
      className = "status-completed";
      text = "Bewertet";
      break;
    default:
      className = "";
      text = status || "Unbekannt";
  }
  
  return `<span class="status-badge ${className}">${text}</span>`;
}

/**
 * Erstellt HTML für die Fortschrittsanzeige eines Themas
 * @param {object} theme - Thema-Objekt
 * @returns {string} HTML für die Fortschrittsanzeige
 */
export function createThemeProgressHTML(theme) {
  if (!theme.students || theme.students.length === 0) {
    return '<div class="progress-bar empty">Keine Schüler</div>';
  }
  
  const total = theme.students.length;
  const completed = theme.students.filter(s => s.status === STUDENT_STATUS.COMPLETED).length;
  const inProgress = theme.students.filter(s => s.status === STUDENT_STATUS.IN_PROGRESS).length;
  const pending = total - completed - inProgress;
  
  const completedPercent = Math.round((completed / total) * 100);
  const inProgressPercent = Math.round((inProgress / total) * 100);
  const pendingPercent = 100 - completedPercent - inProgressPercent;
  
  return `
    <div class="progress-container" title="${completed} von ${total} Schülern bewertet">
      <div class="progress-bar">
        <div class="progress-segment completed" style="width: ${completedPercent}%"></div>
        <div class="progress-segment in-progress" style="width: ${inProgressPercent}%"></div>
        <div class="progress-segment pending" style="width: ${pendingPercent}%"></div>
      </div>
      <div class="progress-text">${completed}/${total} bewertet</div>
    </div>
  `;
}

/**
 * Füllt eine Select-Box mit Schuljahren
 * @param {HTMLSelectElement} selectElement - Select-Element
 * @param {string} currentValue - Aktuell ausgewählter Wert
 */
export function populateSchoolYearSelect(selectElement, currentValue = "") {
  if (!selectElement) return;
  
  selectElement.innerHTML = '<option value="">Alle Schuljahre</option>';
  
  // Aktuelles Schuljahr und die nächsten 3 Jahre
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < 4; i++) {
    const year = currentYear + i;
    const schoolYear = `${year}/${year + 1}`;
    
    const option = document.createElement("option");
    option.value = schoolYear;
    option.textContent = schoolYear;
    
    if (schoolYear === currentValue) {
      option.selected = true;
    }
    
    selectElement.appendChild(option);
  }
  
  // Verfügbare Schuljahre aus vorhandenen Themen
  const existingYears = new Set();
  
  allThemes.forEach(theme => {
    if (theme.school_year) {
      existingYears.add(theme.school_year);
    }
  });
  
  // Jahre hinzufügen, die nicht bereits in der Liste sind
  existingYears.forEach(year => {
    if (!Array.from(selectElement.options).some(opt => opt.value === year)) {
      const option = document.createElement("option");
      option.value = year;
      option.textContent = year;
      
      if (year === currentValue) {
        option.selected = true;
      }
      
      selectElement.appendChild(option);
    }
  });
}

/**
 * Füllt eine Select-Box mit Bewertungsrastern
 * @param {HTMLSelectElement} selectElement - Select-Element
 * @param {string} currentValue - Aktuell ausgewählter Wert
 */
export function populateAssessmentTemplateSelect(selectElement, currentValue = "standard") {
  if (!selectElement) return;
  
  selectElement.innerHTML = '';
  
  assessmentTemplates.forEach(template => {
    const option = document.createElement("option");
    option.value = template.id;
    option.textContent = template.name;
    
    if (template.id === currentValue) {
      option.selected = true;
    }
    
    selectElement.appendChild(option);
  });
}

/**
 * Füllt eine Select-Box mit Lehrern
 * @param {HTMLSelectElement} selectElement - Select-Element
 * @param {Array} teachers - Array mit Lehrer-Objekten
 * @param {string} currentValue - Aktuell ausgewählter Wert
 */
export function populateTeacherSelect(selectElement, teachers, currentValue = "") {
  if (!selectElement) return;
  
  selectElement.innerHTML = '<option value="">Bitte wählen...</option>';
  
  if (!teachers || teachers.length === 0) {
    return;
  }
  
  teachers.sort((a, b) => a.name.localeCompare(b.name)).forEach(teacher => {
    const option = document.createElement("option");
    option.value = teacher.code;
    option.textContent = teacher.name;
    
    if (teacher.code === currentValue) {
      option.selected = true;
    }
    
    selectElement.appendChild(option);
  });
}

/**
 * Erzeugt eine Farbe basierend auf einem String
 * @param {string} str - Eingabestring
 * @returns {string} Hexadezimale Farbdefinition
 */
export function stringToColor(str) {
  if (!str) return "#cccccc";
  
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
}

/**
 * Erzeugt einen Initialen-Avatar für einen Namen
 * @param {string} name - Name
 * @returns {string} HTML für den Avatar
 */
export function createInitialsAvatar(name) {
  if (!name) return '<div class="avatar">?</div>';
  
  const initials = name.split(' ')
    .map(n => n.charAt(0))
    .join('')
    .toUpperCase()
    .substring(0, 2);
  
  const backgroundColor = stringToColor(name);
  
  return `
    <div class="avatar" style="background-color: ${backgroundColor}">
      ${initials}
    </div>
  `;
}

/**
 * Extrahiert das Jahr aus einem ISO-Datum
 * @param {string} isoDateString - ISO-Datum (YYYY-MM-DD)
 * @returns {string} Jahr
 */
export function getYearFromDate(isoDateString) {
  return isoDateString ? isoDateString.split("-")[0] : "";
}

/**
 * Erstellt ein TXT-Export aus den Daten
 * @param {Array} data - Daten für den Export
 * @param {string} title - Titel des Exports
 * @returns {string} Formatierter Text
 */
export function createTextExport(data, title) {
  let output = `${title}\nExportiert am: ${new Date().toLocaleString("de-DE")}\n\n`;
  
  data.forEach((item, index) => {
    output += `#${index + 1}: ${item.title || item.name}\n`;
    
    // Füge alle Eigenschaften hinzu, die kein Array oder Objekt sind
    Object.entries(item).forEach(([key, value]) => {
      if (key !== 'title' && key !== 'name' && typeof value !== 'object') {
        output += `${key}: ${value}\n`;
      }
    });
    
    // Füge Schüler hinzu, wenn vorhanden
    if (item.students && Array.isArray(item.students)) {
      output += `\nSchüler:\n`;
      item.students.forEach(student => {
        output += `- ${student.name} (Status: ${student.status})\n`;
        
        if (student.assessment) {
          output += `  Bewertung:\n`;
          Object.entries(student.assessment).forEach(([key, value]) => {
            if (key !== 'updated_at') {
              output += `  - ${key}: ${value}\n`;
            }
          });
        }
      });
    }
    
    output += "\n" + "-".repeat(40) + "\n\n";
  });
  
  return output;
}

/**
 * Hilfsfunktion zum Herunterladen einer Datei
 * @param {string} filename - Dateiname
 * @param {string} content - Dateiinhalt
 * @param {string} contentType - MIME-Typ
 */
export function downloadFile(filename, content, contentType = "text/plain") {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Macht eine Tabelle sortierbar
 * @param {HTMLTableElement} table - Die Tabelle
 * @param {Array} data - Die Daten
 * @param {Function} renderFunction - Funktion zum Rendern der Zeilen
 */
export function makeTableSortable(table, data, renderFunction) {
  const headers = table.querySelectorAll('.sortable-header');
  let currentSort = { field: null, direction: 'asc' };
  
  headers.forEach(header => {
    header.addEventListener('click', () => {
      const field = header.dataset.sort;
      
      // Toggle Sortierrichtung
      if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
      }
      
      // Visuelles Feedback
      headers.forEach(h => {
        h.classList.remove('asc', 'desc');
        const icon = h.querySelector('.sort-icon');
        if (icon) icon.textContent = '↕';
      });
      
      header.classList.add(currentSort.direction);
      const icon = header.querySelector('.sort-icon');
      if (icon) {
        icon.textContent = currentSort.direction === 'asc' ? '↑' : '↓';
      }
      
      // Daten sortieren
      const sortedData = sortData(data, field, currentSort.direction);
      
      // Tabelle neu rendern
      renderFunction(sortedData);
    });
  });
}

/**
 * Sortiert Daten nach einem Feld
 */
export function sortData(data, field, direction = 'asc') {
  return [...data].sort((a, b) => {
    let aVal = a[field];
    let bVal = b[field];
    
    // Spezielle Behandlung für bestimmte Felder
    if (field === 'progress') {
      // Fortschritt berechnen
      aVal = a.students ? a.students.filter(s => s.status === STUDENT_STATUS.COMPLETED).length / a.students.length : 0;
      bVal = b.students ? b.students.filter(s => s.status === STUDENT_STATUS.COMPLETED).length / b.students.length : 0;
    } else if (field === 'deadline') {
      aVal = aVal ? new Date(aVal) : new Date('9999-12-31');
      bVal = bVal ? new Date(bVal) : new Date('9999-12-31');
    }
    
    // Vergleich
    if (aVal < bVal) return direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Filtert und sortiert Schüler für die Bewertungsansicht
 */
export function filterAndSortStudents(students, filterValue, sortField) {
  let filtered = [...students];
  
  // Filter anwenden
  if (filterValue) {
    filtered = filtered.filter(student => student.status === filterValue);
  }
  
  // Sortierung anwenden
  switch (sortField) {
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'class':
      filtered.sort((a, b) => (a.class || '').localeCompare(b.class || ''));
      break;
    case 'deadline':
      filtered.sort((a, b) => {
        const aDate = a.theme?.deadline ? new Date(a.theme.deadline) : new Date('9999-12-31');
        const bDate = b.theme?.deadline ? new Date(b.theme.deadline) : new Date('9999-12-31');
        return aDate - bDate;
      });
      break;
    case 'status':
      filtered.sort((a, b) => {
        const statusOrder = { 
          [STUDENT_STATUS.PENDING]: 0,
          [STUDENT_STATUS.IN_PROGRESS]: 1,
          [STUDENT_STATUS.COMPLETED]: 2
        };
        return statusOrder[a.status] - statusOrder[b.status];
      });
      break;
  }
  
  return filtered;
}
