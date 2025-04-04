import { showNotification, showLoader, hideLoader, getAvailableYears, getAvailableDates } from './utils.js';
import { getCurrentUser, getTeacherData, setTeacherData } from './auth.js';
import { saveTeacherData } from './database.js';

// Einstellungs-Jahresauswahl befüllen
export function populateSettingsYearSelect(settingsYearSelect) {
  const years = getAvailableYears();
  
  settingsYearSelect.innerHTML = '<option value="">Alle Jahre</option>';
  
  years.forEach(year => {
    const option = document.createElement('option');
    option.value = year;
    option.textContent = year;
    settingsYearSelect.appendChild(option);
  });
}

// Einstellungs-Datumsauswahl basierend auf ausgewähltem Jahr befüllen
export function populateSettingsDateSelect(selectedYear, settingsDateSelect) {
  const dates = getAvailableDates(selectedYear);
  
  settingsDateSelect.innerHTML = '<option value="">Alle Tage</option>';
  
  dates.forEach(date => {
    const option = document.createElement('option');
    option.value = date;
    option.textContent = formatDate(date);
    settingsDateSelect.appendChild(option);
  });
}

// Löschen aller Daten bestätigen
export function confirmDeleteAllData(verificationCode, updateAllTabs) {
  const currentUser = getCurrentUser();
  
  if (verificationCode !== currentUser.code) {
    showNotification("Falscher Bestätigungscode. Bitte geben Sie Ihren Lehrerkürzel ein.", "error");
    return;
  }
  
  if (confirm("Sind Sie sicher, dass Sie alle Ihre Daten löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.")) {
    deleteAllData(updateAllTabs);
  }
}

// Alle Daten löschen
export async function deleteAllData(updateAllTabs) {
  const currentUser = getCurrentUser();
  
  showLoader();
  
  // Lehrerdaten zurücksetzen
  const emptyData = {
    students: [],
    assessments: {}
  };
  
  // Leere Daten speichern
  const saved = await saveTeacherData(currentUser.code, currentUser.name, emptyData);
  
  if (saved) {
    // Lehrerdaten aktualisieren
    setTeacherData(emptyData);
    
    // Alle Tabs aktualisieren
    updateAllTabs();
    
    showNotification("Alle Daten wurden gelöscht.");
  }
  
  hideLoader();
}