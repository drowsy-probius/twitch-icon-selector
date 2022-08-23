import { DAY_IN_MIN, getLatestData, isOutdated, formLocalStorageData, isValidStreamer, makeCallback } from "../common.js";


const onStartup = () =>{
  chrome.alarms.get('dccon-cronjob', (cronjob) => {
      chrome.alarms.create('dccon-cronjob', {
        when: Date.now() + 1000, // execute after 1 secs
        periodInMinutes: DAY_IN_MIN,
      })
  });
}


chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('alarms.onAlarm --'
              + ' name: '          + alarm.name
              + ' scheduledTime: ' + alarm.scheduledTime);

  chrome.storage.local.get(async result => {
    if("streamers" in result)
    {
      const streamers = result.streamers;
      for(const streamer of streamers)
      {
        chrome.storage.local.get(async result => {
          if(!(streamer in result)) return;
          const data = result[streamer];
          if(!data.length && !isOutdated(data["timestamp"]))
          {
            console.log(`${streamer}'s data is not outdated. do not refresh...`);
            return;
          }

          const newData = await getLatestData(streamer);
          const localData = await chrome.storage.local.get();
          localData[streamer] = formLocalStorageData(newData);
          chrome.storage.local.set(localData, () => {
            console.log(`Refresh ${streamer} done!`);
          });
        });
      }
    }
  })
});


chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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

      if(!isValidStreamer(streamer))
      {
        return sendResponse({result: false});
      }

      chrome.storage.local.get((data) => {
        localData = data;
        if(!isOutdated(localData[streamer].timestamp))
        {
          console.log(`Data for ${streamer} is not Outdated. Skip updating...`);
          return sendResponse({result: true});
        }
      });

      makeCallback(async () => {
        const data = await getLatestData(streamer);
        localData[streamer] = formLocalStorageData(data);
      }, () => {
        chrome.storage.local.set(localData, () => {
          console.log(`Refresh ${streamer} done!`);
          return sendResponse({result: true});
        });
      })
    }
    catch(e)
    {
      console.error(e);
      return sendResponse({result: false});
    }
  }
});

onStartup();