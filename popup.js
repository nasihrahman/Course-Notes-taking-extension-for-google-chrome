// popup.js

async function loadCourses() {
  const store = await chrome.storage.local.get({ courses: [] });
  const courses = store.courses || [];
  const courseSel = document.getElementById('courseSelect');
  courseSel.innerHTML = '';
  const defaultOpt = document.createElement('option'); defaultOpt.value=''; defaultOpt.text = '-- No course --'; courseSel.appendChild(defaultOpt);
  courses.forEach(c => { const opt = document.createElement('option'); opt.value = c.id; opt.text = c.title; courseSel.appendChild(opt); });
  courseSel.addEventListener('change', loadSections);
}

async function loadSections() {
  const courseId = document.getElementById('courseSelect').value;
  const store = await chrome.storage.local.get({ courses: [] });
  const courses = store.courses || [];
  const sectionSel = document.getElementById('sectionSelect');
  sectionSel.innerHTML = '';
  const defaultOpt = document.createElement('option'); defaultOpt.value=''; defaultOpt.text = '-- No section --'; sectionSel.appendChild(defaultOpt);
  const course = courses.find(c => c.id === courseId);
  if (course && course.sections) {
    course.sections.forEach(s => { const opt = document.createElement('option'); opt.value = s.id; opt.text = s.title; sectionSel.appendChild(opt); });
  }
}

async function ensureContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content_script.js'] });
  } catch (e) {
    // ignore
  }
}

async function takeScreenshot() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return;
  await ensureContentScript(tab.id);

  const note = document.getElementById('note').value;
  const courseId = document.getElementById('courseSelect').value;
  const sectionId = document.getElementById('sectionSelect').value;

  chrome.runtime.sendMessage({ action: 'captureScreenshot', note, courseId, sectionId, timestamp: '' }, (resp) => {
    const status = document.getElementById('status');
    if (resp && resp.success) status.textContent = 'Screenshot saved.';
    else status.textContent = 'Failed to capture.';
    setTimeout(()=> status.textContent = '', 3000);
  });
}

function startRecording() {
  chrome.runtime.sendMessage({ action: 'startRecording' }, (resp) => {
    const status = document.getElementById('status');
    if (resp && resp.success) {
      status.textContent = 'Recording started.';
      document.getElementById('startRecBtn').disabled = true;
      document.getElementById('stopRecBtn').disabled = false;
    } else status.textContent = 'Failed to start recording.';
  });
}

function stopRecording() {
  chrome.runtime.sendMessage({ action: 'stopRecording' }, (resp) => {
    const status = document.getElementById('status');
    if (resp && resp.success) status.textContent = 'Recording stopped. File downloaded.';
    else status.textContent = 'Failed to stop recording.';
    document.getElementById('startRecBtn').disabled = false;
    document.getElementById('stopRecBtn').disabled = true;
    setTimeout(()=> status.textContent = '', 4000);
  });
}

// init
document.getElementById('screenshotBtn').addEventListener('click', takeScreenshot);
document.getElementById('startRecBtn').addEventListener('click', startRecording);
document.getElementById('stopRecBtn').addEventListener('click', stopRecording);

loadCourses().then(loadSections);