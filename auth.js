/**
 * Führt den Login-Prozess durch
 */
async function login() {
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

/**
 * Loggt den Benutzer aus
 */
function logout() {
  // Timer löschen bei Abmeldung
  if (infoTextSaveTimer) {
    clearInterval(infoTextSaveTimer);
    infoTextSaveTimer = null;
  }
  
  currentUser = null;
  teacherData = {
    students: [],
    assessments: {}
  };
  loginSection.style.display = "block";
  appSection.style.display = "none";
  showNotification("Sie wurden abgemeldet.");
}