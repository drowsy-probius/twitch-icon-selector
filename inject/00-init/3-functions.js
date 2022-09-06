const resetVariables = () => {
  fail = false;
  error = undefined;

  lastUrl = location.href;
  isWhitelist = false;
  isVod = location.href.indexOf("/videos/") !== -1;;
  isPopout = location.href.indexOf("/popout/") !== -1;;
  isClip = location.href.indexOf("/clip/") !== -1;;
  isLive = !(isVod && isPopout && isClip);
  watchingStreamer = undefined;

  chromeLocalData = {};
  icons = [];
  streamers = [];
  dcconStats = {};
  iconRenderOptions = {
    type: 0,
  };
  preRenderedIcons.image = {};
  preRenderedIcons.thumbnail = {};

  rightColumn = undefined;
  streamChatArea = undefined;
  chatArea = undefined;
  inputArea = undefined;
  inputSendButton = undefined;
  iconSelectorParent = undefined;
  iconSelectorPosition = undefined;
  iconArea = undefined;
  profileArea = undefined;

  currentChatText = "";
  lastSearchKeyword = undefined;

  chatAreaObserver && chatAreaObserver.disconnect();
  chatAreaObserver = undefined;
  streamChatObserver && streamChatObserver.disconnect();
  streamChatObserver = undefined;
  isChatHidden = false;

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
const waitForElement = (selector, parent, timeout=0) => {
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
    if(timeout > 0)
    {
      setTimeout(() => {
        observer.disconnect();
        resolve(parentElement.querySelector(selector));
      }, timeout);
    }
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
    filteredIconsWithStats.push([icon, iconStats[icon.nameHash] || 0]);
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



/**
 * fork from https://funzinnu.com/stream/js/chatassist.js
 * 
 * @param {*} match 
 * @param {*} direction 
 * @param {*} behavior 
 * @param {*} loop 
 * @param {*} scrollamount 
 * @param {*} scrolldelay 
 * @param {*} body 
 * @returns 
 */
const replaceMarquee = (match, direction, behavior, loop, scrollamount, scrolldelay, body) => {
  // 내용이 빈 mq 태그는 무의미하므로 리턴
  if (typeof body == "undefined") return "";

  // 빈 값 확인
  if (typeof direction == "undefined") direction = "";
  if (typeof behavior == "undefined") behavior = "";
  if (typeof loop == "undefined") loop = "";
  if (typeof scrollamount == "undefined") scrollamount = "";
  if (typeof scrolldelay == "undefined") scrolldelay = "";

  let scrollamount_value = scrollamount.replace(/[^0-9]/g, "");
  // scrollamount 값을 50 이하로 제한함(50이 넘으면 50으로 강제 하향조정)
  if (scrollamount_value > 50) scrollamount = ' scrollamount=50';

  /**
   * body 값은 띄워놔야 아이콘 변환이 더 넓은 범위로 됨
   */
  return `<marquee ${direction} ${behavior} ${loop} ${scrollamount} ${scrolldelay} > ${body} </marquee>`
}


/**
 * fork from https://funzinnu.com/stream/js/chatassist.js
 * 
 * []또는 ``` 등으로 표시된 스타일 태그를 변경
 * 띄어쓰기를 추가해야 제대로 표기될 것이라 생각함.
 * 
 * @param {string} text 
 */
const replaceStyleTags = (text) => {
  // 나무위키식
  text = text.replace(/'''(.*)'''/gi, "<b>$1</b>" );
  text = text.replace(/''(.*)''/gi, "<i>$1</i>");
  text = text.replace(/~~(.*)~~/gi, "<strike>$1</strike>");
  text = text.replace(/--(.*)--/gi, "<strike>$1</strike>");
  text = text.replace(/__(.*)__/gi, "<u>$1</u>");

  //닫는 태그가 없는 [b][i][s]
  text = text.replace(/\[b\](.*)/gi, "<b>$1</b>"); //볼드 [b]blah
  text = text.replace(/\[i\](.*)/gi, "<i>$1</i>"); //이탤릭 [i]blah
  text = text.replace(/\[s\](.*)/gi, "<strike>$1</strike>"); //취소선 [s]blah

  //강제개행
  text = text.replace(/\[br\]/gi, "<br/>");

  /**
   * [mq] marquee 태그
   * 
   * chatassist에서 가져왔는데 이 방식은 
   * direction, behavior, loop, scrollamount, scrolldelay 순서가 맞아야만 실행이 됨.
   * 
   * 사용자 입장에서는 불편하지만
   * 스트리머 쪽에서도 이렇게 렌더링이 되기 때문에
   * 이대로 구현함
   * 
   * 순서 상관 없이 하려면 속성 값 부분 통채로 함수에 넘겨서 처리하도록 하면 됨.  
   * 
   *  */ 
  text = text.replace(/\[mq( direction=[^\ ]*)?( behavior=[^\ ]*)?( loop=[^\ ]*)?( scrollamount=[^\ ]*)?( scrolldelay=[^\ ]*)?\](.+)\[\/mq\]/gi, replaceMarquee);

  return text;
}


const filterHTMLTags = (text) => {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/&amp;gt/g, '&gt').replace(/&amp;lt/g, '&lt');
}

/**
 * 
 * @param {string} text
 * element.innerText 값 
 * @returns 
 * 사진, 태그 등이 변경된 값
 */
 const replaceTextToElements = function (text) {
  let isOneReplaced = false;
  text = filterHTMLTags(text);

  const replaceRecursively = (text) => {
    const container = document.createElement("div");
    container.innerHTML = text;

    const children = [];

    for (const child of container.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        const tokens = child.textContent.trim().split(" ");
        let textStartIndex = 0;
        let tokenIndex;
        for (tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
          const token = tokens[tokenIndex];
          if (!isOneReplaced && token.startsWith("~")) {
            const keyword = token.slice(1);
            const icon = iconMatch(keyword);
            if (icon) {
              /**
               * 아이콘 매치 이전까지의 텍스트를 하나의 .text-fragment로 추가함
               */
              if (tokens.slice(textStartIndex, tokenIndex).join(" ").length > 0) {
                const text = document.createElement("span");
                text.classList.add("text-fragment");
                text.setAttribute("data-a-target", "chat-message-text");
                text.replaceChildren(tokens.slice(textStartIndex, tokenIndex).join(" "));
                children.push(text);
              }
              /**
               * 현재 인덱스는 아이콘이므로
               * +1 한 것을 할당해야함.
               */
              textStartIndex = tokenIndex + 1;

              /**
               * 아이콘 요소 복사해서 생성함
               */
              const image = preRenderedIcons.image[icon.nameHash].cloneNode();
              image.onclick = iconClickHandlerInChat;
              image.onmouseover = () => {
                tippy(image, {
                  hideOnClick: true,
                  placement: "top",
                  theme: "twitch",
                }).show();
              }
              image.onmouseout = () => {
                image._tippy && image._tippy.destroy();
              }
              if (iconRenderOptions.size === 0) {
                const span = document.createElement("span");
                span.classList.add("newline");
                span.appendChild(image);
                children.push(span);
              }
              else if (iconRenderOptions.size === 1) {
                const span = document.createElement("span");
                span.classList.add("newline");
                span.appendChild(image);
                children.push(span);
              }
              else if (iconRenderOptions.size === 2) {
                children.push(image);
              }
              if (iconRenderOptions.size !== 2) isOneReplaced = true;
            }
          }
        }
        /**
         * 토큰 목록 순회한 뒤에
         * 매치된 아이콘이 없었으면 그냥 텍스트 요소로 추가
         */
        if (textStartIndex < tokenIndex && tokens.slice(textStartIndex, tokenIndex).join(" ").length > 0) {
          const text = document.createElement("span");
          text.classList.add("text-fragment");
          text.setAttribute("data-a-target", "chat-message-text");
          text.replaceChildren(tokens.slice(textStartIndex, tokenIndex).join(" "));
          children.push(text);
        }
      }
      else {
        const replacedChild = replaceRecursively(child.innerHTML);
        child.replaceChildren(...replacedChild);
        children.push(child);
      }
    }

    return children;
  }

  /**
   * [] 태그 명령어를 지원할 지에 대한 설정.
   * 
   * 1. 사용자가 비활성화하지 않는 경우
   * 2. 호환되는 스트리머인 경우 (일단은 하드코딩)
   */
  if (iconRenderOptions.disableTags === 0 && tagCommandEnabledStreamers.includes(watchingStreamer)) {
    text = replaceStyleTags(text);
  }
  const replaced = replaceRecursively(text);
  return replaced;
}




////////////////////////////////////////

/**
 * 특정 요소에 의존관계가 없는 함수 선언
 */
const init_3_functions = async () => {
  if(fail)
  {
    logger.info(`[init_2_variables]`, error);
    return;
  }

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