const setChatAreaObserver = () => {
  chatAreaObserver = new MutationObserver(chatObserverHandler);
  chatAreaObserver.observe(chatArea, {
    childList: true,
    attributes: false,
    subtree: false,
  });
  return chatAreaObserver;
}

/**
 * 채팅창 숨기기, popout 감시
 */
const setStreamChatObserver = () => {
  if(!streamChatArea) return;
  logger.info(`setStreamChatObserver`, streamChatArea);
  streamChatObserver = new MutationObserver(streamChatObserverHandler);
  streamChatObserver.observe(streamChatArea, {
    childList: true,
  })
}

////////////////////////////////////////

/**
 * title 태그 관찰자와 채팅창 관찰자를 설정한다.
 */
const run_4_observer = async () => {
  if(fail)
  {
    logger.info(`[run_3_modify]`, error);
    return;
  }

  try 
  {
    logger.debug("[run_4_observer]");

    setChatAreaObserver();
    setStreamChatObserver();
    
    const chatType = isVod ? "vod" :
            isPopout ? "popout" :
            isClip ? "clip" : 
            isLive ? "live" : "unknown state";
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