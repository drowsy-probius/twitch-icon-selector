const waitForLocalData = () => {
  return new Promise((resolve, reject) => {
    const timeout = 2000;
    setTimeout(() => {
      reject(false);
    }, timeout);

    const intv = setInterval(async () => {
      const localData = await browser.storage.local.get();
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

  document.getElementById("render-type").value = renderOptions.type;

  document.getElementById("render-type").onchange = async (e) => {
    const localData = await browser.storage.local.get();
    console.log(localData);
    localData.iconRenderOptions.type = Number(e.target.value);
    await browser.storage.local.set(localData);
  }
  
  document.getElementById("open-page").onclick = (e) => {
    browser.tabs.create({url: browser.runtime.getURL("./popup/index.html")});
  }
}

window.onload = init;