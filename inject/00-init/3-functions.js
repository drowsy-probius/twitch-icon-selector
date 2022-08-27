const resetVariables = () => {
  fail = false;
  error = undefined;

  lastUrl = location.href;
  isWhitelist = false;
  isVod = location.href.indexOf("/videos/") !== -1;;
  isPopout = location.href.indexOf("/popout/") !== -1;;
  isClip = location.href.indexOf("/clip/") !== -1;;
  watchingStreamer = undefined;

  chromeLocalData = {};
  icons = [];
  streamers = [];
  dcconStats = {};
  preRenderedIcons.image = {};
  preRenderedIcons.thumbnail = {};

  rightColumn = undefined;
  chatArea = undefined;
  inputArea = undefined;
  inputAreaParent = undefined;
  inputAreaContent = undefined;
  inputSendButton = undefined;
  iconArea = undefined;
  profileArea = undefined;

  currentChatText = "";
  lastSearchKeyword = "SomeImpossibleString!@#@!#!123";

  chatAreaObserver && chatAreaObserver.disconnect();
  chatAreaObserver = undefined;

  iconSelectorRoot = undefined;
  iconSelectorListWrapper = undefined;
  iconSelectorList = undefined;
  isSelectorOpen = false;
  showSelector = true;
  dcconSelectorCursor = -1;
  iconSelectorCursorArrowCount = 0;

  imageTippyInstance = undefined;
  thumbnailTippyInstance = undefined;
  inputTippyInstance = undefined;
}

/**
 * selector에 해당하는 요소가 있을 때까지 대기
 * @param {*} selector 
 * @param {*} parent 
 * @returns 
 */
const waitForElement = (selector, parent) => {
  return new Promise((resolve) => {
    const parentElement = parent ?? document.body;
    if (parentElement.querySelector(selector)) {
      return resolve(parentElement.querySelector(selector));
    }
    const observer = new MutationObserver(mutations => {
      if (parentElement.querySelector(selector)) {
        resolve(parentElement.querySelector(selector));
        observer.disconnect();
      }
    });
    observer.observe(parentElement, {
      childList: true,
      subtree: true
    });
  });
}

const getLeafNode = (parent) => {
  while(parent && parent.children && parent.children.length > 0)
  {
    parent = parent.children[0];
  }
  return parent;
}

/**
 * 
 * @param {*} keyword "~"가 포함되어 있지 않음. 
 */
const iconFilter = (keyword) => {
  const filteredIcons = [];
  const filteredIconsWithStats = [];
  keyword = keyword.toLowerCase(); 
  for(const icon of icons)
  {
    let match = false;
    // 키워드 검색
    const keywords = icon.keywords.map(k => k.toLowerCase())
    for(const key of keywords)
    {
      if(key.indexOf(keyword) !== -1)
      {
        filteredIcons.push(icon);
        match = true;
        break;
      }
    }

    // 태그검색
    if(match) continue;
    const tags = icon.tags.map(t => t.toLowerCase());
    for(const tag of tags)
    {
      if(tag.indexOf(keyword) !== -1)
      {
        filteredIcons.push(icon);
        break;
      }
    }
  }

  for(const icon of filteredIcons)
  {
    const keyword = `~${icon.keywords[0]}`;
    filteredIconsWithStats.push([icon, dcconStats[keyword] || 0]);
  }
  filteredIconsWithStats.sort((a, b) => {
    return b[1] - a[1];
  });
  return filteredIconsWithStats.map(i => i[0]);
}

/**
 * 
 * @param {*} keyword "~"가 포함되어 있지 않음.
 * @returns 
 */
const iconMatch = (keyword) => {
  keyword = keyword.toLowerCase();
  for(const icon of icons)
  {
    const keywords = icon.keywords.map(k => k.toLowerCase());
    if(keywords.includes(keyword))
    {
      return icon;
    }
  }
  return false;
}



////////////////////////////////////////

/**
 * 특정 요소에 의존관계가 없는 함수 선언
 */
const init_3_functions = async () => {
  if(fail) return;

  try 
  {
    logger.debug("[init_3_functions]");
    return resetVariables();
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