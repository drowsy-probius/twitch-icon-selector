import { APP_VERSION, URLS, getLatestData, getStreamerFromURL, formLocalStorageData } from "../common.js";

const makeStreamerLIst = async () => {
  const streamerListElement = document.querySelector(".main-list");
  streamerListElement.innerHTML = "";
  for(const streamer of Object.keys(URLS))
  {
    const timestamp = (await chrome.storage.local.get(streamer))[streamer].timestamp;

    const date = new Date(timestamp);
    const timeString = `${date.getMonth()+1}/${date.getDate()} ${date.getHours()}:${date.getMinutes()}`;

    const entry = document.createElement("div");
    const anchor = document.createElement("a");
    const timestampElem = document.createElement("span");
    entry.classList.add("streamer");
    timestampElem.classList.add("timestamp");

    anchor.href = URLS[streamer];
    anchor.innerText = streamer;
    anchor.target = "_blank";
    timestampElem.innerText = timeString;

    entry.appendChild(anchor);
    entry.appendChild(timestampElem);

    streamerListElement.appendChild(entry);
  }
}

const refreshData = async () => {
  try
  {
    // const streamer = await getStreamerFromURL();
    for(const streamer of Object.keys(URLS))
    {
      chrome.runtime.sendMessage({command: "refresh", streamer: streamer}, async (response) => {
        console.log(`refresh ${streamer}`);
        makeStreamerLIst();
      });
    }
  }
  catch(e)
  {
    console.error(e);
  }
}


window.onload = async () => {
  document.getElementById("app-version").innerText = APP_VERSION;

  const refreshButton = document.getElementById("refresh-data");
  refreshButton.onclick = refreshData;

  makeStreamerLIst();
}

/**
 * 
 * dcConsData = [
  {"name":"�앹퐯.gif", "uri":"https://funzinnu.com/stream/cdn/dccon/�앹퐯.gif", "keywords":["�앹퐯"], "tags":["誘몄���"]},
  {"name":"�レ궛諛쒖긽.png", "uri":"https://funzinnu.com/stream/cdn/dccon/�レ궛諛쒖긽.png", "keywords":["�レ궛諛쒖긽"], "tags":["誘몄���"]},
 * 
 */