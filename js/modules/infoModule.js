// js/modules/infoModule.js - Informationen für Lehrer
import { 
    systemSettings, 
    systemInformations, 
    loadSystemInformations, 
    formatDateForDisplay, 
    getDaysUntil 
} from "../adminService.js";
import { showLoader, hideLoader, showNotification } from "../utils.js";

export async function initInfoModule() {
    const container = document.getElementById("mainContent");
    container.innerHTML = `
        <div class="info-container">
            <h2>Informationen</h2>
            <div id="infoContent" class="info-content">
                <div class="loading-spinner">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Lade Informationen...</p>
                </div>
            </div>
        </div>
    `;

    await loadInformations();
}

async function loadInformations() {
    const contentDiv = document.getElementById("infoContent");
    
    try {
        showLoader();
        
        // Lade System-Informationen
        await loadSystemInformations();
        
        // Aktuelle Systemeinstellungen laden
        const settings = systemSettings;
        const infos = systemInformations;
        
        let htmlContent = `
            <div class="info-section">
                <h3><i class="fas fa-calendar-alt"></i> Aktuelles Schuljahr</h3>
                <div class="info-card">
                    <p class="school-year">${settings.currentSchoolYear || 'Nicht definiert'}</p>
                </div>
            </div>
        `;
        
        // Admin-Nachrichten anzeigen
        if (infos && infos.length > 0) {
            htmlContent += `
                <div class="info-section">
                    <h3><i class="fas fa-bullhorn"></i> Aktuelle Mitteilungen</h3>
                    <div class="messages-container">
            `;
            
            infos.forEach(info => {
                const isActive = info.active && 
                    (!info.validFrom || new Date(info.validFrom) <= new Date()) &&
                    (!info.validUntil || new Date(info.validUntil) >= new Date());
                
                if (isActive) {
                    htmlContent += `
                        <div class="message-card ${info.priority || 'normal'}">
                            <div class="message-header">
                                <h4>${info.title}</h4>
                                ${info.priority === 'high' ? '<span class="priority-badge">Wichtig</span>' : ''}
                            </div>
                            <div class="message-content">
                                ${info.content}
                            </div>
                            <div class="message-footer">
                                <span class="message-date">
                                    <i class="fas fa-clock"></i> 
                                    ${formatDateForDisplay(info.createdAt)}
                                </span>
                                ${info.validUntil ? `
                                    <span class="valid-until">
                                        <i class="fas fa-calendar-times"></i> 
                                        Gültig bis: ${formatDateForDisplay(info.validUntil)}
                                    </span>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }
            });
            
            htmlContent += `
                    </div>
                </div>
            `;
        } else {
            htmlContent += `
                <div class="info-section">
                    <h3><i class="fas fa-bullhorn"></i> Aktuelle Mitteilungen</h3>
                    <div class="no-messages">
                        <i class="fas fa-info-circle"></i>
                        <p>Keine aktuellen Mitteilungen vorhanden</p>
                    </div>
                </div>
            `;
        }
        
        // Wichtige Termine (falls vorhanden)
        if (settings.importantDates && Object.keys(settings.importantDates).length > 0) {
            htmlContent += `
                <div class="info-section">
                    <h3><i class="fas fa-calendar-check"></i> Wichtige Termine</h3>
                    <div class="dates-container">
            `;
            
            for (const [key, date] of Object.entries(settings.importantDates)) {
                if (date) {
                    const daysUntil = getDaysUntil(date);
                    const isPast = daysUntil < 0;
                    
                    htmlContent += `
                        <div class="date-card ${isPast ? 'past' : ''}">
                            <div class="date-name">${formatDateLabel(key)}</div>
                            <div class="date-value">${formatDateForDisplay(date)}</div>
                            ${!isPast && daysUntil <= 30 ? `
                                <div class="days-until">
                                    <i class="fas fa-hourglass-half"></i> 
                                    Noch ${daysUntil} Tage
                                </div>
                            ` : ''}
                        </div>
                    `;
                }
            }
            
            htmlContent += `
                    </div>
                </div>
            `;
        }
        
        contentDiv.innerHTML = htmlContent;
        
    } catch (error) {
        console.error("Fehler beim Laden der Informationen:", error);
        contentDiv.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Fehler beim Laden der Informationen</p>
                <button class="btn btn-primary" onclick="location.reload()">
                    <i class="fas fa-redo"></i> Neu laden
                </button>
            </div>
        `;
    } finally {
        hideLoader();
    }
}

function formatDateLabel(key) {
    const labels = {
        semesterStart: "Semesterbeginn",
        semesterEnd: "Semesterende",
        gradeDeadline: "Notenschluss",
        conferenceDate: "Notenkonferenz",
        reportCardDate: "Zeugnisausgabe"
    };
    return labels[key] || key;
}

// CSS für das Info-Modul
const infoStyles = `
<style>
.info-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
}

.info-content {
    margin-top: 20px;
}

.info-section {
    background: white;
    border-radius: 8px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.info-section h3 {
    color: var(--primary-color);
    margin-bottom: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
}

.info-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
}

.school-year {
    font-size: 24px;
    font-weight: bold;
    color: var(--primary-color);
}

.messages-container {
    display: flex;
    flex-direction: column;
    gap: 15px;
}

.message-card {
    background: #f8f9fa;
    border-left: 4px solid var(--primary-color);
    border-radius: 4px;
    padding: 15px;
}

.message-card.high {
    border-left-color: #dc3545;
    background: #fff5f5;
}

.message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
}

.message-header h4 {
    margin: 0;
    color: #333;
}

.priority-badge {
    background: #dc3545;
    color: white;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: bold;
}

.message-content {
    color: #666;
    line-height: 1.6;
    margin-bottom: 10px;
}

.message-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #999;
}

.no-messages {
    text-align: center;
    padding: 40px;
    color: #999;
}

.no-messages i {
    font-size: 48px;
    margin-bottom: 10px;
}

.dates-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 15px;
}

.date-card {
    background: #f8f9fa;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e9ecef;
    transition: all 0.3s ease;
}

.date-card:hover {
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.date-card.past {
    opacity: 0.6;
}

.date-name {
    font-size: 14px;
    color: #666;
    margin-bottom: 5px;
}

.date-value {
    font-size: 18px;
    font-weight: bold;
    color: var(--primary-color);
}

.days-until {
    margin-top: 10px;
    font-size: 12px;
    color: #28a745;
}

.error-message {
    text-align: center;
    padding: 40px;
    color: #dc3545;
}

.error-message i {
    font-size: 48px;
    margin-bottom: 10px;
}

.loading-spinner {
    text-align: center;
    padding: 40px;
    color: #999;
}

.loading-spinner i {
    font-size: 48px;
    margin-bottom: 10px;
}
</style>
`;

// Füge Styles beim Laden des Moduls hinzu
if (!document.getElementById('info-module-styles')) {
    const styleElement = document.createElement('div');
    styleElement.id = 'info-module-styles';
    styleElement.innerHTML = infoStyles;
    document.head.appendChild(styleElement);
}
