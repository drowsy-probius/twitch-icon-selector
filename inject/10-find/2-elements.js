////////////////////////////////////////

/**
 * live, vod, popout 여부에 따라서
 * 적절하게 필수 요소를 찾음.
 * 
 * rightColumn  - live, vod
 * 
 * chatArea - live, popout
 * 
 * inputArea - live, popout
 * 
 * inputAreaParent - live, popout
 * 
 * inputSendButton - live, popout
 * 
 * iconArea - live, popout
 * 
 */
const find_2_elements = async () => {
  if(fail)
  {
    logger.info(`[find_1_url]`, error);
    return;
  }

  try 
  {
    if(isPopout)
    {
      logger.debug(`[find_2_elements] popout`);

      chatArea = await waitForElement(chatAreaSelector);
      inputArea = await waitForElement(inputAreaSelector);
      inputAreaParent = await waitForElement(inputAreaParentSelector);
      inputSendButton = await waitForElement(inputSendButtonSelector);
      iconArea = await waitForElement(iconAreaSelector);
    }
    else if(isVod || isClip)
    {
      logger.debug(`[find_2_elements] ${isVod ? "vod" : "clip"}`);

      rightColumn = await waitForElement(rightColumnSelector, document.body);
      profileArea = await waitForElement(profileAreaSelector);
      chatArea = await waitForElement(chatAreaSelector, rightColumn);
    }
    else if(isLive)
    {
      logger.debug(`[find_2_elements] live`);

      isOffline = (await waitForElement(offlineSelector, document.body, 500) !== null);
      if(isOffline)
      {
        fail = true;
        error = `Streamer is offline. exiting... ${location.href}`;
      }

      rightColumn = await waitForElement(rightColumnSelector, document.body);
      streamChatArea = await waitForElement(streamChatSelector, rightColumn);
      chatArea = await waitForElement(chatAreaSelector, rightColumn);
      inputArea = await waitForElement(inputAreaSelector, rightColumn);
      inputAreaParent = await waitForElement(inputAreaParentSelector, rightColumn);
      inputSendButton = await waitForElement(inputSendButtonSelector, rightColumn);
      iconArea = await waitForElement(iconAreaSelector, rightColumn);
    }
    else 
    {
      fail = true;
      error = `Unable to find watching type ${location.href}`
    }

    return [rightColumn, chatArea, inputArea, inputAreaParent, inputSendButton, iconArea];
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