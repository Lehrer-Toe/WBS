/**
 * Export module for WBS Bewertungssystem
 * Handles export functionality (JSON and DOCX)
 */

/**
 * Exportiert die Bewertungsdaten als DOCX oder JSON
 */
async function exportData() {
  const exportAsDOCX = document.getElementById('exportDOCX').checked;
  
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
  
  if (exportAsDOCX) {
    await exportToDOCX(filteredStudents, selectedYear, selectedDate);
  } else {
    exportToJSON(filteredStudents, selectedYear, selectedDate);
  }
}

/**
 * Exportiert die Daten als JSON-Datei
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
  } catch (error) {
    console.error("Fehler beim JSON-Export:", error);
    showNotification("Fehler beim Erstellen der JSON-Datei: " + error.message, "error");
  }
}

/**
 * Exportiert die Daten als DOCX-Datei mit einer einfacheren, robusteren Methode
 */
async function exportToDOCX(filteredStudents, selectedYear, selectedDate) {
  try {
    // Dynamisch die DOCX-Bibliothek laden, falls sie noch nicht geladen ist
    if (typeof docx === 'undefined') {
      const script = document.createElement('script');
      script.src = "https://unpkg.com/docx@7.1.0/build/index.js";
      document.head.appendChild(script);
      
      await new Promise((resolve, reject) => {
        script.onload = resolve;
        script.onerror = reject;
        // Timeout als Fallback
        setTimeout(resolve, 3000);
      });
    }
    
    showLoader();
    
    // Warten, bis docx verfügbar ist
    if (typeof docx === 'undefined') {
      throw new Error("DOCX-Bibliothek konnte nicht geladen werden");
    }
    
    // Einfacherer DOCX-Export mit weniger Anpassungen
    const {
      Document, Paragraph, TextRun, Table, TableCell, 
      TableRow, BorderStyle, AlignmentType, HeadingLevel
    } = docx;
    
    // Dokument erstellen
    const doc = new Document();
    
    // Titel
    doc.addSection({
      children: [
        new Paragraph({
          text: "WBS Bewertungen",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          text: `Lehrer: ${currentUser.name} (${currentUser.code})`,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          text: `Exportiert am: ${new Date().toLocaleDateString('de-DE')}`,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({
          text: `Filter: ${selectedYear ? 'Jahr ' + selectedYear : 'Alle Jahre'}${selectedDate ? ', Datum ' + formatDate(selectedDate) : ''}`,
          alignment: AlignmentType.CENTER
        }),
        new Paragraph({ text: "" })
      ]
    });
    
    // Für jeden Schüler einen Abschnitt hinzufügen
    filteredStudents.forEach(student => {
      const assessment = teacherData.assessments[student.id] || {};
      const avgGrade = calculateAverageGrade(assessment);
      const finalGrade = assessment.finalGrade || avgGrade || '-';
      const infoText = assessment.infoText || '';
      
      // Schüler-Überschrift
      const studentSection = [
        new Paragraph({
          text: student.name,
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph({
          text: `Prüfungsdatum: ${formatDate(student.examDate)}`
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          text: "Informationen zum Prüfling:",
          bold: true
        }),
        new Paragraph({
          text: infoText || "Keine Informationen vorhanden"
        }),
        new Paragraph({ text: "" })
      ];
      
      // Tabelle mit Bewertungen
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Kriterium", bold: true })],
              width: { size: 50, type: "%" }
            }),
            new TableCell({
              children: [new Paragraph({ text: "Note", bold: true })],
              width: { size: 50, type: "%" }
            })
          ]
        })
      ];
      
      // Zeilen für jede Kategorie
      ASSESSMENT_CATEGORIES.forEach(category => {
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ text: category.name })]
              }),
              new TableCell({
                children: [new Paragraph({ 
                  text: assessment[category.id]?.toString() || "-" 
                })]
              })
            ]
          })
        );
      });
      
      // Zeilen für Durchschnitt und Endnote
      tableRows.push(
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Durchschnitt", bold: true })]
            }),
            new TableCell({
              children: [new Paragraph({ 
                text: avgGrade || "-", bold: true 
              })]
            })
          ]
        }),
        new TableRow({
          children: [
            new TableCell({
              children: [new Paragraph({ text: "Endnote", bold: true })]
            }),
            new TableCell({
              children: [new Paragraph({ 
                text: finalGrade.toString(), bold: true 
              })]
            })
          ]
        })
      );
      
      // Tabelle erstellen
      const gradeTable = new Table({
        rows: tableRows,
        width: { size: 100, type: "%" },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1 },
          bottom: { style: BorderStyle.SINGLE, size: 1 },
          left: { style: BorderStyle.SINGLE, size: 1 },
          right: { style: BorderStyle.SINGLE, size: 1 },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 1 },
          insideVertical: { style: BorderStyle.SINGLE, size: 1 }
        }
      });
      
      studentSection.push(gradeTable);
      studentSection.push(new Paragraph({ text: "" }));
      studentSection.push(new Paragraph({ 
        text: "=".repeat(40), 
        alignment: AlignmentType.CENTER 
      }));
      studentSection.push(new Paragraph({ text: "" }));
      
      // Schülerabschnitt hinzufügen
      doc.addSection({ children: studentSection });
    });
    
    // Datei generieren und herunterladen
    docx.Packer.toBlob(doc).then(blob => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      
      // Dateiname mit Datum
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      let filename = `wbs_bewertungen_${dateStr}`;
      
      if (selectedYear) filename += `_${selectedYear}`;
      if (selectedDate) filename += `_${formatDate(selectedDate).replace(/\./g, "-")}`;
      
      link.download = `${filename}.docx`;
      link.click();
      URL.revokeObjectURL(url);
      
      showNotification("Bewertungen wurden als DOCX-Datei exportiert.");
      hideLoader();
    }).catch(error => {
      console.error("DOCX-Generierungsfehler:", error);
      showNotification("Fehler beim Generieren der DOCX-Datei. Versuche JSON-Export.", "error");
      hideLoader();
      
      // Fallback zu JSON, wenn DOCX fehlschlägt
      exportToJSON(filteredStudents, selectedYear, selectedDate);
    });
  } catch (error) {
    console.error("Fehler beim DOCX-Export:", error);
    showNotification("DOCX-Export fehlgeschlagen: " + error.message, "error");
    hideLoader();
    
    // Fallback zu JSON
    exportToJSON(filteredStudents, selectedYear, selectedDate);
  }
}