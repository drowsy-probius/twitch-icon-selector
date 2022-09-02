const setInputTippyInstance = (destroyOnly=false) => {
  try { inputTippyInstance.destroy(); } catch(e) { } 
  if(destroyOnly === true) return;

  inputTippyInstance = tippy(inputArea, {
    content: "",
    placement: "top",
    theme: "twitch",
    trigger: "manual",
  });
}



const chatScrollByOne = () => {
  let scrollHeight = 100;
  if(iconRenderOptions.type === 0)
  {
    scrollHeight = 100;
  }
  else if(iconRenderOptions.type === 1)
  {
    scrollHeight = 70;
  }
  else if(iconRenderOptions.type === 2)
  {
    scrollHeight = 0;
  }
  return document.querySelector(chatScrollSelector)?.scrollBy(0, scrollHeight);
}


/**
 * 사용자가 입력한 채팅을 읽어서
 * 선택한 아이콘의 통계를 만들어주고
 * browser.storage.local에 저장함.
 * @param {string} input 
 * @returns void
 */
const makeStatsFromInput = async (input) => {
  currentChatText = "";
  if(typeof(input) !== "string") return;
  const iconNames = input.trimStart().split(" ").filter(t => t.startsWith("~"));
  const icons = iconNames.map(t => iconMatch(t.slice(1))).filter(t => t !== false);
  if(icons.length === 0) return;

  if(!chromeLocalData || chromeLocalData.length === 0) 
  {
    chromeLocalData = await browser.storage.local.get();
  }
  iconStats = chromeLocalData.iconStats[watchingStreamer] || {};
  
  Promise.all(icons.map(icon => {
    return new Promise((resolve) => {
      resolve({
        "key": icon.nameHash,
        "value": iconStats[icon.nameHash] + 1 || 1
      });
    })
  }))
  .then(async data => {
    const merged = {};
    for(const info of data) merged[info.key] = info.value;

    const newiconStats = {
      ...iconStats,
      ...merged,
    }

    const updateData = {
      ...chromeLocalData,
    }
    updateData.iconStats[watchingStreamer] = newiconStats;

    await browser.storage.local.set(updateData);
    chromeLocalData = await browser.storage.local.get();
    logger.debug(`update localData`, chromeLocalData);
  })
  .catch(err => {
    logger.error(err);
  })
}


/**
 * 아이콘 선택기 창을 연다
 * @param {boolean} open (optional)
 * @returns 
 */
const toggleSelector = (open) => {
  isSelectorOpen = iconSelectorRoot.classList.contains("show");
  if(open === isSelectorOpen) return;

  if(open === true)
  {
    /**
    * 슬로우 모드에서도 적절한 위치에 보여줌.
    */
    const chatPos = document.querySelector(iconSelectorPositionSelector).getBoundingClientRect();
    iconSelectorRoot.style.bottom = `${chatPos.height + 5}px`;

    inputAreaParent.appendChild(iconSelectorRoot);
    iconSelectorRoot.classList.remove("hide");
    iconSelectorRoot.classList.add("show");
    isSelectorOpen = true;
    iconSelectorCursorArrowCount = 0;
  }
  else 
  {
    tippy.hideAll(0);
    iconSelectorRoot.classList.remove("show");
    iconSelectorRoot.classList.add("hide");
    inputAreaParent.removeChild(iconSelectorRoot);
    isSelectorOpen = false;
  }

  if(inputArea) inputArea.focus();
}

/**
 * 아이콘 선택기 창을 구성한다
 * 키워드는 ~가 포함되지 않은 것
 * 
 * @param {string} keyword 
 */
const constructSelectorItems = (keyword) => {
  if(lastSearchKeyword === keyword) return;
  lastSearchKeyword = keyword;
  const itemIconList = iconFilter(keyword).map(icon => preRenderedIcons.thumbnail[icon.nameHash]);
  iconSelectorList.replaceChildren(...itemIconList);
}




////////////////////////////////////////
// handlers


////////////////////
// from user input

/**
 * 아이콘 선택기에서 아이콘을 선택했을 때 호출됨.
 * @param {MouseEvent} e 
 */
const iconClickHandler = async (e) => {
  const currentInput = inputArea.innerText.trimStart().split(" ").pop();
  
  inputArea.focus();
  let keywords = e.target.getAttribute("data-keywords").split(",").map(w => `~${w}`);
  let keyword = keywords[0];
  let isPrefix = false;
  for(let key of keywords)
  {
    if(key.startsWith(currentInput))
    {
      keyword = key;
      isPrefix = true;
    }
  }
  logger.debug(currentInput, currentInput.length, "=>", keyword, "prefix?", isPrefix);
  if(isPrefix)
  {
    /**
     * 중간 말고 처음부터 문자열이 일치하는 경우에는
     * 바로 적용
     */
    const slicedKeyword = keyword.slice(currentInput.length);
    const eventRet = document.execCommand("insertText", false, `${slicedKeyword} `);
    if(eventRet) currentChatText = currentChatText + slicedKeyword + " ";
  }
  await navigator.clipboard.writeText(keyword);
  toggleSelector(false);
}



/**
 * 채팅창에 올라온 아이콘을 선택했을 때 호출됨.
 * @param {MouseEvent} e 
 */
const iconClickHandlerInChat = async (e) => {
  const keyword = e.target.alt;

  if(!isVod) 
  {
    inputArea.focus();
    const eventRet = document.execCommand("insertText", false, `${keyword} `);
    if(eventRet) currentChatText = keyword;
  }

  await navigator.clipboard.writeText(keyword);
}





/**
 * 채팅 입력창에 변화가 생겼을 때 호출됨.
 * @param {KeyboardEvent} e 
 * @returns any
 */
const chatInputHandler = (e) => {
  if(!inputArea || !iconSelectorRoot) return;
  const text = inputArea.innerText.trimStart();
  const isInputChanged = (currentChatText !== text);
  currentChatText = text + "";
  if(e.key === "Escape")
  {
    try
    {
      showSelector = false;
      toggleSelector(false);
    }
    catch(e)
    {
      logger.error(e);
    }
    return;
  }
  if(e.key === "~")
  {
    showSelector = true;
  }
  if(!showSelector) return;

  const isSelectArrowKey = (e.key === "ArrowRight" || e.key === "ArrowLeft");

  const keyword = text.split(" ").pop();
  if(!isSelectArrowKey && (text.length === 0 || keyword.length === 0 || !keyword.startsWith("~")))
  {
    toggleSelector(false);
    return;
  }

  if(isInputChanged)
  {
    toggleSelector(true);
    tippy.hideAll(0);
    constructSelectorItems(keyword.slice(1));
  }
}



/**
 * 키보드로 아이콘 선택하기
 * 계속 입력시에 이동하는거 구현해야해서
 * keydown 이벤트로 따로 분리함.
 * @param {KeyboardEvent} e 
 */
const chatInputHandlerForArrow = async (e) => {
  const text = inputArea.innerText.trimStart();
  if(e.key === "Enter")
  {
    /**
     * Enter키 리스너는 onkeydown 이벤트에 실행되어야
     * 입력한 채팅 값을 사용할 수 있음.
     */
    try
    {
      currentChatText = text + "";
      makeStatsFromInput(currentChatText);
      toggleSelector(false);
    }
    catch(e)
    {
      logger.error(e);
    }
    return;
  }

  isSelectorOpen = iconSelectorRoot.classList.contains("show");
  if(!isSelectorOpen) return;

  if(e.key === "ArrowRight")
  {
    if(iconSelectorList.children[iconSelectorCursor])
    {
      iconSelectorList.children[iconSelectorCursor].classList.remove("selected");
      iconSelectorList.children[iconSelectorCursor]._tippy && iconSelectorList.children[iconSelectorCursor]._tippy.destroy();
    }
    iconSelectorCursor = (iconSelectorList.children.length === iconSelectorCursor + 1)
    ? 0
    : iconSelectorCursor + 1;
    if(iconSelectorCursorArrowCount < 0) iconSelectorCursorArrowCount += 1;

    if(iconSelectorList.children[iconSelectorCursor])
    {
      iconSelectorList.children[iconSelectorCursor].classList.add("selected");
      tippy(iconSelectorList.children[iconSelectorCursor], {
        hideOnClick: true,
        placement: "top",
        theme: "twitch",
      }).show();

      
      const imagePos = iconSelectorList.children[iconSelectorCursor].getBoundingClientRect();
      const selectorPos = iconSelectorListWrapper.getBoundingClientRect();
      const scrollAmount = imagePos.y - selectorPos.y - 5;
      if(scrollAmount !== 0) iconSelectorListWrapper.scrollTop += scrollAmount;
    }
    return;
  }
  if(e.key === "ArrowLeft")
  {
    if(iconSelectorList.children[iconSelectorCursor])
    {
      iconSelectorList.children[iconSelectorCursor].classList.remove("selected");
      iconSelectorList.children[iconSelectorCursor]._tippy && iconSelectorList.children[iconSelectorCursor]._tippy.destroy();
    }
    iconSelectorCursor = (iconSelectorCursor <= 0) ? iconSelectorList.children.length - 1 : iconSelectorCursor - 1;
    iconSelectorCursorArrowCount = Math.max(iconSelectorCursorArrowCount-1, -text.length);

    if(iconSelectorList.children[iconSelectorCursor])
    {
      iconSelectorList.children[iconSelectorCursor].classList.add("selected");
      tippy(iconSelectorList.children[iconSelectorCursor], {
        hideOnClick: true,
        placement: "top",
        theme: "twitch",
      }).show();
      const imagePos = iconSelectorList.children[iconSelectorCursor].getBoundingClientRect();
      const selectorPos = iconSelectorListWrapper.getBoundingClientRect();
      const scrollAmount = imagePos.y - selectorPos.y - 5;
      if(scrollAmount !== 0) iconSelectorListWrapper.scrollTop += scrollAmount;
    }
    return;
  }
  if(e.key === "ArrowDown")
  {
    /**
     * TODO: 위 방향키 누르면 제일 처음으로 가버림
     * 그냥 복사해주는 것으로만 하자
     */
    if(iconSelectorCursor >= 0)
    {
      inputArea.focus();
      const image = iconSelectorList.children[iconSelectorCursor];
      const currentInput = text.split(" ").pop();
      let keywords = image.getAttribute("data-keywords").split(",").map(w => `~${w}`);
      let keyword = keywords[0];
      let isPrefix = false;
      for(let key of keywords)
      {
        if(key.startsWith(currentInput))
        {
          keyword = key;
          isPrefix = true;
        }
      }

      const doPaste = (iconSelectorCursorArrowCount === 0 || text.length === 0);
      logger.debug(currentInput, keyword);
      if(doPaste && isPrefix)
      {
        const slicedKeyword = keyword.slice(currentInput.length);
        const eventRet = document.execCommand("insertText", false, `${slicedKeyword} `);
        if(eventRet) currentChatText = currentChatText + slicedKeyword + " ";
      }
      else 
      {
        /**
         * 클립보드에 복사
         */
        await navigator.clipboard.writeText(keyword);
        if(inputTippyInstance)
        {
          inputTippyInstance.setContent(`복사됨 ${keyword}`);
          inputTippyInstance.show();
          setTimeout(() => {
            inputTippyInstance.hide();
          }, 1000);
        }
      }
      toggleSelector(false);
      image.classList.remove("selected");
      image._tippy && image._tippy.destroy();
      iconSelectorCursor = -1;
      iconSelectorCursorArrowCount = 0;
      return;
    }
  }
  /**
   * 이 부분은 특수 키가 아닐 때만 실행됨 => 변수 초기화
   */  
   iconSelectorList.children[iconSelectorCursor] && iconSelectorList.children[iconSelectorCursor].classList.remove("selected");
  iconSelectorCursor = -1;
}


////////////////////
// from observer

/**
 * 채팅창에 변화가 생겼을 때 호출됨.
 * 
 * 새로 추가된 채팅마다 replaceChatData를 호출함.
 * @param {*} mutationList 
 * @param {*} observer 
 */
const chatObserverHandler = (mutationList, observer) => {
  for(const record of mutationList)
  {
    const children = record.addedNodes;
    for(const child of children)
    {
      child.querySelectorAll(chatBodySelector).forEach(chatDiv => {
        replaceChatData(chatDiv);
      });
    }
  }
}

const streamChatObserverHandler = (mutationList, observer) => {
  if(isChatHidden)
  {
    logger.info(`Chat area is recovered!`);
    if(runner) runner.stop = true;
    streamChatObserver && streamChatObserver.disconnect();
    runner = new Runner(false, 1);
    isChatHidden = false;
  }
  else if(document.querySelector(hiddenChatSelector) !== null)
  {
    logger.info(`Chat area is hidden!`);
    chatAreaObserver && chatAreaObserver.disconnect();
    isChatHidden = true;
  }
}


////////////////////////////////////////
// element 수정


/**
 * 채팅 하나에 대해서 관련된
 * 아이콘이 있으면 아이콘으로 바꿈
 * @param {Element} chatBody 
 */
 const replaceChatData = (chatBody) => {
  const oldFragments = chatBody.children;
  const newFragments = [];


  for(let i=0; i<oldFragments.length; i++)
  {
    const fragment = oldFragments[i];
    if(fragment.classList.contains("text-fragment"))
    {
      const replaced = replaceTextToElements(fragment.innerText);
      newFragments.push(...replaced);
    }
    else 
    {
      newFragments.push(fragment);
    }
  }
  chatBody.replaceChildren(...newFragments);
  chatScrollByOne();
}


/**
 * inputArea가 존재할 때 호출됨
 */
 const inputAreaExists = () => {
  inputArea.onkeyup = chatInputHandler;
  inputArea.onpaste = chatInputHandler;
  inputArea.onkeydown = chatInputHandlerForArrow;
  setInputTippyInstance();
}


/**
 * inputAreaParent가 존재할 때 호출됨
 */
 const inputAreaParentExists = () => {
  /**
   * root
   *  - wrapper
   *    - list
   * 
   */
  if(document.getElementById("icon-selector-root"))
  {
    iconSelectorRoot = document.getElementById("icon-selector-root");
  }
  if(document.getElementById("icon-selector-list"))
  {
    iconSelectorList = document.getElementById("icon-selector-list");
  }
  if(iconSelectorRoot && iconSelectorList) return;

  iconSelectorRoot = document.createElement("div");
  iconSelectorListWrapper = document.createElement("div");
  iconSelectorList = document.createElement("div");

  iconSelectorRoot.id = "icon-selector-root"
  iconSelectorList.id = "icon-selector-list"

  iconSelectorRoot.classList.add("icon-selector-root");
  iconSelectorListWrapper.classList.add("icon-selector-wrapper");
  iconSelectorList.classList.add("icon-list");

  iconSelectorRoot.style.maxHeight = `${SELECTOR_HEIGHT}px`;

  iconSelectorListWrapper.appendChild(iconSelectorList);
  iconSelectorRoot.appendChild(iconSelectorListWrapper);
  isSelectorOpen = false;
   
  iconSelectorList.replaceChildren();
  inputAreaParent.appendChild(iconSelectorRoot);
}


/**
 * iconArea가 존재할 때 호출됨
 */
const iconAreaExists = async () => {
  if(document.getElementById("icon-list-button")) return;
  const openSelectorButton = iconArea.lastChild.cloneNode(true);
  const iconSpace = openSelectorButton.querySelector("svg");
  const icon = document.createElement("img");

  openSelectorButton.id = "icon-list-button";
  openSelectorButton.onclick = (event) => {
    const open = !isSelectorOpen;
    if(open)
    {
      constructSelectorItems("");
    }
    toggleSelector(open);
  }
  
  icon.src = `https://twitch-icons.probius.dev/icon?${32}`;
  iconSpace.replaceWith(icon);
  
  iconArea.insertBefore(openSelectorButton, iconArea.lastChild);
}

/**
 * inputSendButton 존재할 때 호출됨
 */
const inputSendButtonExists = () => {
  inputSendButton.onclick = (e) => {
    makeStatsFromInput(currentChatText);
    currentChatText = "";
    showSelector = true;
    toggleSelector(false);
  }
}

/**
 * chatArea가 존재할 때 호출됨
 */
const chatAreaExists = () => {
  chatArea.querySelectorAll(chatBodySelector).forEach(chatDiv => {
    replaceChatData(chatDiv);
  });
}

////////////////////////////////////////

/**
 * html 요소와 관련이 큰 함수를 선언한다.
 */
const run_1_functions = async () => {
  if(fail)
  {
    logger.info(`[find_3_streamer]`, error);
    return;
  }

  try 
  {
    logger.debug("[run_1_functions]");
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