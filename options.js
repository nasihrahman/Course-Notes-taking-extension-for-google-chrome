function uid() { return 'c_'+Math.random().toString(36).slice(2,9); }

async function render() {
  const store = await chrome.storage.local.get({ courses: [] });
  const courses = store.courses || [];
  const container = document.getElementById('coursesList');
  container.innerHTML = '';
  courses.forEach(c => {
    const el = document.createElement('div'); el.className = 'course';
    el.innerHTML = `<strong>${c.title}</strong> <button data-id="${c.id}" class="del">Delete</button><br/>
      <input placeholder="New section title" data-courseid="${c.id}" class="newSection" /> <button data-courseid="${c.id}" class="addSection">Add Section</button>
      <ul>${(c.sections||[]).map(s=>`<li>${s.title} <button data-courseid="${c.id}" data-sectionid="${s.id}" class="delSection">Delete</button></li>`).join('')}</ul>`;
    container.appendChild(el);
  });

  // attach handlers
  document.querySelectorAll('.del').forEach(btn => btn.addEventListener('click', async (e)=>{
    const id = e.target.getAttribute('data-id');
    const store = await chrome.storage.local.get({ courses: [] });
    const courses = (store.courses || []).filter(c=>c.id!==id);
    await chrome.storage.local.set({ courses }); render();
  }));

  document.querySelectorAll('.addSection').forEach(btn => btn.addEventListener('click', async (e)=>{
    const courseId = e.target.getAttribute('data-courseid');
    const input = document.querySelector(`input.newSection[data-courseid="${courseId}"]`);
    const title = input.value.trim(); if (!title) return;
    const store = await chrome.storage.local.get({ courses: [] });
    const courses = store.courses || [];
    const course = courses.find(c=>c.id===courseId);
    if (!course.sections) course.sections = [];
    course.sections.push({ id: uid(), title });
    await chrome.storage.local.set({ courses }); render();
  }));

  document.querySelectorAll('.delSection').forEach(btn => btn.addEventListener('click', async (e)=>{
    const courseId = e.target.getAttribute('data-courseid');
    const sectionId = e.target.getAttribute('data-sectionid');
    const store = await chrome.storage.local.get({ courses: [] });
    const courses = store.courses || [];
    const course = courses.find(c=>c.id===courseId);
    if (course) course.sections = (course.sections||[]).filter(s=>s.id!==sectionId);
    await chrome.storage.local.set({ courses }); render();
  }));
}

document.getElementById('addCourseBtn').addEventListener('click', async ()=>{
  const title = document.getElementById('courseTitle').value.trim();
  if (!title) return;
  const store = await chrome.storage.local.get({ courses: [] });
  const courses = store.courses || [];
  courses.push({ id: uid(), title, sections: [] });
  await chrome.storage.local.set({ courses });
  document.getElementById('courseTitle').value='';
  render();
});

render();