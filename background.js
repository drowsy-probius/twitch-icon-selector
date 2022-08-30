const APP_VERSION = "1.0.0";
const DAY_IN_MIN = 24 * 60 * 60;
const DAY_IN_MISEC = DAY_IN_MIN * 1000;
let STREAMERS = [];
const API = "https://twitch-icons.probius.dev"

const DEFAULT_LOCALSTORAGE = { 
  iconMetadata: {},
  iconStats: {},
  iconRenderOptions: {
    type: 0,
    
  }
}

////////////////////////////////////////////////////////////
// 파서

const apiParser = async (res) => {
  const json = await res.json();
  return json;
}

////////////////////////////////////////////////////////////
// 내부



////////////////////////////////////////////////////////////
// 외부

const makeCallback = (execute, callback) => {
  return new Promise((resolve, reject) => {
    try{ resolve(execute()); } catch(e) { reject(e) }
  })
  .then(_ => {
    callback();
  })
}

const getStreamerList = async () => {
  return fetch(
    `${API}/list`,
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

const getLatestData = async (streamer_id, timestamp=0) => {
  return fetch(
    `${API}/list/${streamer_id}?ts=${timestamp}`,
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

const formLocalStorageData = (data) => {
  return {
    ...data
  }
}

const isOutdated = (timestamp) => {
  /**
   * 24h = 1000 * 60 * 60 * 24
   */
  return (Date.now() - timestamp) > DAY_IN_MISEC;
}


///////////////////////////////////////////////////

const cronjob = async () => {
  console.log(`Execute refresh job!`);

  const streamers = await getStreamerList();

  chrome.storage.local.get(async result => {
    const iconMetadata = result.iconMetadata;
    const iconStats = result.iconStats;
    const newLocalData = {
      ...result
    }

    for(const streamer of streamers)
    {
      let hasStatsData = (streamer in iconStats);
      const timestamp = iconMetadata[streamer] ? iconMetadata[streamer].timestamp : 0;

      if(!hasStatsData)
      {
        newLocalData.iconStats[streamer] = {};
      }

      const newMetadata = await getLatestData(streamer, timestamp);
      if(newMetadata.status === false)
      {
        console.log(streamer, newMetadata.message);
        continue;
      }
      newLocalData.iconMetadata[streamer] = formLocalStorageData(newMetadata);
    }

    chrome.storage.local.set(newLocalData, () => {
      console.log(`Refresh done!`, newLocalData);
    });
  });
  return;
}



chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set(DEFAULT_LOCALSTORAGE);
  console.log(`Hello, Welcome! data installed to your localstorage: `, DEFAULT_LOCALSTORAGE);
  cronjob();
});

chrome.runtime.onStartup.addListener(() => {
  cronjob();
  console.log(`Hello, Welcome Again!`);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('runtime.onMessage -- ' + 
    ("tab" in sender ?
    "from a content script:" + sender.tab.url :
    "from the extension"));

  if(request.command === "refresh_all")
  {
    cronjob()
    .then(() => {
      return sendResponse({result: true});
    })
    .catch(err => {
      console.error(err);
    })
  }
});
