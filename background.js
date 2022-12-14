const APP_VERSION = "1.0.0";
const DAY_IN_MIN = 24 * 60 * 60;
const DAY_IN_MISEC = DAY_IN_MIN * 1000;
let STREAMERS = [];
const API = "https://api.probius.dev/twitch-icons/cdn/"

const DEFAULT_STORAGE = { 
  iconMetadata: {}, // to local storage
  iconStats: {}, // to local storage
  iconRenderOptions: { // to sync storage
    size: 1, // default small
    disableTags: 0, // default on
  }
}

////////////////////////////////////////////////////////////
// parser

const apiParser = async (res) => {
  const json = await res.json();
  if(json.icons === undefined)
  {
    return Promise.reject(new Error(json.message || `Server response error: ${json}`));
  }

  for(const icon of json.icons)
  {
    if(icon.uri.startsWith("./") || icon.uri.startsWith("/"))
    {
      icon.uri = API + icon.uri
    }
    if(icon.thumbnailUri.startsWith("./") || icon.thumbnailUri.startsWith("/"))
    {
      icon.thumbnailUri = API + icon.thumbnailUri
    }
  }
  return json;
}

////////////////////////////////////////////////////////////
// 내부

const setDefaultDataIfNotExists = () => {
  chrome.storage.local.get(result => {
    if(result.iconMetadata === undefined)
    {
      result.iconMetadata = {...DEFAULT_STORAGE.iconMetadata};
    }
    if(result.iconStats === undefined)
    {
      result.iconStats = {...DEFAULT_STORAGE.iconStats};
    }
    chrome.storage.local.set(result, () => {
      console.log(`Hello, Welcome! data installed to your local storage: `, result);
    });
  })
  chrome.storage.sync.get(result => {
    if(result.iconRenderOptions === undefined)
    {
      result.iconRenderOptions = {...DEFAULT_STORAGE.iconRenderOptions};
    }
    if(result.iconRenderOptions.size === undefined)
    {
      result.iconRenderOptions.size = DEFAULT_STORAGE.iconRenderOptions.size;
    }
    if(result.iconRenderOptions.disableTags === undefined)
    {
      result.iconRenderOptions.disableTags = DEFAULT_STORAGE.iconRenderOptions.disableTags;
    }

    chrome.storage.sync.set(result, () => {
      console.log(`Hello, Welcome! data installed to your sync storage: `, result);
    });
  });
}


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
    return Promise.reject(new Error(JSON.stringify(e)));
  })
}

const getLatestData = async (streamer_id, timestamp=0) => {
  return fetch(
    // 최소 1시간 로컬 캐시.
    `${API}/list/${streamer_id}?ts=${Math.floor(timestamp / (1000 * 60 * 60))}`,
    {
      method: "get",
      headers: {"Content-Type": "application/json"}
    }
  )
  .then(async res => {
    return apiParser(res);
  })
  .catch(async e => {
    throw e;
  })
}

const makeDataFormatFromMetadata = (data) => {
  return {
    ...data
  }
}

///////////////////////////////////////////////////

const cronjob = async () => {
  console.log(`Execute refresh job!`);

  const streamers = await getStreamerList();

  chrome.storage.sync.get(async result => {
    const syncData = {...result};
    const localData = await chrome.storage.local.get();

    const iconMetadata = localData.iconMetadata;
    const iconStats = localData.iconStats;

    const newLocalData = { ...localData };
    const newSyncData = { ...syncData };

    for(const streamer of streamers)
    {
      try 
      {
        let hasStatsData = (streamer in iconStats);
        const timestamp = iconMetadata[streamer] && iconMetadata[streamer].timestamp ? iconMetadata[streamer].timestamp : 0;

        if(!hasStatsData)
        {
          newLocalData.iconStats[streamer] = {};
        }

        console.log(streamer, timestamp);
        const newMetadata = await getLatestData(streamer, timestamp);
        if(newMetadata.status === false)
        {
          console.log(streamer, newMetadata.message);
          continue;
        }
        newLocalData.iconMetadata[streamer] = makeDataFormatFromMetadata(newMetadata);
      }
      catch(err)
      {
        console.trace(streamer, err);
      }
    }

    chrome.storage.sync.set(newSyncData, () => {
      console.log(`Refresh done!: sync data`, newSyncData);
    });
    chrome.storage.local.set(newLocalData, () => {
      console.log(`Refresh done!: local data`, newLocalData);
    });

  });
  return;
}


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('runtime.onMessage -- ' + 
    ("tab" in sender ?
    "from a content script:" + sender.tab.url :
    "from the extension"));

  if(request.command === "refresh_all")
  {
    cronjob()
    .then(() => {
      sendResponse({result: true});
      chrome.tabs.reload();
    })
    .catch(err => {
      console.error(err);
    })
  }
});


chrome.runtime.onInstalled.addListener(() => {
  setDefaultDataIfNotExists();
  cronjob();
});

chrome.runtime.onStartup.addListener(() => {
  cronjob();
  console.log(`Hello, Welcome Again!`);
});