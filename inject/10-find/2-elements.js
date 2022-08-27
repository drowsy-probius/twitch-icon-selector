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
 * inputAreaContent - live, popout
 * 
 * inputSendButton - live, popout
 * 
 * iconArea - live, popout
 * 
 */
const find_2_elements = async () => {
  if(fail) return;
  try 
  {
    if(isPopout)
    {
      logger.debug(`[find_2_elements] popout`);

      chatArea = await waitForElement(`.chat-scrollable-area__message-container`);
      inputArea = await waitForElement(`[data-a-target="chat-input"]`);
      inputAreaParent = await waitForElement(`.chat-room__content`);
      inputAreaContent = getLeafNode(inputArea);
      inputSendButton = await waitForElement(`[data-a-target="chat-send-button"]`);
      iconArea = await waitForElement(`.chat-input__input-icons`);
    }
    else if(isVod || isClip)
    {
      logger.debug(`[find_2_elements] ${isVod ? "vod" : "clip"}`);

      rightColumn = await waitForElement(`.right-column`, document.body);
      profileArea = await waitForElement(`[data-a-target="watch-mode-to-home"]`);
      chatArea = await waitForElement(`.video-chat__message-list-wrapper ul`, rightColumn);
    }
    else // live
    {
      logger.debug("[find_2_elements] live");

      rightColumn = await waitForElement(`.right-column`, document.body);
      chatArea = await waitForElement(`.chat-scrollable-area__message-container`, rightColumn);
      inputArea = await waitForElement(`[data-a-target="chat-input"]`, rightColumn);
      inputAreaParent = await waitForElement(`.chat-room__content`, rightColumn);
      inputAreaContent = getLeafNode(inputArea);
      inputSendButton = await waitForElement(`[data-a-target="chat-send-button"]`, rightColumn);
      iconArea = await waitForElement(`.chat-input__input-icons`, rightColumn);
    }

    return [rightColumn, chatArea, inputArea, inputAreaParent, inputAreaContent, inputSendButton, iconArea];
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