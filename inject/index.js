const WHITELIST_STREAMERS = [
  "funzinnu"
];

/***************************************************** */
const chatObserverOptions = {
  childList: true,
  attributes: false,
  subtree: false,
}

const refreshObserverOptions = {
  childList: true,
  attributes: false,
  subtree: false,
}

/**
 * 디시콘 선택기 최대 높이
 */
const DCCON_SELECTOR_HEIGHT = 200;

/**
 * 현재 스트리머가 지원되는가?
 */
let isWhitelist = false;

/**
 * 현재 주소가 VOD 주소인가?
 */
let isVod

/**
 * 현재 주소가 popout chatting 주소인가?
 */
let isPopout;

/**
 * 현재 시청 중인 스트리머의 아이디
 */
let watchingStreamer;

/**
 * chrome.storage.local에서 가져온 모든 데이터
 */
let chromeLocalData;

/**
 * chrome.storage.local에 저장된 모든 디시콘 정보
 */
let dccons;

/**
 * 디시콘 정보로부터 미리 만들어 둔 DOM
 * tippy는 팝업창. 실시간으로 만들면 딜레이가 심함
 */
const preRenderedDccons = {
  "full": {},
  "small": {},
};

/**
 * 채팅 입력 공간
 */
let inputArea;
/**
 * 채팅 입력 공간의 부모
 */
let inputAreaParent;
/**
 * 실제 채팅이 입력되는 공간
 */
let inputAreaContent;

/**
 * 채팅방의 채팅 요소들
 */
let chatArea;
/**
 * 채팅방에 올라오는 채팅 옵저버
 */
let chatObserver;

/**
 * 채팅 전송 버튼
 */
let chatSendButton;

/**
 * 현재 입력한 채팅 글자
 */
let currentChatText;

/**
 * 마지막에 검색된 키워드
 * 이전과 같으면 새로 구성하지 않으므로
 * 연산 절약 가능
 */
let lastSearchKeyword;

/**
 * 채팅창에서 부가 버튼 공간. 이 곳에 앱 아이콘 넣을 것임
 */
let iconArea;

/**
 * 디시콘 선택기 창
 */
let dcconSelectorRoot;
/**
 * 디시콘 선택기 창 Wrapper
 */
let dcconSelectorWrapper;
/**
 * 디시콘 선택기 창에서 디시콘 목록 Conatiner
 */
let dcconListContainer;

// 선택기 창이 열려있는가?
let isSelectorOpen = false;

/**
 * 채팅을 키보드로만 입력하는 것이 아니라 
 * 클립보드 붙여넣기 등으로도 입력 됨.
 * 
 * 그러한 경우에 입력된 값에 따라서 선택기를 
 * 여는지 결정하는 변수
 * 
 * 사실 필요한지 고민임.
 */
let showSelector = true;

/**
 * 이전 페이지의 url 주소
 */
let lastUrl = "";
/**
 * 새 페이지인지 확인하는 옵저버
 */
let refreshObserver;

/**
 * 디시콘 선택기에서 선택 커서
 * 무한하게 증가, 감소 가능
 */
let dcconSelectorCursor = -1;

/**
 * 디시콘 선택기에서 현재 커서 아이템을
 * 바로 붙여넣기 가능한지에 대한 값.
 * 
 * 커서가 오른쪽으로 이동하면 +, 왼쪽으로 이동하면 -값을 더하며
 * 최대 값은 0임.
 * 값이 0이면 붙여넣기 가능
 */
let dcconSelectorCursorPaste = 0;

/**
 * 사용자가 입력한 디시콘 통계
 * 로컬에 저장됨.
 */
let dcconStatus = {};

/**
 * tippy instance
 */
let fullTippyInstance, smallTippyInstance;

/***************************************************** */

const logger = {
  debug: console.debug.bind(window.console, "[DCCON Selector][DEBUG] "),
  info: console.info.bind(window.console, "[DCCON Selector][INFO] "),
  log: console.log.bind(window.console, "[DCCON Selector][LOG] "),
  error: console.error.bind(window.console, "[DCCON Selector][ERROR] "),
  warn: console.warn.bind(window.console, "[DCCON Selector][WARN] "),
}

/***************************************************** */

/**
 * 
 * @param {string} selector 
 * @returns Promise<Element>
 */
const waitForElement = (selector) => {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(mutations => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

/**
 * callback 함수 실행되게 만들어줌
 * @returns 
 */
const makeCallback = (execute, callback) => {
  return new Promise((resolve, reject) => {
    try{ resolve(execute()); } catch(e) { reject(e) }
  })
  .then(_ => {
    callback();
  })
}


/**
 * 인덱스를 안전하게 바꿔줌 
 * 
 * @param {number} length 
 * @param {number} index 
 */
const indexNormalizer = (length, index) => {
  if(typeof(length) !== "number" || typeof(index) !== "number")
  {
    logger.error("is not a number", length, index);
    return 0;
  }
  while(index < 0) index += length;
  while(index >= length) index -= length;
  return index;
}

/***************************************************** */


/**
 * 
 * @returns Promise<Element>
 */
const getChatInputArea = () => {
  return waitForElement(`[data-a-target="chat-input"]`);
}

/**
 * 
 * @param {Element} inputArea 
 * @returns Element
 */
const getChatInputAreaContent = (inputArea) => {
  return inputArea.children[0].children[0].children[0].children[0];
}

/**
 * 
 * @returns Promise<Element>
 */
const getChatInputAreaParent = () => {
  return waitForElement(".chat-room__content");
}

/**
 * 
 * @returns Promise<Element>
 */
const getIconArea = () => {
  return waitForElement(".chat-input__input-icons")
}

/**
 * 
 * @returns Promise<Element>
 */
const getChatArea = () => {
  return isVod
  ? waitForElement(".video-chat__message-list-wrapper ul")
  : waitForElement(".chat-scrollable-area__message-container");
}

/**
 * 
 * @returns Promise<Element>
 */
const getChatSendButton = () => {
  return waitForElement('[data-a-target="chat-send-button"]');
}

/**
 * 
 * @returns Promise<Element>
 */
const getProfile = () => {
  return waitForElement('[data-a-target="watch-mode-to-home"]');
}

/**
 * 맨 마지막 채팅에 디시콘이 추가되면
 * 100px만큼 스크롤해줌
 * @returns void
 */
const chatScrollByOne = () => {
  return document.querySelector("div[data-a-target='chat-scroller'] .simplebar-scroll-content")?.scrollBy(0, 100);
}

/**************************************** */

/**
 * ~로 시작하지 않는 키워드가 주어지면
 * 키워드와 정확히 일치하는 디시콘을 알려줌
 * @param {string} keyword 
 * @returns boolean | Object
 */
const findExactlyMatch = (keyword) => {
  /**
   * 아직 디시콘이 로딩되지 않았을 때
   */
  if(!dccons) return false;

  for(const dccon of dccons)
  {
    if(dccon.keywords.includes(keyword))
    {
      return dccon;
    }
  }
  return false;
}

/**
 * 사용자가 입력한 채팅을 읽어서
 * 선택한 디시콘의 통계를 만들어주고
 * chrome.storage.local에 저장함.
 * @param {string} input 
 * @returns void
 */
const makeStatusFromInput = async (input) => {
  currentChatText = "";
  // logger.debug("Chat input", input);
  if(typeof(input) !== "string") return;
  const icons = input.trimStart().split(" ").filter(t => t.startsWith("~")).filter(t => findExactlyMatch(t.slice(1)) !== false);
  if(icons.length === 0) return;

  if(!chromeLocalData || chromeLocalData.length === 0) chromeLocalData = await chrome.storage.local.get();
  dcconStatus = chromeLocalData.dcconStatus[watchingStreamer] || {};

  Promise.all(icons.map(icon => {
    return new Promise((resolve) => {
      resolve({
        "key": icon,
        "value": dcconStatus[icon] ? dcconStatus[icon] + 1 : 1
      });
    })
  }))
  .then(data => {
    const merged = {};
    for(const info of data) merged[info.key] = info.value;

    dcconStatus = {
      ...dcconStatus,
      ...merged,
    }

    const updateData = {
      ...chromeLocalData,
    }
    updateData.dcconStatus[watchingStreamer] = dcconStatus;

    chrome.storage.local.set(updateData, () => {
      logger.debug(`update dcconStatus`, dcconStatus);
    })
  })
  .catch(err => {
    logger.error(err);
  })
}

/**
 * 디시콘 데이터 마다 DOM을 만들어서
 * preRenderedDccons에 저장함.
 * 
 * @param {DcconData} dccons 
 */
const makePreRenderedDccons = (dccons) => {
  dccons.forEach(dccon => {
    const fullImg = document.createElement("img");
    fullImg.classList.add("dccon");
    fullImg.src = dccon.uri;
    fullImg.alt = `~${dccon.keywords[0]}`;
    fullImg.height = "100px";
    fullImg.onerror = `this.onerror=null; this.src="${dccon.originUri}";`;
    fullImg.setAttribute("data-uri", dccon.uri);
    fullImg.setAttribute("data-hash", dccon.nameHash);
    fullImg.setAttribute("data-name", dccon.name);
    fullImg.setAttribute("data-keywords", dccon.keywords);
    fullImg.setAttribute("data-tags", dccon.tags);
    fullImg.setAttribute("data-tippy-content", `~${dccon.keywords[0]}`);
    /**
     * 채팅 창에 렌더되는 큰 이미지는 cloneNode로 복사해서 사용한다.
     * 그런데 cloneNode는 이벤트리스너를 복사할 수 없으니까
     * 복사하는 부분에서 onclick 설정한다.
     */

    const smallImg = document.createElement("img");
    smallImg.classList.add("dccon-item");
    smallImg.src = dccon.thumbnailUri;
    smallImg.alt = `~${dccon.keywords[0]}`;
    smallImg.height - "40px";
    smallImg.onerror = `this.onerror=null; this.src="${dccon.originUri}";`;
    smallImg.setAttribute("data-uri", dccon.thumbnailUri);
    smallImg.setAttribute("data-hash", dccon.nameHash);
    smallImg.setAttribute("data-name", dccon.name);
    smallImg.setAttribute("data-keywords", `${dccon.keywords}`);
    smallImg.setAttribute("data-tags", dccon.tags);
    smallImg.setAttribute("data-tippy-content", `~${dccon.keywords[0]}`);
    smallImg.onclick = dcconClickHandler;

    preRenderedDccons.full[dccon.nameHash] = fullImg;
    preRenderedDccons.small[dccon.nameHash] = smallImg;
  });
  setTippyInstance();
}


/**
 * tippy instance를 삭제, 생성함
 * @param {boolean} small 
 * @param {boolean} destroyOnly 
 */
const setTippyInstance = (small, destroyOnly=false) => {
  if(small === true) try { smallTippyInstance.unmount(); smallTippyInstance.destroy(); } catch(e) { }
  if(small === false) try { fullTippyInstance.unmount(); fullTippyInstance.destroy(); } catch(e) { }
  
  if(destroyOnly === true) return;

  if(small === true) smallTippyInstance = tippy(".dccon-item", {
    hideOnClick: true,
    placement: "top",
    theme: "twitch",
  });

  if(small === false) fullTippyInstance = tippy(".dccon", {
    hideOnClick: true,
    placement: "top",
    theme: "twitch",
  });
}


/**************************************** */

/**
 * ~가 포함되지 않는 키워드를 받아서
 * 해당 키워드와 관련된 디시콘 목록을 알려줌 
 * @param {string} keyword 
 * @returns DcconData[]
 */
const dcconFilter = (keyword) => {
  const result = [];
  const dcconWithFrequency = [];
  for(const dccon of dccons)
  {
    const keyword = `~${dccon.keywords[0]}`
    if(keyword in dcconStatus)
    {
      dcconWithFrequency.push([dccon, dcconStatus[keyword]]);
    }
    else 
    {
      dcconWithFrequency.push([dccon, 0]);
    }
  }

  dcconWithFrequency.sort((a, b) => {
    return b[1] - a[1];
  });

  /**
   * 검색 값이 없으면 그냥 리턴함.
   */
  if(keyword.length === 0)
  {
    return dcconWithFrequency.map(v => v[0]);
  }

  for(const dcconInfo of dcconWithFrequency)
  {
    const dccon = dcconInfo[0];
    let isInsert = false;
    /**
     * 키워드 검색
     */
    for(const key of dccon.keywords)
    {
      if(key.indexOf(keyword) !== -1)
      {
        result.push(dccon);
        isInsert = true;
        break;
      }
    }
    if(isInsert) continue;
    /**
     * 태그 검색
     */
    for(const tag of dccon.tags)
    {
      if(tag.indexOf(keyword) !== -1)
      {
        result.push(dccon);
        break;
      }
    }
  }
  return result;
}

/**
 * 디시콘 선택기 창을 연다
 * @param {boolean} open (optional)
 * @returns 
 */
const toggleSelector = (open) => {
  isSelectorOpen = dcconSelectorRoot.classList.contains("show");
  if(open === isSelectorOpen) return;

  if(open === true)
  {
    makeCallback(() => {
      const chatPos = inputArea.getBoundingClientRect();
      // const selectorPos = dcconSelectorWrapper.getBoundingClientRect();
      dcconSelectorRoot.style.bottom = `${chatPos.height + 60}px`;

      inputAreaParent.appendChild(dcconSelectorRoot);
      dcconSelectorRoot.classList.remove("hide");
      dcconSelectorRoot.classList.add("show");
      isSelectorOpen = true;
      dcconSelectorCursorPaste = 0;
    }, () => {
      setTippyInstance(true, false);
    });
  }
  else 
  {
    makeCallback(() => {
      tippy.hideAll(0);
      dcconSelectorRoot.classList.remove("show");
      dcconSelectorRoot.classList.add("hide");
      inputAreaParent.removeChild(dcconSelectorRoot);
      isSelectorOpen = false;
    }, () => {
      setTippyInstance(true, true);
    })
  }

  if(inputArea) inputArea.focus();
}

/**
 * 디시콘 선택기 창을 구성한다
 * 키워드는 ~가 포함되지 않은 것
 * 
 * @param {string} keyword 
 */
const constructSelectorItems = (keyword) => {
  if(lastSearchKeyword === keyword) return;
  lastSearchKeyword = keyword;

  dcconListContainer.innerHTML = "";
  const dcconList = dcconFilter(keyword);
  for(const dccon of dcconList)
  {
    const itemIcon = preRenderedDccons.small[dccon.nameHash];
    dcconListContainer.appendChild(itemIcon);
  }
}

/**
 * 디시콘 선택기에서 디시콘을 선택했을 때 호출됨.
 * @param {MouseEvent} e 
 */
const dcconClickHandler = async (e) => {
  e.preventDefault();
  const currentInput = getChatInputAreaContent(inputArea).innerText.trim().split(" ").pop();
  
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
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text", `${slicedKeyword} `);
    const event = new ClipboardEvent("paste", {
      clipboardData: dataTransfer,
      bubbles: true,
    });
    inputArea.dispatchEvent(event);
    currentChatText = currentChatText + slicedKeyword;
  }
  await navigator.clipboard.writeText(keyword);
  toggleSelector(false);
}

/**
 * 채팅창에 올라온 디시콘을 선택했을 때 호출됨.
 * @param {MouseEvent} e 
 */
const dcconClickHandlerInChat = async (e) => {
  const keyword = e.target.alt;

  if(!isVod) 
  {
    makeCallback(() => {
      inputArea.focus();
    }, () => {
      const dataTransfer = new DataTransfer();
      dataTransfer.setData("text", `${keyword} `);
      const event = new ClipboardEvent("paste", {
        clipboardData: dataTransfer,
        bubbles: true,
      });
      inputArea.dispatchEvent(event);
      currentChatText = keyword;
    });
  }
  await navigator.clipboard.writeText(keyword);
}

/**
 * 채팅 입력창에 변화가 생겼을 때 호출됨.
 * @param {KeyboardEvent} e 
 * @returns any
 */
const chatInputHandler = (e) => {
  if(!inputArea || !dcconSelectorRoot) return;
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
    constructSelectorItems(keyword.slice(1));
  }
}

/**
 * 키보드로 디시콘 선택하기
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
      makeStatusFromInput(currentChatText);
      toggleSelector(false);
    }
    catch(e)
    {
      logger.error(e);
    }
    return;
  }

  if(e.key === "ArrowRight")
  {
    if(dcconSelectorCursor >= 0) dcconListContainer.children[dcconSelectorCursor].classList.remove("selected");
    dcconSelectorCursor = (dcconListContainer.children.length === dcconSelectorCursor + 1)
    ? dcconSelectorCursor
    : dcconSelectorCursor + 1;
    dcconListContainer.children[dcconSelectorCursor].classList.add("selected");
    if(dcconSelectorCursorPaste < 0) dcconSelectorCursorPaste += 1;

    if(dcconSelectorCursor >= 0)
    {
      const imagePos = dcconListContainer.children[dcconSelectorCursor].getBoundingClientRect();
      const selectorPos = dcconSelectorWrapper.getBoundingClientRect();
      const scrollAmount = imagePos.y - selectorPos.y - 5;
      if(scrollAmount !== 0) dcconSelectorWrapper.scrollTop += scrollAmount;
    }
    return;
  }
  if(e.key === "ArrowLeft")
  {
    dcconSelectorCursor >= 0 && dcconListContainer.children[dcconSelectorCursor].classList.remove("selected");
    dcconSelectorCursor = (dcconSelectorCursor <= 0) ? dcconSelectorCursor : dcconSelectorCursor - 1;
    dcconSelectorCursor >= 0 && dcconListContainer.children[dcconSelectorCursor].classList.add("selected");
    dcconSelectorCursorPaste -= 1;

    if(dcconSelectorCursor >= 0)
    {
      const imagePos = dcconListContainer.children[dcconSelectorCursor].getBoundingClientRect();
      const selectorPos = dcconSelectorWrapper.getBoundingClientRect();
      const scrollAmount = imagePos.y - selectorPos.y - 5;
      if(scrollAmount !== 0) dcconSelectorWrapper.scrollTop += scrollAmount;
    }
    return;
  }
  if(e.key === "ArrowDown")
  {
    /**
     * TODO: 위 방향키 누르면 제일 처음으로 가버림
     * 그냥 복사해주는 것으로만 하자
     */
    if(dcconSelectorCursor >= 0)
    {
      inputArea.focus();
      const image = dcconListContainer.children[dcconSelectorCursor];
      const currentInput = getChatInputAreaContent(inputArea).innerText.trim().split(" ").pop();
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

      const doPaste = (dcconSelectorCursorPaste === 0 || text.length === 0);
      logger.debug(currentInput, keyword);
      if(doPaste && isPrefix)
      {
        const slicedKeyword = keyword.slice(currentInput.length);
        const dataTransfer = new DataTransfer();
        dataTransfer.setData("text", `${slicedKeyword} `);
        const event = new ClipboardEvent("paste", { 
          clipboardData: dataTransfer,
          bubbles: true,
        });
        inputArea.dispatchEvent(event);
        currentChatText = currentChatText + slicedKeyword;
      }
      else 
      {
        /**
         * 클립보드에 복사만 되는 경우는 
         * 커서가 끝으로 이동한 경우라서 
         * 다시 선택기를 보여주지 않음.
         */
        showSelector = false;
        if(isPrefix)
        {
          const slicedKeyword = keyword.slice(currentInput.length);
          await navigator.clipboard.writeText(slicedKeyword);
        }
        else 
        {
          await navigator.clipboard.writeText(keyword);
        }
      }
      toggleSelector(false);
      dcconListContainer.children[dcconSelectorCursor].classList.remove("selected");
      dcconSelectorCursor = -1;
      dcconSelectorCursorPaste = 0;
      return;
    }
  }
  /**
   * 이 부분은 특수 키가 아닐 때만 실행됨 => 변수 초기화
   */  
  dcconSelectorCursor >= 0 && dcconListContainer.children[dcconSelectorCursor].classList.remove("selected");
  dcconSelectorCursor = -1;
}

/**
 * 채팅 하나에 대해서 관련된
 * 디시콘이 있으면 디시콘으로 바꿈
 * @param {Element} chatDiv 
 */
const replaceChatData = (chatDiv) => {
  const parent = chatDiv.parentElement;
  const text = chatDiv.innerText;

  chatDiv.innerText = "";
  text.split(" ").forEach((token, index, arr) => {
    if(token.startsWith('~'))
    {
      const keyword = token.slice(1);
      const dccon = findExactlyMatch(keyword);
      if(dccon)
      {
        const img = preRenderedDccons.full[dccon.nameHash].cloneNode();
        img.onclick = dcconClickHandlerInChat;
        parent.appendChild(document.createElement("br"));
        parent.appendChild(img);
        parent.appendChild(document.createElement("br"));
        chatScrollByOne();
        return;
      }
    }

    const txt = document.createElement("span");
    txt.classList.add("text-fragment");
    txt.setAttribute("data-a-target", "chat-message-text");
    txt.innerText = token;
    if(index < arr.length - 1)
    {
      txt.innerText += " ";
    }
    parent.appendChild(txt);
  });

  // logger.debug(text, '=>', debugList.map(v => v.alt || v.innerText));
}

/**
 * 채팅창에 있는 모든 채팅에 대해서
 * replaceChatData를 호출함.
 * 
 * 보통 첫 시작때 호출함.
 */
const replaceChatAll = () => {
  makeCallback(() => {
    chatArea && chatArea.querySelectorAll(".text-fragment").forEach(chatDiv => {
      replaceChatData(chatDiv);
    });
  }, () => {
    setTippyInstance(false, false);
  });
}

/**
 * 채팅창에 변화가 생겼을 때 호출됨.
 * 
 * 새로 추가된 채팅마다 replaceChatData를 호출함.
 * @param {*} mutationList 
 * @param {*} observer 
 */
const chatObserverHandler = (mutationList, observer) => {
  makeCallback(() => {
    for(const record of mutationList)
    {
      const children = record.addedNodes;
      for(const child of children)
      {
        child.querySelectorAll(".text-fragment").forEach(chatDiv => {
          replaceChatData(chatDiv);
        });
      }
    }
  }, () => {
    setTippyInstance(false, false);
  });
}

/**
 * 각 페이지에서 사용되는 변수를 초기화함
 */
const resetVariables = () => {
  lastUrl = location.href;
  isWhitelist = false;
  isVod = undefined;
  isPopout = undefined;
  watchingStreamer = undefined;
  chromeLocalData = {};
  dccons = [];
  preRenderedDccons.full = {};
  preRenderedDccons.small = {};

  inputArea = undefined;
  inputAreaParent = undefined;
  inputAreaContent = undefined;

  chatArea = undefined;
  chatObserver && chatObserver.disconnect();
  chatObserver = undefined;
  chatSendButton = undefined;
  currentChatText = "";
  iconArea = undefined;

  dcconSelectorRoot = undefined;
  dcconSelectorWrapper = undefined;
  dcconListContainer = undefined;
  isSelectorOpen = false;
  showSelector = true;
  dcconSelectorCursor = -1;
  dcconSelectorCursorPaste = 0;
  dcconStatus = {};
}

/**
 * 새로고침 해야할 지 판단함
 * 
 * 거의 모든 변수를 초기화하고 함수를 다시 시작함.
 * @param {*} mutationList 
 * @param {*} observer 
 */
const refreshObserverHandler = (mutationList, observer) => {
  if(watchingStreamer && lastUrl === location.href) return;
  logger.log(`url changed! reloading...`);
  resetVariables();
  elementInitializer();
}

/**
 * inputArea가 존재할 때 호출됨
 */
const inputAreaExists = () => {
  inputArea.onkeyup = chatInputHandler;
  inputArea.onpaste = chatInputHandler;
  inputArea.onkeydown = chatInputHandlerForArrow;
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
  if(document.getElementById("dccon-selector-root"))
  {
    dcconSelectorRoot = document.getElementById("dccon-selector-root");
  }
  if(document.getElementById("dccon-selector-list"))
  {
    dcconListContainer = document.getElementById("dccon-selector-list");
  }
  if(dcconSelectorRoot && dcconListContainer) return;

  dcconSelectorRoot = document.createElement("div");
  dcconSelectorWrapper = document.createElement("div");
  dcconListContainer = document.createElement("div");

  dcconSelectorRoot.id = "dccon-selector-root"
  dcconListContainer.id = "dccon-selector-list"

  dcconSelectorRoot.classList.add("dccon-selector-root");
  dcconSelectorWrapper.classList.add("dccon-selector-wrapper");
  dcconListContainer.classList.add("dccon-list");

  dcconSelectorRoot.style.maxHeight = `${DCCON_SELECTOR_HEIGHT}px`;

  dcconSelectorWrapper.appendChild(dcconListContainer);
  dcconSelectorRoot.appendChild(dcconSelectorWrapper);
  isSelectorOpen = false;
   
  dcconListContainer.innerHTML = "";
  inputAreaParent.appendChild(dcconSelectorRoot);
}

/**
 * iconArea가 존재할 때 호출됨
 */
const iconAreaExists = () => {
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
 * 전체 변수를 초기화 함
 */
const elementInitializer = () => {
  /**
   * isVod, isPopout, watchingStreamer, isWhitelist 등
   * 요소를 읽지 않고 알아낼 수 있는 정보를 초기화 함.
   */
  async function metaLoader(){
    isVod = location.href.indexOf("videos") !== -1;
    isPopout = location.href.indexOf("popout") !== -1;
    if(isPopout)
    {
      /**
       * https://www.twitch.tv/popout/streamer/chat
       */
      watchingStreamer = location.href.split("/").slice(-2)[0];
    }
    else if(isVod)
    {
      const profileElement = await getProfile();
      if(profileElement === undefined || profileElement === null)
      {
        logger.debug(`Unable to find profile element. wait again...`);
        return;
      }
      watchingStreamer = profileElement.href.split("/").pop().split("?")[0];
    }
    else 
    {
      /**
       * https://www.twitch.tv/streamer?asdf
       */
      watchingStreamer = location.href.split("/").pop().split("?")[0];
    }
    watchingStreamer = watchingStreamer.toLowerCase();
    isWhitelist = WHITELIST_STREAMERS.includes(watchingStreamer);

    /** FOR DEV */
    // watchingStreamer = "funzinnu";
    // isWhitelist = true;
    /** FOR DEV */
  }

  /**
   * dccon 로딩하는 함수
   */
  async function dcconLoader(){
    try 
    {
      const response = await chrome.runtime.sendMessage({command: "refresh", streamer: watchingStreamer});
      /**
       * TODO:
       * 이거 왜 자꾸 undefined로 나오냐
       */
      // logger.debug(response);
      chromeLocalData = await chrome.storage.local.get();
      const streamerData = chromeLocalData.dcconMetadata[watchingStreamer];
      if(streamerData === undefined)
      {
        logger.log(`${watchingStreamer} is not in local cache.`, chromeLocalData);
        return;
      }
      dccons = streamerData.data;
      dcconStatus = chromeLocalData.dcconStatus[watchingStreamer];
      makePreRenderedDccons(dccons);
      logger.log(`loaded ${watchingStreamer}'s dccon! length: ${dccons.length}`);
    }
    catch(err)
    {
      logger.error(watchingStreamer, err);
    }
  }

  /**
   * DOM을 찾는 함수
   */
  async function finder(){
    if(isVod === false)
    {
      logger.debug("searching chat input area...");
      inputArea = await getChatInputArea();
      if(inputArea)
      {
        inputAreaExists();
      }

      logger.debug("searching chat input area parent...");
      inputAreaParent = await getChatInputAreaParent();
      if(inputAreaParent)
      {
        inputAreaParentExists();
      }
      
      logger.debug("searching chat icon area...");
      iconArea = await getIconArea();
      if(iconArea)
      {
        iconAreaExists();
      }

      logger.debug("searching chat send button...");
      chatSendButton = await getChatSendButton();
      if(chatSendButton)
      {
        chatSendButton.onclick = (e) => {
          makeStatusFromInput(currentChatText);
          currentChatText = "";
          showSelector = true;
          toggleSelector(false);
        }
      }
    }

    logger.debug("searching chat area...");
    chatArea = await getChatArea();
    if(chatArea)
    { 
      replaceChatAll();
      chatObserver = new MutationObserver(chatObserverHandler);
      chatObserver.observe(chatArea, chatObserverOptions);
    }
  }

  metaLoader();
  if(isWhitelist) finder();
  const job = setInterval(() => {

    metaLoader();
    if(!isWhitelist)
    {
      logger.log(`${watchingStreamer} is not in our whitelist`);
      clearInterval(job);
      return;
    }
    const getDcconCondition = (!chromeLocalData || chromeLocalData.length === 0 || !dccons || dccons.length === 0);
    const getElementCondition = ((isVod === false && (!inputArea || !iconArea || !chatSendButton)) || !chatArea);

    if(getDcconCondition || getElementCondition)
    {
      if(getDcconCondition)
      {
        dcconLoader();
      }
      if(getElementCondition)
      {
        finder();
      }
    }
    else 
    {
      logger.log(`loaded!`);
      // logger.debug(`isVod`, isVod, `inputArea`, inputArea, 'chatArea', chatArea, 'dccons', dccons);
      clearInterval(job);
    }
  }, 100);
}

/**
 * 스크립트 실행!
 */
const run = async () => {
  logger.log("start loading...");
  chromeLocalData = (await chrome.storage.local.get());

  lastUrl = location.href;
  refreshObserver = new MutationObserver(refreshObserverHandler);
  refreshObserver.observe(document.getElementsByTagName("title")[0], refreshObserverOptions);

  elementInitializer();
}

window.onload = run;


/**
 * 버그 리포트 일지
 * 
 * 채팅 설정 -> 채팅 팝업/채팅창 숨기기를 한 뒤에 채팅표시하기로 넘어왔을 때 정상작동하지 않음.
 * 
 * 방향키 좌우 입력할 때 복사 가능한지 계산이 잘 안되는 것 같음.
 * 
 * 
 * 
 */
