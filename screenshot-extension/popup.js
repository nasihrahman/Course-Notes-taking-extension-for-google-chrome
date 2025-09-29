document.addEventListener('DOMContentLoaded', () => {
  const courseSelect = document.getElementById('course-select');
  const newCourseInput = document.getElementById('new-course-input');
  const addCourseBtn = document.getElementById('add-course-btn');

  const sessionSelect = document.getElementById('session-select');
  const newSessionInput = document.getElementById('new-session-input');
  const addSessionBtn = document.getElementById('add-session-btn');

  const screenshotBtn = document.getElementById('screenshot-btn');

  let courses = {};

  // Load courses from storage
  chrome.storage.local.get('courses', (data) => {
    if (data.courses) {
      courses = data.courses;
      updateCourseSelect();
    }
  });

  function updateCourseSelect() {
    courseSelect.innerHTML = '';
    for (const courseName in courses) {
      const option = document.createElement('option');
      option.value = courseName;
      option.textContent = courseName;
      courseSelect.appendChild(option);
    }
    updateSessionSelect();
  }

  function updateSessionSelect() {
    const selectedCourse = courseSelect.value;
    sessionSelect.innerHTML = '';
    if (selectedCourse && courses[selectedCourse]) {
      courses[selectedCourse].forEach(sessionName => {
        const option = document.createElement('option');
        option.value = sessionName;
        option.textContent = sessionName;
        sessionSelect.appendChild(option);
      });
    }
  }

  courseSelect.addEventListener('change', updateSessionSelect);

  addCourseBtn.addEventListener('click', () => {
    const newCourseName = newCourseInput.value.trim();
    if (newCourseName && !courses[newCourseName]) {
      courses[newCourseName] = [];
      chrome.storage.local.set({ courses }, () => {
        newCourseInput.value = '';
        updateCourseSelect();
      });
    }
  });

  addSessionBtn.addEventListener('click', () => {
    const selectedCourse = courseSelect.value;
    const newSessionName = newSessionInput.value.trim();
    if (selectedCourse && newSessionName && !courses[selectedCourse].includes(newSessionName)) {
      courses[selectedCourse].push(newSessionName);
      chrome.storage.local.set({ courses }, () => {
        newSessionInput.value = '';
        updateSessionSelect();
      });
    }
  });

  screenshotBtn.addEventListener('click', () => {
    const course = courseSelect.value;
    const session = sessionSelect.value;

    if (!course || !session) {
      alert('Please select a course and session.');
      return;
    }

    chrome.runtime.sendMessage({ 
      action: 'takeScreenshot', 
      course: course, 
      session: session 
    });
  });
});
