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
    logger.debug("[init_4_storage]");

    chromeLocalData = await browser.storage.local.get();
    streamers = Object.keys(chromeLocalData.iconMetadata);
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