const APP_VERSION = "1.0.0";
const DAY_IN_MIN = 24 * 60 * 60;
const DAY_IN_MISEC = DAY_IN_MIN * 1000;
let STREAMERS = [];
const API = "https://api.probius.dev/twitch-icons/cdn/"

const DEFAULT_LOCALSTORAGE = { 
  iconMetadata: {},
  iconStats: {},
  iconRenderOptions: {
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

///////////////////////////////////////////

const cronjob = async () => {
  console.log(`Execute refresh job!`);

  const streamers = await getStreamerList();

  browser.storage.local.get(async result => {
    const iconMetadata = result.iconMetadata;
    const iconStats = result.iconStats;
    const newLocalData = {
      ...result
    }

    for(const streamer of streamers)
    {
      try 
      {
        let hasStatsData = (streamer in iconStats);
        const timestamp = iconMetadata[streamer] ? iconMetadata[streamer].timestamp : 0;

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
        newLocalData.iconMetadata[streamer] = formLocalStorageData(newMetadata);
      }
      catch(err)
      {
        console.trace(streamer, err);
      }
    }

    browser.storage.local.set(newLocalData, () => {
      console.log(`Refresh done!`, newLocalData);
    });
  });
  return;
}



browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set(DEFAULT_LOCALSTORAGE);
  console.log(`Hello, Welcome! data installed to your localstorage: `, DEFAULT_LOCALSTORAGE);
  cronjob();
});

browser.runtime.onStartup.addListener(() => {
  cronjob();
  console.log(`Hello, Welcome Again!`);
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
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