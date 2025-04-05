/**
 * Exportiert die Bewertungsdaten als JSON
 */
function exportToJSON(filteredStudents, selectedYear, selectedDate) {
  try {
    const exportObject = {
      teacher: {
        name: currentUser.name,
        code: currentUser.code
      },
      filters: { 
        year: selectedYear || "Alle", 
        date: selectedDate ? formatDate(selectedDate) : "Alle" 
      },
      exportDate: new Date().toLocaleDateString('de-DE'),
      students: filteredStudents.map(s => {
        const a = teacherData.assessments[s.id] || {};
        return {
          id: s.id,
          name: s.name,
          examDate: formatDate(s.examDate),
          createdAt: s.createdAt,
          infoText: a.infoText || '',
          finalGrade: a.finalGrade,
          avgGrade: calculateAverageGrade(a),
          categories: ASSESSMENT_CATEGORIES.reduce((obj, cat) => {
            obj[cat.name] = a[cat.id] || '-';
            return obj;
          }, {})
        };
      })
    };
    
    const jsonString = JSON.stringify(exportObject, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    
    // Dateiname mit Datum
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    let filename = `wbs_export_${dateStr}`;
    
    if (selectedYear) filename += `_${selectedYear}`;
    if (selectedDate) filename += `_${formatDate(selectedDate).replace(/\./g, "-")}`;
    
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification("Bewertungen wurden als JSON-Datei exportiert.");
    return true;
  } catch (error) {
    console.error("Fehler beim JSON-Export:", error);
    showNotification("Fehler beim Erstellen der JSON-Datei: " + error.message, "error");
    return false;
  }
}

/**
 * Exportiert die Bewertungsdaten als TXT
 */
function exportToTXT(filteredStudents, selectedYear, selectedDate) {
  try {
    let textContent = "WBS BEWERTUNGSSYSTEM - EXPORT\n";
    textContent += "==============================\n\n";
    textContent += `Lehrer: ${currentUser.name} (${currentUser.code})\n`;
    textContent += `Exportdatum: ${new Date().toLocaleDateString('de-DE')}\n`;
    textContent += `Filter: Jahr ${selectedYear || "Alle"}, Datum ${selectedDate ? formatDate(selectedDate) : "Alle"}\n\n`;
    textContent += "PRÜFLINGE\n";
    textContent += "=========\n\n";
    
    filteredStudents.forEach(student => {
      const a = teacherData.assessments[student.id] || {};
      const avgGrade = calculateAverageGrade(a);
      const finalGrade = a.finalGrade || avgGrade || '-';
      
      textContent += `Name: ${student.name}\n`;
      textContent += `Datum: ${formatDate(student.examDate)}\n`;
      textContent += `Endnote: ${finalGrade}\n`;
      textContent += `Durchschnitt: ${avgGrade || '-'}\n\n`;
      
      // Bewertungskategorien
      textContent += "Bewertungen:\n";
      ASSESSMENT_CATEGORIES.forEach(category => {
        textContent += `- ${category.name}: ${a[category.id] || '-'}\n`;
      });
      
      // Infotext, falls vorhanden
      if (a.infoText && a.infoText.trim()) {
        textContent += "\nInformationen:\n";
        textContent += a.infoText + "\n";
      }
      
      textContent += "\n---------------------------\n\n";
    });
    
    const blob = new Blob([textContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    
    // Dateiname mit Datum
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    let filename = `wbs_export_${dateStr}`;
    
    if (selectedYear) filename += `_${selectedYear}`;
    if (selectedDate) filename += `_${formatDate(selectedDate).replace(/\./g, "-")}`;
    
    link.download = `${filename}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification("Bewertungen wurden als TXT-Datei exportiert.");
    return true;
  } catch (error) {
    console.error("Fehler beim TXT-Export:", error);
    showNotification("Fehler beim Erstellen der TXT-Datei: " + error.message, "error");
    return false;
  }
}

/**
 * Exportiert die Bewertungsdaten
 */
async function exportData() {
  const exportAsTXT = document.getElementById('exportTXT').checked;
  
  // Filter anwenden
  const selectedYear = settingsYearSelect.value;
  const selectedDate = settingsDateSelect.value;
  let filteredStudents = [...teacherData.students];
  
  if (selectedYear) {
    filteredStudents = filteredStudents.filter(s => getYearFromDate(s.examDate) === selectedYear);
  }
  if (selectedDate) {
    filteredStudents = filteredStudents.filter(s => s.examDate === selectedDate);
  }
  
  // Sortiere Schüler nach Datum und Namen
  filteredStudents.sort((a, b) => {
    const dateComp = new Date(b.examDate) - new Date(a.examDate);
    if (dateComp !== 0) return dateComp;
    return a.name.localeCompare(b.name);
  });
  
  if (filteredStudents.length === 0) {
    showNotification("Keine Daten zum Exportieren gefunden.", "warning");
    return;
  }
  
  // Je nach ausgewähltem Format exportieren
  if (exportAsTXT) {
    exportToTXT(filteredStudents, selectedYear, selectedDate);
  } else {
    exportToJSON(filteredStudents, selectedYear, selectedDate);
  }
}