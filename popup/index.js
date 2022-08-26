import { 
  APP_VERSION, 
  STREAMERS, 
} from "../common.js";

const makeStreamerLIst = async () => {
  const streamerListElement = document.querySelector(".main-list");
  streamerListElement.innerHTML = "";
  const chromeLocalData = await chrome.storage.local.get();
  const metadata = chromeLocalData.dcconMetadata;
  for(const streamer of Object.keys(metadata))
  {
    const timestamp = chromeLocalData.dcconMetadata[streamer].timestamp;

    const date = new Date(timestamp);
    const timeString = `${date.getMonth()+1}/${date.getDate()} ${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;

    const entry = document.createElement("div");
    const anchor = document.createElement("a");
    const timestampElem = document.createElement("span");
    entry.classList.add("streamer");
    timestampElem.classList.add("timestamp");

    anchor.href = `https://twitch.tv/${streamer}`;
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
    await chrome.runtime.sendMessage({command: "refresh_all"});
    await makeStreamerLIst();
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

