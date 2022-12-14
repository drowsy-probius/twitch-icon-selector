////////////////////////////////////////

/**
 * 로컬 저장소로부터 데이터를 가져오고
 * streamer 목록을 할당함.
 */
const init_4_storage = async () => {
  if(fail)
  {
    logger.info(`[init_3_functions]`, error);
    return;
  }

  try 
  {
    browserLocalData = await chrome.storage.local.get();
    browserSyncData = await chrome.storage.sync.get();

    iconMetadata = browserLocalData.iconMetadata;
    iconStats = browserLocalData.iconStats;
    iconRenderOptions = browserSyncData.iconRenderOptions;

    streamers = Object.keys(iconStats);
    logger.debug("[init_4_storage] localStorage", iconMetadata, iconStats);
    logger.debug("[init_4_storage] syncStorage", iconRenderOptions);
    return streamers;
  }
  catch(err)
  {
    fail = true;
    error = err;
  }
  finally
  {
    return;
  }
}

////////////////////////////////////////