// js/modules/topicsModule.js - Themenverwaltung mit Listenübersicht
import { getUserData } from "../authService.js";
import { showLoader, hideLoader, showNotification } from "../utils.js";
import { firestore } from "../config.js";
import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc, 
    addDoc, 
    deleteDoc,
    orderBy 
} from 'https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js';

let currentView = 'list'; // 'list' oder 'manage'
let selectedTopic = null;

export async function initTopicsModule() {
    const container = document.getElementById("mainContent");
    container.innerHTML = `
        <div class="topics-container">
            <div class="topics-header">
                <h2>Themen verwalten</h2>
                <div class="view-toggle">
                    <button class="btn ${currentView === 'list' ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="window.switchTopicView('list')">
                        <i class="fas fa-list"></i> Übersicht
                    </button>
                    <button class="btn ${currentView === 'manage' ? 'btn-primary' : 'btn-secondary'}" 
                            onclick="window.switchTopicView('manage')">
                        <i class="fas fa-edit"></i> Bearbeiten
                    </button>
                </div>
            </div>
            <div id="topicsContent" class="topics-content">
                <!-- Inhalt wird dynamisch geladen -->
            </div>
        </div>
    `;

    // Globale Funktionen für View-Wechsel
    window.switchTopicView = (view) => {
        currentView = view;
        if (view === 'list') {
            loadTopicsList();
        } else {
            loadTopicsManagement();
        }
        
        // Update Button-Styles
        document.querySelectorAll('.view-toggle button').forEach(btn => {
            if (btn.textContent.includes(view === 'list' ? 'Übersicht' : 'Bearbeiten')) {
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-primary');
            } else {
                btn.classList.remove('btn-primary');
                btn.classList.add('btn-secondary');
            }
        });
    };

    // Initial laden
    if (currentView === 'list') {
        await loadTopicsList();
    } else {
        await loadTopicsManagement();
    }
}

async function loadTopicsList() {
    const contentDiv = document.getElementById("topicsContent");
    
    try {
        showLoader();
        const user = getUserData();
        
        // Lade alle Themen des Lehrers
        const topicsQuery = query(
            collection(firestore, "topics"),
            where("teacherId", "==", user.uid),
            orderBy("createdAt", "desc")
        );
        
        const snapshot = await getDocs(topicsQuery);
        const topics = [];
        
        for (const doc of snapshot.docs) {
            const topicData = { id: doc.id, ...doc.data() };
            
            // Zähle Schüler pro Thema
            const studentsQuery = query(
                collection(firestore, "students"),
                where("topicId", "==", doc.id)
            );
            const studentsSnapshot = await getDocs(studentsQuery);
            topicData.studentCount = studentsSnapshot.size;
            
            topics.push(topicData);
        }
        
        let htmlContent = `
            <div class="topics-list">
                <div class="list-header">
                    <button class="btn btn-primary btn-large" onclick="window.switchTopicView('manage')">
                        <i class="fas fa-plus"></i> Neues Thema erstellen
                    </button>
                </div>
        `;
        
        if (topics.length === 0) {
            htmlContent += `
                <div class="empty-state">
                    <i class="fas fa-folder-open"></i>
                    <p>Keine Themen vorhanden</p>
                    <button class="btn btn-primary btn-large" onclick="window.switchTopicView('manage')">
                        <i class="fas fa-plus"></i> Erstes Thema erstellen
                    </button>
                </div>
            `;
        } else {
            htmlContent += `
                <div class="topics-grid">
                    ${topics.map(topic => `
                        <div class="topic-card" data-topic-id="${topic.id}">
                            <div class="topic-card-header">
                                <h3>${topic.title}</h3>
                                <div class="topic-actions">
                                    <button class="btn btn-sm btn-primary" 
                                            onclick="window.editTopic('${topic.id}')"
                                            title="Bearbeiten">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" 
                                            onclick="window.deleteTopic('${topic.id}')"
                                            title="Löschen">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            <div class="topic-card-body">
                                <p class="topic-description">${topic.description || 'Keine Beschreibung'}</p>
                                <div class="topic-stats">
                                    <span class="stat">
                                        <i class="fas fa-users"></i> ${topic.studentCount} Schüler
                                    </span>
                                    <span class="stat">
                                        <i class="fas fa-clock"></i> ${formatDate(topic.createdAt)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }
        
        htmlContent += '</div>';
        contentDiv.innerHTML = htmlContent;
        
        // Event-Handler registrieren
        window.editTopic = async (topicId) => {
            selectedTopic = topics.find(t => t.id === topicId);
            currentView = 'manage';
            await loadTopicsManagement();
        };
        
        window.deleteTopic = async (topicId) => {
            if (confirm('Möchten Sie dieses Thema wirklich löschen? Alle zugehörigen Schülerdaten werden ebenfalls gelöscht.')) {
                try {
                    showLoader();
                    
                    // Lösche alle Schüler des Themas
                    const studentsQuery = query(
                        collection(firestore, "students"),
                        where("topicId", "==", topicId)
                    );
                    const studentsSnapshot = await getDocs(studentsQuery);
                    
                    for (const studentDoc of studentsSnapshot.docs) {
                        await deleteDoc(doc(firestore, "students", studentDoc.id));
                    }
                    
                    // Lösche das Thema
                    await deleteDoc(doc(firestore, "topics", topicId));
                    
                    showNotification("Thema erfolgreich gelöscht", "success");
                    await loadTopicsList();
                } catch (error) {
                    console.error("Fehler beim Löschen:", error);
                    showNotification("Fehler beim Löschen des Themas", "error");
                } finally {
                    hideLoader();
                }
            }
        };
        
    } catch (error) {
        console.error("Fehler beim Laden der Themen:", error);
        contentDiv.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Fehler beim Laden der Themen</p>
            </div>
        `;
    } finally {
        hideLoader();
    }
}

async function loadTopicsManagement() {
    const contentDiv = document.getElementById("topicsContent");
    const user = getUserData();
    
    try {
        showLoader();
        
        // Lade bestehende Themen
        const topicsQuery = query(
            collection(firestore, "topics"),
            where("teacherId", "==", user.uid)
        );
        const snapshot = await getDocs(topicsQuery);
        const topics = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        let htmlContent = `
            <div class="topics-management">
                <div class="back-button-container">
                    <button class="btn btn-secondary btn-large" onclick="window.switchTopicView('list')">
                        <i class="fas fa-arrow-left"></i> Zur Übersicht
                    </button>
                </div>
                
                <div class="topic-form-section">
                    <h3>${selectedTopic ? 'Thema bearbeiten' : 'Neues Thema erstellen'}</h3>
                    <form id="topicForm" class="topic-form">
                        <div class="form-group">
                            <label for="topicTitle">Thema-Titel*</label>
                            <input 
                                type="text" 
                                id="topicTitle" 
                                class="form-control" 
                                value="${selectedTopic ? selectedTopic.title : ''}"
                                required
                            >
                        </div>
                        <div class="form-group">
                            <label for="topicDescription">Beschreibung</label>
                            <textarea 
                                id="topicDescription" 
                                class="form-control" 
                                rows="3"
                            >${selectedTopic ? selectedTopic.description || '' : ''}</textarea>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary btn-large">
                                <i class="fas fa-save"></i> 
                                ${selectedTopic ? 'Änderungen speichern' : 'Thema erstellen'}
                            </button>
                            ${selectedTopic ? `
                                <button type="button" class="btn btn-secondary btn-large" 
                                        onclick="window.cancelEdit()">
                                    <i class="fas fa-times"></i> Abbrechen
                                </button>
                            ` : ''}
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        contentDiv.innerHTML = htmlContent;
        
        // Form Handler
        document.getElementById("topicForm").addEventListener("submit", async (e) => {
            e.preventDefault();
            
            const title = document.getElementById("topicTitle").value.trim();
            const description = document.getElementById("topicDescription").value.trim();
            
            if (!title) {
                showNotification("Bitte geben Sie einen Titel ein", "error");
                return;
            }
            
            try {
                showLoader();
                
                if (selectedTopic) {
                    // Update existing topic
                    await updateDoc(doc(firestore, "topics", selectedTopic.id), {
                        title,
                        description,
                        updatedAt: new Date()
                    });
                    showNotification("Thema erfolgreich aktualisiert", "success");
                } else {
                    // Create new topic
                    await addDoc(collection(firestore, "topics"), {
                        title,
                        description,
                        teacherId: user.uid,
                        teacherName: user.name,
                        createdAt: new Date(),
                        updatedAt: new Date()
                    });
                    showNotification("Thema erfolgreich erstellt", "success");
                }
                
                selectedTopic = null;
                currentView = 'list';
                await loadTopicsList();
                
            } catch (error) {
                console.error("Fehler beim Speichern:", error);
                showNotification("Fehler beim Speichern des Themas", "error");
            } finally {
                hideLoader();
            }
        });
        
        // Cancel Edit Handler
        window.cancelEdit = () => {
            selectedTopic = null;
            loadTopicsManagement();
        };
        
    } catch (error) {
        console.error("Fehler beim Laden:", error);
        contentDiv.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Fehler beim Laden der Themenverwaltung</p>
            </div>
        `;
    } finally {
        hideLoader();
    }
}

function formatDate(date) {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('de-DE');
}

// CSS für das Topics-Modul
const topicsStyles = `
<style>
.topics-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.topics-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.view-toggle {
    display: flex;
    gap: 10px;
}

.topics-content {
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.list-header {
    margin-bottom: 20px;
}

.topics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
}

.topic-card {
    background: #f8f9fa;
    border: 1px solid #e9ecef;
    border-radius: 8px;
    padding: 20px;
    transition: all 0.3s ease;
}

.topic-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.topic-card-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 15px;
}

.topic-card-header h3 {
    margin: 0;
    color: var(--primary-color);
    font-size: 18px;
}

.topic-actions {
    display: flex;
    gap: 5px;
}

.topic-description {
    color: #666;
    margin-bottom: 15px;
    line-height: 1.5;
}

.topic-stats {
    display: flex;
    gap: 20px;
    font-size: 14px;
    color: #999;
}

.stat {
    display: flex;
    align-items: center;
    gap: 5px;
}

.back-button-container {
    margin-bottom: 20px;
}

.topic-form-section {
    max-width: 600px;
}

.topic-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
}

.form-group label {
    margin-bottom: 5px;
    font-weight: 500;
    color: #333;
}

.form-control {
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
}

.form-control:focus {
    outline: none;
    border-color: var(--primary-color);
}

.form-actions {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.empty-state {
    text-align: center;
    padding: 60px 20px;
    color: #999;
}

.empty-state i {
    font-size: 64px;
    margin-bottom: 20px;
}

.empty-state p {
    font-size: 18px;
    margin-bottom: 20px;
}

/* Größere Buttons */
.btn-large {
    padding: 12px 24px !important;
    font-size: 16px !important;
}

.btn-sm {
    padding: 8px 12px !important;
    font-size: 14px !important;
}
</style>
`;

// Füge Styles beim Laden des Moduls hinzu
if (!document.getElementById('topics-module-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'topics-module-styles';
    styleElement.innerHTML = topicsStyles;
    document.head.appendChild(styleElement);
}
