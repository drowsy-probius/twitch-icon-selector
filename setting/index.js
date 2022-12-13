const waitForSyncData = () => {
  return new Promise((resolve, reject) => {
    const timeout = 2000;
    setTimeout(() => {
      reject(false);
    }, timeout);

    const intv = setInterval(async () => {
      const browserSyncData = await chrome.storage.sync.get();
      if(browserSyncData.length !== 0)
      {
        clearInterval(intv);
        resolve(browserSyncData);
      }
    }, 100);
  })
}

const init = async () => { 
  const browserSyncData = await waitForSyncData();
  console.log(browserSyncData);
  const renderOptions = browserSyncData.iconRenderOptions;

  document.getElementById("render-size").value = renderOptions.size;
  document.getElementById("render-size").onchange = async (e) => {
    const browserSyncData = await chrome.storage.sync.get();
    browserSyncData.iconRenderOptions.size = Number(e.target.value);
    await chrome.storage.sync.set(browserSyncData);
  }

  document.getElementById("render-disableTags").value = renderOptions.disableTags;
  document.getElementById("render-disableTags").onchange = async (e) => {
    const browserSyncData = await chrome.storage.sync.get();
    browserSyncData.iconRenderOptions.disableTags = Number(e.target.value);
    await chrome.storage.sync.set(browserSyncData);
  }
  
  document.getElementById("open-page").onclick = (e) => {
    chrome.tabs.create({url: chrome.runtime.getURL("./popup/index.html")});
  }
}

window.onload = init;