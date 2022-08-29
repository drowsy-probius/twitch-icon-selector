const onStartup = () =>{
  browser.alarms.get('icon-cronjob', (cronjob) => {
    browser.alarms.create('icon-cronjob', {
      when: Date.now() + 2000, // execute after 2s
      periodInMinutes: DAY_IN_MIN,
    })
  });
}

const cronjob = async () => {
  console.log(`Execute refresh job!`);

  const streamers = await getStreamerList();

  browser.storage.local.get(async result => {
    console.log(result);

    const iconMetadata = result.iconMetadata;
    const iconStats = result.iconStats;
    const newLocalData = {
      ...result
    }

    for(const streamer of streamers)
    {
      let hasData = (streamer in iconMetadata);
      let hasStatsData = (streamer in iconStats);
      let isDataOutdated = true;
      
      if(hasData)
      {
        const metadata = iconMetadata[streamer];
        isDataOutdated = (metadata.length === 0 || isOutdated(metadata["timestamp"]))
      }

      if(!hasStatsData)
      {
        newLocalData.iconStats[streamer] = {};
      }

      if(!isDataOutdated)
      {
        console.log(`${streamer}'s data is not outdated. do not refresh...`);
        return;
      }

      const newMetadata = await getLatestData(streamer);
      newLocalData.iconMetadata[streamer] = formLocalStorageData(newMetadata);
      console.log(streamer, newLocalData.iconMetadata[streamer]);
    }

    browser.storage.local.set(newLocalData, () => {
      console.log(`Refresh done!`);
    });
  });
}



browser.runtime.onInstalled.addListener(() => {
  browser.storage.local.set(DEFAULT_LOCALSTORAGE);
  console.log(`Hello, Welcome! data installed to your localstorage: `, DEFAULT_LOCALSTORAGE);
  onStartup();
});

browser.runtime.onStartup.addListener(() => {
  onStartup();
  console.log(`Hello, Welcome Again!`);
});

browser.alarms.onAlarm.addListener((alarm) => {
  console.log('alarms.onAlarm --'
              + ' name: '          + alarm.name
              + ' scheduledTime: ' + alarm.scheduledTime);
  cronjob();  
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('runtime.onMessage -- ' + 
    ("tab" in sender ?
    "from a content script:" + sender.tab.url :
    "from the extension"));

  if (request.command === "refresh")
  {
    try
    {
      const streamer = request.streamer;
      let localData;


      browser.storage.local.get((data) => {
        localData = {
          ...data
        };

        makeCallback(async () => {
          const data = await getLatestData(streamer);
          localData.iconMetadata[streamer] = formLocalStorageData(data);
          console.log(streamer, data);
        }, () => {
          browser.storage.local.set(localData, () => {
            console.log(`Refresh ${streamer} done!`);
            return sendResponse({result: true});
          });
        });
      });
    }
    catch(e)
    {
      console.error(e);
      return sendResponse({result: false});
    }
  }
  else if(request.command === "refresh_all")
  {
    let localData;
    browser.storage.local.get(async (data) => {
      localData = {
        ...data
      };
      
      const streamers = await getStreamerList();
      for(const streamer of streamers)
      {
        makeCallback(async () => {
          const data = await getLatestData(streamer);
          localData.iconMetadata[streamer] = formLocalStorageData(data);
          console.log(streamer, data);
        }, () => {
          browser.storage.local.set(localData, () => {
            console.log(`Refresh ${streamer} done!`);
            return sendResponse({result: true});
          });
        });
      }
    });
  }
});

browser.browserAction.onClicked.addListener(async () => {
  await browser.tabs.create({url: browser.runtime.getURL("./popup/index.html")});
});