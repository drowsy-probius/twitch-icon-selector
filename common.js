export const APP_VERSION = "1.0.0";
export const URLS = {
  "funzinnu": "https://twitch-icons.probius.dev/list/funzinnu"
}

export const DAY_IN_MIN = 24 * 60 * 60;
export const DAY_IN_MISEC = DAY_IN_MIN * 1000;

export const DEFAULT_LOCALSTORAGE = { 
  dcconMetadata: {},
  dcconStatus: {},
}

const parserFunzinnu = async (response) => {
  let text = await response.text();
  const json = JSON.parse(text);
  return json["dcConsData"];
}

const apiParsers = {
  "funzinnu": parserFunzinnu,
}

export const makeCallback = (execute, callback) => {
  return new Promise((resolve, reject) => {
    try{ resolve(execute()); } catch(e) { reject(e) }
  })
  .then(_ => {
    callback();
  })
}

export const getLatestData = async (streamer_id) => {
  if(streamer_id === undefined) throw `streamer id is undefined`;
  if(!isValidStreamer(streamer_id)) throw `this streamer (${streamer_id}) currently not supported`;

  return fetch(
    `${URLS[streamer_id]}?ts=${Date.now()}`,
    {
      method: "get",
      headers: {"Content-Type": "application/json"}
    }
  )
  .then(async res => {
    return await apiParsers[streamer_id](res);
  })
  .catch(async e => {
    throw e;
  })
}

export const getStreamerFromURL = async () => {
  /**
   * use cases:
   * 
   * https://www.twitch.tv/popout/streamer/chat
   * https://www.twitch.tv/streamer
   * 
   * currently not used.
   * 
   */
  
  const tabURL = await getCurrentTabURL();
  const directories = tabURL.split('/');
  let streamer = directories.pop();
  if(streamer === "chat")
  {
    streamer = directories.pop();
  }
  return streamer;
}

export const getCurrentTabURL = async () => {
  let [tab] = await chrome.tabs.query({active: true, currentWindow: true});
  return tab.url;
}

export const formLocalStorageData = (data) => {
  return {
    data: data,
    timestamp: Date.now(),
  }
}

export const isOutdated = (timestamp) => {
  /**
   * 24h = 1000 * 60 * 60 * 24
   */
  return (Date.now() - timestamp) > DAY_IN_MISEC;
}

export const isValidStreamer = (streamer) => {
  return streamer in URLS;
}