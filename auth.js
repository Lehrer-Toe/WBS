import { showNotification, showLoader, hideLoader } from './utils.js';
import { loadTeacherData } from './database.js';

// Standard-Lehrer
export const DEFAULT_TEACHERS = [
  { name: "Kretz", code: "KRE", password: "Luna" },
  { name: "Riffel", code: "RIF", password: "Luna" },
  { name: "Töllner", code: "TOE", password: "Luna" }
];

// Aktueller Benutzer
let currentUser = null;
let teacherData = {
  students: [],
  assessments: {}
};

// Lehrer-Grid initialisieren
export function initTeacherGrid(teacherGrid, showPasswordModalFn) {
  teacherGrid.innerHTML = "";
  
  DEFAULT_TEACHERS.forEach(teacher => {
    const card = document.createElement("div");
    card.className = "teacher-card";
    card.dataset.code = teacher.code;
    card.dataset.name = teacher.name;
    
    card.innerHTML = `
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23e0e0e0'/%3E%3Ctext x='50' y='60' font-family='Arial' font-size='30' text-anchor='middle' fill='%23666'%3E${teacher.code.charAt(0)}%3C/text%3E%3C/svg%3E" alt="${teacher.name}">
      <h3>${teacher.name}</h3>
    `;
    
    card.addEventListener("click", () => {
      showPasswordModalFn(teacher);
    });
    
    teacherGrid.appendChild(card);
  });
}

// Passwort-Modal anzeigen
export function showPasswordModal(teacher, passwordModal, loginPrompt, passwordInput, currentUserSetter) {
  loginPrompt.textContent = `Bitte geben Sie das Passwort für ${teacher.name} ein:`;
  passwordInput.value = "";
  passwordModal.style.display = "flex";
  passwordInput.focus();
  
  currentUserSetter({
    name: teacher.name,
    code: teacher.code,
    password: teacher.password
  });
}

// Anmelden
export async function login(passwordInput, currentUser, 
                          passwordModal, setTeacherData, loginSection, appSection, 
                          teacherAvatar, teacherName, updateStudentsTabFn) {
  if (passwordInput.value === currentUser.password) {
    passwordModal.style.display = "none";
    showLoader();
    
    // Lehrerdaten von Supabase laden
    try {
      const data = await loadTeacherData(currentUser.code);
      setTeacherData(data);
      
      // UI aktualisieren
      loginSection.style.display = "none";
      appSection.style.display = "block";
      
      teacherAvatar.textContent = currentUser.code.charAt(0);
      teacherName.textContent = currentUser.name;
      
      // Alle Tabs initialisieren
      updateStudentsTabFn();
      
      hideLoader();
      showNotification(`Willkommen, ${currentUser.name}!`);
      
      return true;
    } catch (error) {
      hideLoader();
      showNotification("Fehler beim Laden der Daten. Bitte versuchen Sie es später erneut.", "error");
      return false;
    }
  } else {
    showNotification("Falsches Passwort!", "error");
    return false;
  }
}

// Abmelden
export function logout(setCurrentUser, setTeacherData, loginSection, appSection) {
  setCurrentUser(null);
  setTeacherData({
    students: [],
    assessments: {}
  });
  
  loginSection.style.display = "block";
  appSection.style.display = "none";
  
  showNotification("Sie wurden abgemeldet.");
}

// Getter und Setter
export function getCurrentUser() {
  return currentUser;
}

export function setCurrentUser(user) {
  currentUser = user;
}

export function getTeacherData() {
  return teacherData;
}

export function setTeacherData(data) {
  teacherData = data;
}