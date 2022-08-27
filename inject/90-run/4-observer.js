const setChatAreaObserver = () => {
  chatAreaObserver = new MutationObserver(chatObserverHandler);
  chatAreaObserver.observe(chatArea, {
    childList: true,
    attributes: false,
    subtree: false,
  });
  return chatAreaObserver;
}


////////////////////////////////////////

/**
 * title 태그 관찰자와 채팅창 관찰자를 설정한다.
 */
const run_4_observer = async () => {
  if(fail)
  {
    logger.error(error);
    return;
  }

  try 
  {
    logger.debug("[run_4_observer]");

    setChatAreaObserver();

    const chatType = isVod ? "vod" :
            isPopout ? "popout" :
            isClip ? "clip" : "live";
    logger.log(`Loaded! ${watchingStreamer} in ${chatType}`);
    return true;
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