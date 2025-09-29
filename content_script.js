// content_script.js
// Tries to extract video title and current timestamp from common video platforms

function getYoutubeTimestamp() {
  const video = document.querySelector('video');
  if (!video) return null;
  const seconds = Math.floor(video.currentTime);
  const h = String(Math.floor(seconds / 3600)).padStart(2, '0');
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'getVideoMeta') {
    const titleEl = document.querySelector('h1.title') || document.querySelector('h1') || document.title;
    const title = (titleEl && (titleEl.innerText || titleEl.textContent)) || document.title;
    const timestamp = getYoutubeTimestamp() || '00:00:00';
    sendResponse({ title, timestamp });
  }
});