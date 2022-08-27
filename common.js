export const APP_VERSION = "1.0.0";
export const DAY_IN_MIN = 24 * 60 * 60;
export const DAY_IN_MISEC = DAY_IN_MIN * 1000;
export let STREAMERS = [];
const API = "https://twitch-icons.probius.dev"

export const DEFAULT_LOCALSTORAGE = { 
  iconMetadata: {},
  iconStats: {},
}

////////////////////////////////////////////////////////////
// 파서

const apiParser = async (res) => {
  const json = await res.json();
  return json.icons;
}

////////////////////////////////////////////////////////////
// 내부



////////////////////////////////////////////////////////////
// 외부

export const makeCallback = (execute, callback) => {
  return new Promise((resolve, reject) => {
    try{ resolve(execute()); } catch(e) { reject(e) }
  })
  .then(_ => {
    callback();
  })
}

export const getStreamerList = async () => {
  return fetch(
    `${API}/list?ts=${Date.now()}`,
    {
      method: "get",
      headers: {"Content-Type": "application/json"}
    }
  )
  .then(async res => {
    const json = await res.json();
    STREAMERS = [];
    for(const item of json)
    {
      STREAMERS.push(item.name)
    }
    return STREAMERS;
  })
  .catch(async e => {
    throw e;
  })
}

export const getLatestData = async (streamer_id) => {
  return fetch(
    `${API}/list/${streamer_id}`,
    {
      method: "get",
      headers: {"Content-Type": "application/json"}
    }
  )
  .then(async res => {
    return await apiParser(res);
  })
  .catch(async e => {
    throw e;
  })
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
