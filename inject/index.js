const WHITELIST_STREAMERS = [
  "funzinnu"
];

/***************************************************** */
const chatObserverOptions = {
  childList: true,
  attributes: false,
  subtree: false,
}

const titleObserverOptions = {
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
  "tippy": {
    "full": {},
    "small": {},
  }
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
 * title 태그 요소
 */
let titleArea
/**
 * title 태그 옵저버
 */
let titleObserver;

/**
 * 디시콘 선택기에서 선택 커서
 * -1이면 비활성화 상태
 */
let dcconSelectorCursor = -1;

/***************************************************** */

/**
 * level
 * 1: console.log
 * 2: console.debug
 * 3: console.error
 */
const logger = (level=1, ...args) => {
  if(level === 1)
  {
    console.log("[DCCON Selector] ", ...args);
  }
  else if(level === 2)
  {
    console.debug("[DCCON Selector] ", ...args);
  }
  else if(level === 3)
  {
    console.error("[DCCON Selector] ", ...args);
  }
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
 * 
 * @param {Element} target 
 * @param {MouseEvent} mouseEvent 
 * @returns Object {x: number, y: number}
 */
const getRelativePosition = (target, mouseEvent) => {
  const {x, y} = target.getBoundingClientRect();
  const {clientX, clientY} = mouseEvent;

  return {
    x: clientX - x,
    y: clientY - y,
  }
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
  if(typeof(input) !== "string") return;
  const icons = input.trimStart().split(" ").filter(t => t.startsWith("~")).filter(t => findExactlyMatch(t.slice(1)) !== false);
  if(icons.length === 0) return;

  const localData = await chrome.storage.local.get();
  const dcconStatus = localData.dcconStatus || {};

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

    const updateDcconStatus = {
      ...dcconStatus,
      ...merged,
    }

    const updateData = {
      ...localData,
      dcconStatus: updateDcconStatus
    }
    chrome.storage.local.set(updateData, () => {
      logger(2, `update dcconStatus`, updateDcconStatus);
    })
  })
  .catch(err => {
    logger(3, err);
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
    const fullTippyInstance = tippy(fullImg, {
      content: `~${dccon.keywords[0]}`,
      hideOnClick: false,
      placement: "auto",
    });
    fullImg.classList.add("dccon");
    fullImg.src = dccon.uri;
    fullImg.alt = `~${dccon.keywords[0]}`;
    fullImg.setAttribute("data-uri", dccon.uri);
    fullImg.setAttribute("data-name", dccon.name);
    fullImg.setAttribute("data-keywords", dccon.keywords);
    fullImg.setAttribute("data-tags", dccon.tags);
    fullImg.onclick = (event) => dcconClickHandlerInChat(event, fullTippyInstance);

    const smallImg = document.createElement("img");
    const smallTippyInstance = tippy(smallImg, {
      content: `~${dccon.keywords[0]}`,
      hideOnClick: true,
      placement: "auto",
    });
    smallImg.classList.add("dccon-item");
    smallImg.src = `${dccon.uri}?small`;
    smallImg.alt = `~${dccon.keywords[0]}`;
    smallImg.setAttribute("data-uri", dccon.uri);
    smallImg.setAttribute("data-name", dccon.name);
    smallImg.setAttribute("data-keywords", `${dccon.keywords}`);
    smallImg.setAttribute("data-tags", dccon.tags);
    smallImg.onclick = (event) => dcconClickHandler(event, smallTippyInstance);

    preRenderedDccons.full[dccon.name] = fullImg;
    preRenderedDccons.small[dccon.name] = smallImg;
    preRenderedDccons.tippy.full[dccon.name] = fullTippyInstance;
    preRenderedDccons.tippy.small[dccon.name] = smallTippyInstance;
  })
}

/**************************************** */
/**************************************** */

/**
 * ~가 포함되지 않는 키워드를 받아서
 * 해당 키워드와 관련된 디시콘 목록을 알려줌 
 * @param {string} keyword 
 * @returns DcconData[]
 */
const dcconFilter = (keyword) => {
  if(keyword.length === 0)
  {
    return dccons;
  }

  result = [];
  for(const dccon of dccons)
  {
    let isInsert = false;
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
    const chatPos = inputArea.getBoundingClientRect();
    const selectorPos = dcconSelectorWrapper.getBoundingClientRect();
    dcconSelectorRoot.style.top = `${chatPos.top - DCCON_SELECTOR_HEIGHT - 60}px`;

    inputAreaParent.appendChild(dcconSelectorRoot);
    dcconSelectorRoot.classList.remove("hide");
    dcconSelectorRoot.classList.add("show");
    isSelectorOpen = true;
  }
  else 
  {
    tippy.hideAll(0);
    dcconSelectorRoot.classList.remove("show");
    dcconSelectorRoot.classList.add("hide");
    inputAreaParent.removeChild(dcconSelectorRoot);
    isSelectorOpen = false;
  }

  if(inputArea) inputArea.focus();
}

/**
 * 디시콘 선택기에서 디시콘을 선택했을 때 호출됨.
 * @param {MouseEvent} e 
 * @param {tippy} tippyInstance 
 */
const dcconClickHandler = async (e, tippyInstance) => {
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
  logger(2 , currentInput, currentInput.length, keyword, "prefix?", isPrefix);
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
    toggleSelector(false);
  }
  else 
  {
    /**
     * 아니라면 그냥 클립보드에 복사
     */
    await navigator.clipboard.writeText(keyword);
    toggleSelector(false);
  }
}

/**
 * 채팅창에 올라온 디시콘을 선택했을 때 호출됨.
 * @param {MouseEvent} e 
 * @param {tippy} tippyInstance 
 */
const dcconClickHandlerInChat = async (e, tippyInstance) => {
  e.preventDefault();
  const keyword = e.target.alt;

  if(!isVod) inputArea.focus();
  if(inputArea && inputArea.innerText.trimStart().length === 0)
  {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text", `${keyword} `);
    const event = new ClipboardEvent("paste", {
      clipboardData: dataTransfer,
      bubbles: true,
    });
    inputArea.dispatchEvent(event);
    currentChatText = keyword;
    tippyInstance.setContent(`채팅창에 복사됨`);
  }
  else 
  {
    await navigator.clipboard.writeText(keyword);
    tippyInstance.setContent(`클립보드에 복사됨`);
  }
  setTimeout(() => {
    tippyInstance.setContent(`${keyword}`);
  }, 1500);
}

/**
 * 채팅 입력창에 변화가 생겼을 때 호출됨.
 * @param {KeyboardEvent} e 
 * @returns any
 */
const chatInputHandler = (e) => {
  if(!inputArea || !dcconSelectorRoot) return;
  if(e.key === "Escape")
  {
    try
    {
      showSelector = false;
      toggleSelector(false);
    }
    catch(e)
    {
      logger(3, e);
    }
    return;
  }
  if(e.key === "Enter")
  {
    try
    {
      makeStatusFromInput(currentChatText);
      currentChatText = "";
      toggleSelector(false);
    }
    catch(e)
    {
      logger(3, e);
    }
    return;
  }
  if(e.key === "~")
  {
    showSelector = true;
  }
  if(!showSelector) return;

  const text = inputArea.innerText.trimStart();
  currentChatText = text;
  const keyword = text.split(" ").pop();
  if(text.length === 0 || keyword.length === 0 || !keyword.startsWith("~"))
  {
    toggleSelector(false);
    return;
  }

  toggleSelector(true);
  dcconListContainer.innerHTML = "";
  const dcconList = dcconFilter(keyword.slice(1));
  for(const dccon of dcconList)
  {
    const itemIcon = preRenderedDccons.small[dccon.name];
    dcconListContainer.appendChild(itemIcon);
  }
}

/**
 * 키보드로 디시콘 선택하기
 * 계속 입력시에 이동하는거 구현해야해서
 * keydown 이벤트로 따로 분리함.
 * @param {KeyboardEvent} e 
 */
const chatInputHandlerForArrow = (e) => {
  if(e.key === "ArrowDown")
  {
    dcconSelectorCursor >= 0 && dcconListContainer.children[dcconSelectorCursor].classList.remove("enlarge");
    dcconSelectorCursor = (dcconListContainer.children.length === dcconSelectorCursor + 1)
    ? dcconSelectorCursor
    : dcconSelectorCursor + 1;
    dcconListContainer.children[dcconSelectorCursor].classList.add("enlarge");
    return;
  }
  if(e.key === "ArrowUp")
  {
    dcconSelectorCursor >= 0 && dcconListContainer.children[dcconSelectorCursor].classList.remove("enlarge");
    dcconSelectorCursor = (dcconSelectorCursor <= 0) ? dcconSelectorCursor : dcconSelectorCursor - 1;
    dcconSelectorCursor >= 0 && dcconListContainer.children[dcconSelectorCursor].classList.add("enlarge");
    return;
  }
  if(e.key === "ArrowRight")
  {
    /**
     * TODO: 위 방향키 누르면 제일 처음으로 가버림
     */
    if(dcconSelectorCursor >= 0)
    {
      inputArea.focus();
      const image = dcconListContainer.children[dcconSelectorCursor];
      const keyword = image.alt;
      const currentInput = getChatInputAreaContent(inputArea).innerText.trim().split(" ").pop();
      const slicedKeyword = keyword.slice(currentInput.length);
      const dataTransfer = new DataTransfer();
      dataTransfer.setData("text", `${slicedKeyword} `);
      const event = new ClipboardEvent("paste", {
        clipboardData: dataTransfer,
        bubbles: true,
      });
      inputArea.dispatchEvent(event);
      currentChatText = currentChatText + slicedKeyword;
      toggleSelector(false);

      dcconListContainer.children[dcconSelectorCursor].classList.remove("enlarge");
      dcconSelectorCursor = -1;
      return;
    }
  }
  /**
   * 이 부분은 특수 키가 아닐 때만 실행됨 => 변수 초기화
   */  
  dcconSelectorCursor >= 0 && dcconListContainer.children[dcconSelectorCursor].classList.remove("enlarge");
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
        const img = preRenderedDccons.full[dccon.name];
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

  // logger(2, text, '=>', debugList.map(v => v.alt || v.innerText));
}

/**
 * 채팅창에 있는 모든 채팅에 대해서
 * replaceChatData를 호출함.
 * 
 * 보통 첫 시작때 호출함.
 */
const replaceChatAll = () => {
  chatArea && chatArea.querySelectorAll(".text-fragment").forEach(chatDiv => {
    replaceChatData(chatDiv);
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
}

/**
 * title 태그에 변화가 생겼을 때 호출됨.
 * 
 * 거의 모든 변수를 초기화하고 함수를 다시 시작함.
 * @param {*} mutationList 
 * @param {*} observer 
 */
const titleObserverHandler = (mutationList, observer) => {
  logger(1, `title changed! reloading...`);
  dcconSelectorRoot = undefined;
  dcconListContainer = undefined;
  inputArea = undefined;
  inputAreaContent = undefined;
  inputAreaParent = undefined;
  iconArea = undefined;
  chatArea = undefined;
  chatObserver && chatObserver.disconnect();
  chatObserver = undefined;
  isVod = location.href.indexOf("videos") !== -1;
  isPopout = location.href.indexOf("popout") !== -1;

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

  const buttonClone = iconArea.lastChild.cloneNode(true);
  const iconSpace = buttonClone.querySelector("svg");
  const icon = document.createElement("img");

  buttonClone.id = "icon-list-button";
  buttonClone.onclick = (event) => {
    const open = !isSelectorOpen;
    if(open)
    {
      dcconListContainer.innerHTML = "";
      const dcconList = dcconFilter("");
      for(const dccon of dcconList)
      {
        const itemIcon = preRenderedDccons.small[dccon.name];
        dcconListContainer.appendChild(itemIcon);
      }
    }
    toggleSelector(open);
  }
  

  icon.src = `https://twitch-icons.probius.dev/icon?${32}`;
  iconSpace.replaceWith(icon);
  
  iconArea.insertBefore(buttonClone, iconArea.lastChild);
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
        logger(2, `Unable to find profile element. wait again...`);
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
    watchingStreamer = "funzinnu";
    isWhitelist = true;
    /** FOR DEV */
  }

  /**
   * DOM을 찾는 함수
   */
  async function finder(){
    if(isVod === false)
    {
      logger(2, "searching chat input area...");
      inputArea = await getChatInputArea();
      if(inputArea)
      {
        inputAreaExists();
      }

      logger(2, "searching chat input area parent...");
      inputAreaParent = await getChatInputAreaParent();
      if(inputAreaParent)
      {
        inputAreaParentExists();
      }
      
      logger(2, "searching chat icon area...");
      iconArea = await getIconArea();
      if(iconArea)
      {
        iconAreaExists();
      }

      logger(2, "searching chat send button...");
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

    logger(2, "searching chat area...");
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
      logger(1, `${watchingStreamer} is not in our whitelist`);
      clearInterval(job);
      return;
    }

    if(!dccons) dccons = chromeLocalData[watchingStreamer].data;
    if(!dccons || dccons.length === 0)
    {
      chrome.runtime.sendMessage({command: "refresh", streamer: streamer}, async (response) => {
        console.log(response.result);
        chromeLocalData = await chrome.storage.local.get();
        dccons = chromeLocalData[watchingStreamer].data;
      });
    }
    makePreRenderedDccons(dccons);

    logger(1, `loaded ${watchingStreamer}'s dccon! length: ${dccons.length}`);

    if((isVod === false && (!inputArea || !iconArea || !chatSendButton)) || !chatArea)
    {
      finder();
    }
    else 
    {
      logger(1, `loaded!`);
      clearInterval(job);
    }
  }, 100);
}

/**
 * 스크립트 실행!
 */
const run = async () => {
  logger(1, "start loading...");
  chromeLocalData = (await chrome.storage.local.get());

  titleArea = document.getElementsByTagName('title')[0];
  titleObserver = new MutationObserver(titleObserverHandler);
  titleObserver.observe(titleArea, titleObserverOptions);

  elementInitializer();
}

window.onload = run;
