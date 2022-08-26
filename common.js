export const APP_VERSION = "1.0.0";
export let STREAMERS = [];
export const API = "https://script.google.com/macros/s/AKfycbxPRLqK5UH8iQcLvCvFi3FZccJgy_B2r7oA_rQJubKoIrdR309iVRl59Eq0py2Ds5tEzg/exec" + "?callback=?"
export const DAY_IN_MIN = 24 * 60 * 60;
export const DAY_IN_MISEC = DAY_IN_MIN * 1000;

export const DEFAULT_LOCALSTORAGE = { 
  dcconMetadata: {},
  dcconStatus: {},
}

////////////////////////////////////////////////////////////
// 파서

const parserFunzinnu = async (res) => {
  const json = await res.json();
  if(!json.success) throw json.result;
  return json.result.dccons;
}

const apiParsers = {
  "funzinnu": parserFunzinnu,
}

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
    `${API}&command=list&ts=${Date.now()}`,
    {
      method: "get",
    }
  )
  .then(async res => {
    const json = await res.json();
    if(!json.success) throw json.result;
    STREAMERS = [];
    for(const item of json.result)
    {
      STREAMERS.push(item.name);
    }
    return STREAMERS;
  })
  .catch(async e => {
    throw e;
  })
}

export const getLatestData = async (streamer_id) => {
  if(streamer_id === undefined) throw `streamer id is undefined`;
  if(STREAMERS.length === 0) await getStreamerList();
  if(!isValidStreamer(streamer_id)) throw `this streamer (${streamer_id}) currently not supported`;

  return fetch(
    `${API}&command=list&streamer=${streamer_id}&ts=${Date.now()}`,
    {
      method: "get",
    }
  )
  .then(async res => {
    return await apiParsers[streamer_id](res);
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

export const isValidStreamer = (streamer) => {
  return STREAMERS.includes(streamer);
}
