// background.js
// Responsible for handling capture requests and recording via tabCapture.

let recorderState = {
  mediaRecorder: null,
  chunks: [],
  capturing: false
};

chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.action === 'captureScreenshot') {
    try {
      // Get active tab to compute filename and to ask content script for title/timestamp
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const tab = tabs[0];
      const imageDataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, {format: 'png'});

      // Ask content script for video metadata
      let metadata = { title: '', timestamp: '' };
      try {
        const resp = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoMeta' });
        metadata = resp || metadata;
      } catch (e) {
        // content script might not be available on all pages
      }

      const item = {
        id: 'itm_'+Date.now(),
        type: 'screenshot',
        dataUrl: imageDataUrl,
        title: metadata.title || tab.title || 'Unknown',
        timestamp: metadata.timestamp || msg.timestamp || '00:00:00',
        note: msg.note || '',
        createdAt: Date.now(),
        courseId: msg.courseId || null,
        sectionId: msg.sectionId || null
      };

      // Save to storage (append to items array)
      const store = await chrome.storage.local.get({ items: [] });
      const items = store.items || [];
      items.push(item);
      await chrome.storage.local.set({ items });

      return Promise.resolve({ success: true, item });
    } catch (err) {
      return Promise.resolve({ success: false, error: err.message });
    }
  }

  if (msg.action === 'startRecording') {
    if (recorderState.capturing) return Promise.resolve({ success: false, error: 'Already recording' });

    chrome.tabCapture.capture({ audio: true, video: true }, (stream) => {
      if (!stream) {
        return chrome.runtime.lastError ? console.error(chrome.runtime.lastError) : console.error('No stream');
      }

      const options = { mimeType: 'video/webm; codecs=vp8,opus' };
      const mediaRecorder = new MediaRecorder(stream, options);
      recorderState.mediaRecorder = mediaRecorder;
      recorderState.chunks = [];
      recorderState.capturing = true;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recorderState.chunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recorderState.chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);

        // Prepare metadata
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        const tab = tabs[0];
        let metadata = { title: tab.title || 'Recording' };
        try { const resp = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoMeta' }); metadata = resp || metadata; } catch(e){}

        const item = {
          id: 'rec_' + Date.now(),
          type: 'recording',
          blobUrl: url,
          blobSize: blob.size,
          createdAt: Date.now(),
          duration: msg.duration || null,
          title: metadata.title,
          courseId: msg.courseId || null,
          sectionId: msg.sectionId || null
        };

        // Save blob in storage - we will use downloads to store file locally for now
        const filename = `${item.title.replace(/[^a-z0-9]/gi,'_').slice(0,60)}_${Date.now()}.webm`;
        const objectUrl = url;
        // Trigger download
        chrome.downloads.download({ url: objectUrl, filename, saveAs: false }, async (downloadId) => {
          const store = await chrome.storage.local.get({ items: [] });
          const items = store.items || [];
          items.push(item);
          await chrome.storage.local.set({ items });
          // revoke object URL after a while
          setTimeout(() => URL.revokeObjectURL(objectUrl), 60*1000);
        });

        recorderState.capturing = false;
        recorderState.mediaRecorder = null;
        recorderState.chunks = [];
      };

      mediaRecorder.start();
      chrome.runtime.sendMessage({ action: 'recordingStarted' });
    });

    return Promise.resolve({ success: true });
  }

  if (msg.action === 'stopRecording') {
    if (!recorderState.capturing || !recorderState.mediaRecorder) return Promise.resolve({ success: false, error: 'Not recording' });
    recorderState.mediaRecorder.stop();
    return Promise.resolve({ success: true });
  }
});