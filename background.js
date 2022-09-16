const APP_VERSION = "1.0.0";
const DAY_IN_MIN = 24 * 60 * 60;
const DAY_IN_MISEC = DAY_IN_MIN * 1000;
let STREAMERS = [];
const API = "https://api.probius.dev/twitch-icons/cdn/"

const DEFAULT_STORAGE = { 
  iconMetadata: {}, // to local storage
  iconStats: {}, // to sync storage
  iconRenderOptions: { // to sync storage
    size: 0,
    disableTags: 0,
  }
}

////////////////////////////////////////////////////////////
// 파서

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

const setDefaultDataIfNotExists = async () => {
  let browserLocalData = await browser.storage.local.get();
  if(browserLocalData === undefined)
  {
    browserLocalData = {
      iconMetadata: {...DEFAULT_STORAGE.iconMetadata}
    }
  }
  if(browserLocalData.iconMetadata === undefined)
  {
    browserLocalData.iconMetadata = {...DEFAULT_STORAGE.iconMetadata};
  }
  await browser.storage.local.set(browserLocalData);
  console.log(`Hello, Welcome! data installed to your local storage: `, browserLocalData);


  let browserSyncData = await browser.storage.sync.get();
  if(browserSyncData === undefined)
  {
    browserSyncData = {
      iconStats: {...DEFAULT_STORAGE.iconStats},
      iconRenderOptions: {...DEFAULT_STORAGE.iconRenderOptions},
    }
  }
  if(browserSyncData.iconStats === undefined)
  {
    browserSyncData.iconStats = {...DEFAULT_STORAGE.iconStats};
  }
  if(browserSyncData.iconRenderOptions === undefined)
  {
    browserSyncData.iconRenderOptions = {...DEFAULT_STORAGE.iconRenderOptions};
  }
  if(browserSyncData.iconRenderOptions.size === undefined)
  {
    browserSyncData.iconRenderOptions.size = DEFAULT_STORAGE.iconRenderOptions.size;
  }
  if(browserSyncData.iconRenderOptions.disableTags === undefined)
  {
    browserSyncData.iconRenderOptions.disableTags = DEFAULT_STORAGE.iconRenderOptions.disableTags;
  }

  await browser.storage.sync.set(browserSyncData);
  console.log(`Hello, Welcome! data installed to your sync storage: `, browserSyncData);
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

const makeDataFormatFromMetadata  = (data) => {
  return {
    ...data
  }
}

///////////////////////////////////////////

const cronjob = async () => {
  console.log(`Execute refresh job!`);

  const streamers = await getStreamerList();

  browser.storage.sync.get(async result => {
    const syncData = {...result};
    const localData = await browser.storage.local.get();

    const iconMetadata = localData.iconMetadata;
    const iconStats = syncData.iconStats;
    console.log(syncData, iconStats);

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
          newSyncData.iconStats[streamer] = {};
        }

        console.log(streamer, timestamp);
        const newMetadata = await getLatestData(streamer, timestamp);
        if(newMetadata.status === false)
        {
          console.log(streamer, newMetadata.message);
          continue;
        }
        newLocalData.iconMetadata[streamer] = makeDataFormatFromMetadata (newMetadata);
      }
      catch(err)
      {
        console.trace(streamer, err);
      }
    }

    browser.storage.sync.set(newSyncData, () => {
      console.log(`Refresh done!: sync data`, newSyncData);
    });
    browser.storage.local.set(newLocalData, () => {
      console.log(`Refresh done!: local data`, newLocalData);
    });

  });
  return;
}


browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('runtime.onMessage -- ' + 
    ("tab" in sender ?
    "from a content script:" + sender.tab.url :
    "from the extension"));

  if(request.command === "refresh_all")
  {
    cronjob()
    .then(() => {
      sendResponse({result: true});
      browser.tabs.reload();
    })
    .catch(err => {
      console.error(err);
    })
  }
});

browser.runtime.onInstalled.addListener(() => {
  setDefaultDataIfNotExists()
  .then(() => {
    cronjob();
  })
});

browser.runtime.onStartup.addListener(() => {
  cronjob();
  console.log(`Hello, Welcome Again!`);
});