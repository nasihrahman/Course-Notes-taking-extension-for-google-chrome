chrome.runtime.onMessage.addListener(async (msg, sender) => {
  if (msg.action === 'takeScreenshot') {
    try {
      const imageDataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });
      
      const filename = `${msg.course}/${msg.session}/screenshot_${Date.now()}.png`;

      chrome.downloads.download({
        url: imageDataUrl,
        filename: filename,
        saveAs: false
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError);
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            title: 'Screenshot Failed',
            message: `Failed to save to ${filename}`
          });
        } else {
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
            title: 'Screenshot Saved!',
            message: `Saved to ${filename}`
          });
        }
      });

    } catch (err) {
      console.error("Screenshot failed:", err);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        title: 'Screenshot Failed',
        message: err.message
      });
    }
  }
});