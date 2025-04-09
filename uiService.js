// js/uiService.js
import { ASSESSMENT_CATEGORIES } from "./constants.js";
import { teacherData, saveTeacherData } from "./dataService.js";

// Allgemeine Hilfsfunktionen

export function showLoader() {
  const mainLoader = document.getElementById("mainLoader");
  if (mainLoader) {
    mainLoader.style.display = "flex";
  }
}

export function hideLoader() {
  const mainLoader = document.getElementById("mainLoader");
  if (mainLoader) {
    mainLoader.style.display = "none";
  }
}

export function showNotification(message, type = "success") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

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

export function getYearFromDate(isoDateString) {
  return isoDateString.split("-")[0];
}

export function getAvailableYears() {
  const years = new Set();
  const currentYear = new Date().getFullYear();

  for (let i = 0; i <= 10; i++) {
    years.add((currentYear + i).toString());
  }

  teacherData.students.forEach((student) => {
    years.add(getYearFromDate(student.examDate));
  });

  return Array.from(years).sort((a, b) => a - b).reverse();
}

export function getAvailableDates(year = null) {
  const dates = new Set();
  teacherData.students.forEach((student) => {
    if (!year || getYearFromDate(student.examDate) === year) {
      dates.add(student.examDate);
    }
  });
  return Array.from(dates).sort().reverse();
}

export function getAvailableTopics(selectedDate = null) {
  const topics = new Set();
  let filteredStudents = teacherData.students;
  if (selectedDate) {
    filteredStudents = filteredStudents.filter(
      (s) => s.examDate === selectedDate
    );
  }
  filteredStudents.forEach((student) => {
    if (student.topic && student.topic.trim() !== "") {
      topics.add(student.topic);
    }
  });
  return Array.from(topics).sort();
}

export function calculateAverageGrade(assessment) {
  if (!assessment) return null;
  let sum = 0;
  let count = 0;
  ASSESSMENT_CATEGORIES.forEach((category) => {
    if (assessment[category.id] && assessment[category.id] > 0) {
      sum += assessment[category.id];
      count++;
    }
  });
  if (count === 0) return null;
  return (sum / count).toFixed(1);
}
