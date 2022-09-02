const waitForLocalData = () => {
  return new Promise((resolve, reject) => {
    const timeout = 2000;
    setTimeout(() => {
      reject(false);
    }, timeout);

    const intv = setInterval(async () => {
      const localData = await chrome.storage.local.get();
      if(localData.length !== 0)
      {
        clearInterval(intv);
        resolve(localData);
      }
    }, 100);
  })
}

const init = async () => { 
  const localData = await waitForLocalData();
  console.log(localData);
  const renderOptions = localData.iconRenderOptions;

  document.getElementById("render-size").value = renderOptions.size;
  document.getElementById("render-size").onchange = async (e) => {
    const localData = await chrome.storage.local.get();
    console.log(localData);
    localData.iconRenderOptions.size = Number(e.target.value);
    await chrome.storage.local.set(localData);
  }

  document.getElementById("render-disableTags").value = renderOptions.disableTags;
  document.getElementById("render-disableTags").onchange = async (e) => {
    const localData = await chrome.storage.local.get();
    console.log(localData);
    localData.iconRenderOptions.disableTags = Number(e.target.value);
    await chrome.storage.local.set(localData);
  }
  
  document.getElementById("open-page").onclick = (e) => {
    chrome.tabs.create({url: chrome.runtime.getURL("./popup/index.html")});
  }
}

window.onload = init;