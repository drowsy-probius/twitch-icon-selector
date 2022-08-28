////////////////////////////////////////

/**
 * 현재 주소를 변수에 저장하고 
 * vod, popout 여부 확인함
 */
const find_1_url = async () => {
  if(fail)
  {
    logger.info(`[init_5_observer]`, error);
    return;
  }

  try 
  {
    logger.debug(`[find_1_url] ${location.href}`);

    /**
     * 이거 뭔가 순서대로 동작하지 않음.
     * 간단하니까 그냥 계속 체크하는것으로 하자
     */
    lastUrl = location.href;
    isVod = location.href.indexOf("/videos") !== -1;
    isPopout = location.href.indexOf("/popout/") !== -1;
    isClip = location.href.indexOf("/clip/") !== -1;
    isLive = !(isVod && isPopout && isClip);

    return [lastUrl, isVod, isPopout];
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