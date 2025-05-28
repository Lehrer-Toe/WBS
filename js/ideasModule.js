// js/modules/ideasModule.js - Projektideen-Verwaltung
import { currentUser, getUserData } from "../authService.js";
import { showLoader, hideLoader, showNotification } from "../uiService.js";
import { db } from "../firebaseClient.js";

/**
 * Verfügbare Fächer
 */
export const AVAILABLE_SUBJECTS = [
    { id: 'D', name: 'Deutsch' },
    { id: 'M', name: 'Mathematik' },
    { id: 'E', name: 'Englisch' },
    { id: 'FR', name: 'Französisch' },
    { id: 'AES', name: 'AES' },
    { id: 'T', name: 'Technik' },
    { id: 'GE', name: 'Geschichte' },
    { id: 'GK', name: 'Gemeinschaftskunde' },
    { id: 'BK', name: 'Bildende Kunst' },
    { id: 'IT', name: 'Informatik' },
    { id: 'BIO', name: 'Biologie' },
    { id: 'SP', name: 'Sport' },
    { id: 'CH', name: 'Chemie' },
    { id: 'PH', name: 'Physik' },
    { id: 'WBS', name: 'WBS' },
    { id: 'REL', name: 'Religion' },
    { id: 'ETH', name: 'Ethik' },
    { id: 'MU', name: 'Musik' },
    { id: 'EK', name: 'Erdkunde' }
];

/**
 * Globale Variable für alle Ideen
 */
let allIdeas = [];

/**
 * DOM-Elemente
 */
let elements = {
    ideasContainer: null,
    ideasList: null,
    newIdeaBtn: null,
    subjectFilter: null,
    searchInput: null,
    
    // Ideen-Modal
    ideaModal: null,
    ideaForm: null,
    ideaTitleInput: null,
    ideaDescriptionInput: null,
    ideaSubjectsContainer: null,
    saveIdeaBtn: null,
    cancelIdeaBtn: null,
    closeIdeaModal: null,
    
    // Character counter
    descriptionCounter: null
};

/**
 * Zustand
 */
let selectedIdea = null;
let editMode = false;
let currentFilter = '';
let currentSearch = '';

/**
 * Initialisiert das Ideen-Modul
 */
export async function initIdeasModule() {
    loadDOMElements();
    
    if (!elements.ideasContainer) {
        console.error("Ideen-Container nicht gefunden");
        return;
    }
    
    setupEventListeners();
    await loadAllIdeas();
    createSubjectFilter();
    updateIdeasList();
}

/**
 * Lädt alle DOM-Elemente
 */
function loadDOMElements() {
    elements.ideasContainer = document.getElementById("ideas-tab");
    elements.ideasList = document.getElementById("ideasList");
    elements.newIdeaBtn = document.getElementById("newIdeaBtn");
    elements.subjectFilter = document.getElementById("subjectFilter");
    elements.searchInput = document.getElementById("ideasSearchInput");
    
    // Modal-Elemente
    elements.ideaModal = document.getElementById("ideaModal");
    elements.ideaForm = document.getElementById("ideaForm");
    elements.ideaTitleInput = document.getElementById("ideaTitleInput");
    elements.ideaDescriptionInput = document.getElementById("ideaDescriptionInput");
    elements.ideaSubjectsContainer = document.getElementById("ideaSubjectsContainer");
    elements.saveIdeaBtn = document.getElementById("saveIdeaBtn");
    elements.cancelIdeaBtn = document.getElementById("cancelIdeaBtn");
    elements.closeIdeaModal = document.getElementById("closeIdeaModal");
    elements.descriptionCounter = document.getElementById("descriptionCounter");
}

/**
 * Richtet Event-Listener ein
 */
function setupEventListeners() {
    // Neue Idee erstellen
    if (elements.newIdeaBtn) {
        elements.newIdeaBtn.addEventListener("click", showNewIdeaModal);
    }
    
    // Filter und Suche
    if (elements.subjectFilter) {
        elements.subjectFilter.addEventListener("change", handleFilterChange);
    }
    
    if (elements.searchInput) {
        elements.searchInput.addEventListener("input", handleSearchChange);
    }
    
    // Modal-Events
    if (elements.cancelIdeaBtn) {
        elements.cancelIdeaBtn.addEventListener("click", hideIdeaModal);
    }
    
    if (elements.closeIdeaModal) {
        elements.closeIdeaModal.addEventListener("click", hideIdeaModal);
    }
    
    if (elements.ideaForm) {
        elements.ideaForm.addEventListener("submit", saveIdea);
    }
    
    // Beschreibung Character Counter
    if (elements.ideaDescriptionInput) {
        elements.ideaDescriptionInput.addEventListener("input", updateCharacterCounter);
    }
}

/**
 * Lädt alle Ideen aus Firebase
 */
async function loadAllIdeas() {
    if (!db) {
        console.error("Firestore ist nicht initialisiert!");
        allIdeas = [];
        return false;
    }
    
    try {
        showLoader();
        
        const snapshot = await db.collection("project_ideas").orderBy("createdAt", "desc").get();
        
        allIdeas = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        
        console.log(`${allIdeas.length} Projektideen geladen`);
        return true;
    } catch (error) {
        console.error("Fehler beim Laden der Ideen:", error);
        allIdeas = [];
        return false;
    } finally {
        hideLoader();
    }
}

/**
 * Erstellt den Fächer-Filter
 */
function createSubjectFilter() {
    if (!elements.subjectFilter) return;
    
    elements.subjectFilter.innerHTML = '<option value="">Alle Fächer</option>';
    
    AVAILABLE_SUBJECTS.forEach(subject => {
        const option = document.createElement("option");
        option.value = subject.id;
        option.textContent = subject.name;
        elements.subjectFilter.appendChild(option);
    });
}

/**
 * Behandelt Filter-Änderungen
 */
function handleFilterChange(event) {
    currentFilter = event.target.value;
    updateIdeasList();
}

/**
 * Behandelt Such-Änderungen
 */
function handleSearchChange(event) {
    currentSearch = event.target.value.toLowerCase().trim();
    updateIdeasList();
}

/**
 * Aktualisiert die Liste der Ideen
 */
function updateIdeasList() {
    if (!elements.ideasList) return;
    
    // Filtern und suchen
    let filteredIdeas = [...allIdeas];
    
    // Nach Fach filtern
    if (currentFilter) {
        filteredIdeas = filteredIdeas.filter(idea => 
            idea.subjects && idea.subjects.includes(currentFilter)
        );
    }
    
    // Nach Suchbegriff filtern
    if (currentSearch) {
        filteredIdeas = filteredIdeas.filter(idea =>
            idea.title.toLowerCase().includes(currentSearch) ||
            idea.description.toLowerCase().includes(currentSearch)
        );
    }
    
    // Liste leeren
    elements.ideasList.innerHTML = "";
    
    if (filteredIdeas.length === 0) {
        elements.ideasList.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">💡</div>
                <h3>Keine Ideen gefunden</h3>
                <p>${currentFilter || currentSearch ? 'Keine Ideen entsprechen Ihren Filterkriterien.' : 'Noch keine Projektideen vorhanden.'}</p>
                <button class="btn-primary btn-large" onclick="window.showNewIdeaModal()">
                    Erste Idee erstellen
                </button>
            </div>
        `;
        
        // Global verfügbar machen
        window.showNewIdeaModal = showNewIdeaModal;
        
        return;
    }
    
    // Ideen als Liste anzeigen
    filteredIdeas.forEach(idea => {
        const ideaItem = createIdeaListItem(idea);
        elements.ideasList.appendChild(ideaItem);
    });
}

/**
 * Erstellt ein Listen-Element für eine Idee
 */
function createIdeaListItem(idea) {
    const listItem = document.createElement("div");
    listItem.className = "idea-list-item";
    listItem.dataset.ideaId = idea.id;
    
    // Fächer-Tags erstellen
    const subjectTags = (idea.subjects || []).map(subjectId => {
        const subject = AVAILABLE_SUBJECTS.find(s => s.id === subjectId);
        return `<span class="subject-tag">${subject ? subject.name : subjectId}</span>`;
    }).join("");
    
    // Datum formatieren
    const createdDate = idea.createdAt ? 
        new Date(idea.createdAt.seconds * 1000).toLocaleDateString('de-DE') : 
        'Unbekannt';
    
    // Kann der aktuelle Benutzer diese Idee bearbeiten?
    const canEdit = idea.createdBy === currentUser.uid;
    
    listItem.innerHTML = `
        <div class="idea-header">
            <h3 class="idea-title">${idea.title}</h3>
            <div class="idea-actions">
                ${canEdit ? `
                    <button class="btn-edit-idea btn-compact" data-idea-id="${idea.id}" title="Bearbeiten">
                        <span class="edit-icon">✒️</span>
                    </button>
                ` : ''}
            </div>
        </div>
        <div class="idea-description">
            ${idea.description}
        </div>
        <div class="idea-subjects">
            ${subjectTags}
        </div>
        <div class="idea-meta">
            <span class="idea-author">von ${idea.createdByName || 'Unbekannt'}</span>
            <span class="idea-date">${createdDate}</span>
        </div>
    `;
    
    // Event-Listener für Bearbeiten-Button
    const editBtn = listItem.querySelector(".btn-edit-idea");
    if (editBtn) {
        editBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            showEditIdeaModal(idea);
        });
    }
    
    return listItem;
}

/**
 * Zeigt Modal für neue Idee
 */
function showNewIdeaModal() {
    editMode = false;
    selectedIdea = null;
    
    // Formular zurücksetzen
    if (elements.ideaForm) {
        elements.ideaForm.reset();
    }
    
    // Fächer-Checkboxen erstellen
    createSubjectCheckboxes();
    
    // Character Counter zurücksetzen
    updateCharacterCounter();
    
    // Modal anzeigen
    if (elements.ideaModal) {
        elements.ideaModal.style.display = "flex";
        if (elements.ideaTitleInput) {
            elements.ideaTitleInput.focus();
        }
    }
}

/**
 * Zeigt Modal zum Bearbeiten einer Idee
 */
function showEditIdeaModal(idea) {
    editMode = true;
    selectedIdea = idea;
    
    // Formular mit Daten füllen
    if (elements.ideaTitleInput) {
        elements.ideaTitleInput.value = idea.title || "";
    }
    if (elements.ideaDescriptionInput) {
        elements.ideaDescriptionInput.value = idea.description || "";
    }
    
    // Fächer-Checkboxen erstellen und auswählen
    createSubjectCheckboxes(idea.subjects || []);
    
    // Character Counter aktualisieren
    updateCharacterCounter();
    
    // Modal anzeigen
    if (elements.ideaModal) {
        elements.ideaModal.style.display = "flex";
        if (elements.ideaTitleInput) {
            elements.ideaTitleInput.focus();
        }
    }
}

/**
 * Versteckt das Ideen-Modal
 */
function hideIdeaModal() {
    if (elements.ideaModal) {
        elements.ideaModal.style.display = "none";
    }
    
    selectedIdea = null;
    editMode = false;
}

/**
 * Erstellt Fächer-Checkboxen
 */
function createSubjectCheckboxes(selectedSubjects = []) {
    if (!elements.ideaSubjectsContainer) return;
    
    elements.ideaSubjectsContainer.innerHTML = "";
    
    AVAILABLE_SUBJECTS.forEach(subject => {
        const checkboxDiv = document.createElement("div");
        checkboxDiv.className = "checkbox-item";
        
        const isChecked = selectedSubjects.includes(subject.id);
        
        checkboxDiv.innerHTML = `
            <label class="checkbox-label">
                <input type="checkbox" value="${subject.id}" ${isChecked ? 'checked' : ''}>
                <span class="checkbox-text">${subject.name}</span>
            </label>
        `;
        
        elements.ideaSubjectsContainer.appendChild(checkboxDiv);
    });
}

/**
 * Aktualisiert den Character Counter
 */
function updateCharacterCounter() {
    if (!elements.ideaDescriptionInput || !elements.descriptionCounter) return;
    
    const currentLength = elements.ideaDescriptionInput.value.length;
    const maxLength = 250;
    const remaining = maxLength - currentLength;
    
    elements.descriptionCounter.textContent = `${remaining} Zeichen übrig`;
    elements.descriptionCounter.className = `character-counter ${remaining < 20 ? 'warning' : ''}`;
    
    // Input begrenzen
    if (currentLength > maxLength) {
        elements.ideaDescriptionInput.value = elements.ideaDescriptionInput.value.substring(0, maxLength);
        elements.descriptionCounter.textContent = "0 Zeichen übrig";
        elements.descriptionCounter.className = "character-counter warning";
    }
}

/**
 * Speichert eine Idee
 */
async function saveIdea(event) {
    event.preventDefault();
    
    const title = elements.ideaTitleInput.value.trim();
    const description = elements.ideaDescriptionInput.value.trim();
    
    if (!title) {
        showNotification("Bitte geben Sie einen Titel ein.", "warning");
        return;
    }
    
    if (!description) {
        showNotification("Bitte geben Sie eine Beschreibung ein.", "warning");
        return;
    }
    
    if (description.length > 250) {
        showNotification("Die Beschreibung darf maximal 250 Zeichen haben.", "warning");
        return;
    }
    
    // Ausgewählte Fächer sammeln
    const selectedSubjects = [];
    const checkboxes = elements.ideaSubjectsContainer.querySelectorAll('input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedSubjects.push(checkbox.value);
    });
    
    if (selectedSubjects.length === 0) {
        showNotification("Bitte wählen Sie mindestens ein Fach aus.", "warning");
        return;
    }
    
    try {
        showLoader();
        
        const ideaData = {
            title,
            description,
            subjects: selectedSubjects,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (editMode && selectedIdea) {
            // Idee aktualisieren
            await db.collection("project_ideas").doc(selectedIdea.id).update(ideaData);
            
            // Lokale Kopie aktualisieren
            const index = allIdeas.findIndex(idea => idea.id === selectedIdea.id);
            if (index !== -1) {
                allIdeas[index] = { ...allIdeas[index], ...ideaData };
            }
            
            showNotification("Idee erfolgreich aktualisiert.", "success");
        } else {
            // Neue Idee erstellen
            const newIdeaData = {
                ...ideaData,
                createdBy: currentUser.uid,
                createdByName: currentUser.name,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const docRef = await db.collection("project_ideas").add(newIdeaData);
            
            // Zur lokalen Liste hinzufügen
            allIdeas.unshift({
                id: docRef.id,
                ...newIdeaData
            });
            
            showNotification("Idee erfolgreich erstellt.", "success");
        }
        
        // Modal schließen und Liste aktualisieren
        hideIdeaModal();
        updateIdeasList();
        
    } catch (error) {
        console.error("Fehler beim Speichern der Idee:", error);
        showNotification("Fehler beim Speichern der Idee: " + error.message, "error");
    } finally {
        hideLoader();
    }
}
