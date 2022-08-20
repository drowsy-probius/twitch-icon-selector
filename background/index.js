import { DAY_IN_MISEC, DAY_IN_MIN, getLatestData, isOutdated, formLocalStorageData } from "../common.js";


const onStartup = () =>{
  // // for debug
  // chrome.alarms.create('dccon-cronjob', {
  //   when: Date.now() + 1000, // execute after 2 sec
  //   periodInMinutes: 1,
  // })

  chrome.alarms.get('dccon-cronjob', (cronjob) => {
      chrome.alarms.create('dccon-cronjob', {
        when: Date.now() + 1000, // execute after 1 secs
        periodInMinutes: DAY_IN_MIN,
      })
    // if(!cronjob)
    // {
    //   chrome.alarms.create('dccon-cronjob', {
    //     when: Date.now() + (DAY_IN_MISEC / (24 * 120)), // execute after 5 minutes
    //     periodInMinutes: DAY_IN_MIN,
    //   })
    // }
  });
}


chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('alarms.onAlarm --'
              + ' name: '          + alarm.name
              + ' scheduledTime: ' + alarm.scheduledTime);

  chrome.storage.local.get(["streamers"], async result => {
    if("streamers" in result)
    {
      const streamers = result.streamers;
      for(const streamer of streamers)
      {
        chrome.storage.local.get([streamer], async result => {
          if(!(streamer in result)) return;
          const data = result[streamer];
          if(!data.length && !isOutdated(data["timestamp"]))
          {
            console.log(`${streamer}'s data is not outdated. do not refresh...`);
            return;
          }

          const newData = await getLatestData(streamer);
          const saveData = {};
          saveData[streamer] = formLocalStorageData(newData);
          chrome.storage.local.set(saveData, () => {
            console.log(`refresh ${streamer}`);
          });
        });
      }
    }
  })
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  console.log(sender.tab ?
    "from a content script:" + sender.tab.url :
    "from the extension");

  if (request.command === "refresh")
  {
    try
    {
      const streamer = request.streamer;
      const data = await getLatestData(streamer);
      const saveData = {};
      saveData[streamer] = formLocalStorageData(data);
      chrome.storage.local.set(saveData, () => {
        console.log(`refresh ${streamer}`);
      });
      sendResponse({result: true});
    }
    catch(e)
    {
      console.error(e);
      sendResponse({result: false});
    }
  }
  else if(request.command === "get")
  {
    try
    {
      const streamer = request.streamer;
      const data = (await chrome.storage.local.get(streamer))[streamer];
      sendResponse({result: data});
    }
    catch(e)
    {
      console.error(e);
      sendResponse({result: false});
    }
  }
});

onStartup();