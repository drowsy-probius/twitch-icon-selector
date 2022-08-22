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

let isWhitelist = false;
let isVod, isPopout;
let watchingStreamer;
let chromeLocalData;
let dccons;
const preRenderedDccons = {
  "full": {},
  "small": {},
  "tippy": {
    "full": {},
    "small": {},
  }
};
let inputArea, inputAreaParent, inputAreaContent;
let chatArea, chatObserver;
let chatSendButton;
let currentChatText;
let iconArea;
let dcconSelectorRoot, dcconSelectorWrapper, dcconListContainer;
let dcconSelectorRootIcon, isSelectorOpen;
let showSelector = true;
let titleArea, titleObserver;

/***************************************************** */

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

const getStreamerFromURL = () => {
  /**
   * use cases:
   * 
   * https://www.twitch.tv/popout/streamer/chat
   * https://www.twitch.tv/streamer
   * 
   */
  const tabURL = location.href;
  const directories = tabURL.split('/');
  let streamer = directories.pop();
  if(streamer === "chat")
  {
    streamer = directories.pop();
  }
  return streamer;
}

const getChatInputArea = () => {
  return document.querySelector('[data-a-target="chat-input"]');
}

const getChatInputAreaContent = (inputArea) => {
  return inputArea.children[0].children[0].children[0].children[0];
}

const getIconArea = () => {
  return document.querySelectorAll(".chat-input__input-icons")[0];
}

const getChatArea = () => {
  return isVod
  ? document.querySelector(".video-chat__message-list-wrapper ul")
  : document.querySelector(".chat-scrollable-area__message-container");
}

const getChatSendButton = () => {
  return document.querySelector('[data-a-target="chat-send-button"]');
}

const getRelativePosition = (target, mouseEvent) => {
  const {x, y} = target.getBoundingClientRect();
  const {clientX, clientY} = mouseEvent;

  return {
    x: clientX - x,
    y: clientY - y,
  }
}

const chatScrollByOne = () => {
  return document.querySelector("div[data-a-target='chat-scroller'] .simplebar-scroll-content")?.scrollBy(0, 100);
}

/**************************************** */

const findExactlyMatch = (keyword) => {
  /**
   * ~로 시작하지 않음.
   */
  for(const dccon of dccons)
  {
    if(dccon.keywords.includes(keyword))
    {
      return dccon;
    }
  }
  return false;
}

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

const makePreRenderedDccons = (dccons) => {
  dccons.forEach(dccon => {
    const fullImg = document.createElement("img");
    const fullTippyInstance = tippy(fullImg, {
      content: `클릭해서 복사 ~${dccon.keywords[0]}`,
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
      content: `클릭해서 복사 ~${dccon.keywords[0]}`,
      hideOnClick: false,
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

const dcconFilter = (keyword) => {
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

const toggleSelector = (open) => {
  isSelectorOpen = inputAreaParent.contains(dcconSelectorRoot)
  if(open === isSelectorOpen) return;

  if(open === true)
  {
    inputAreaParent.appendChild(dcconSelectorRoot);
    dcconSelectorRoot.classList.remove("hide");
    dcconSelectorRoot.classList.add("show");
  }
  else 
  {
    for(const keyname of Object.keys(preRenderedDccons.tippy.small))
    {
      preRenderedDccons.tippy.small[keyname].hide();
    }
    dcconSelectorRoot.classList.remove("show");
    dcconSelectorRoot.classList.add("hide");
    inputAreaParent.removeChild(dcconSelectorRoot);
  }
}


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

const dcconClickHandlerInChat = async (e, tippyInstance) => {
  e.preventDefault();
  const keyword = e.target.alt;

  inputArea.focus();
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
    tippyInstance.setContent(`클릭해서 복사 ${keyword}`);
  }, 1500);
}

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
    finally
    {
      return;
    }
  }
  if(e.key === "Enter")
  {
    try
    {
      makeStatusFromInput(currentChatText);
      currentChatText = "";
      // showSelector = true;
      toggleSelector(false);
    }
    catch(e)
    {
      logger(3, e);
    }
    finally
    {
      return;
    }
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
    // preRenderedDccons.tippy.small[dccon.name].enable();
    dcconListContainer.appendChild(itemIcon);
  }
}

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

const replaceChatAll = () => {
  chatArea && chatArea.querySelectorAll(".text-fragment").forEach(chatDiv => {
    replaceChatData(chatDiv);
  });
}

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

const titleObserverHandler = (mutationList, observer) => {
  logger(1, `title changed! reloading...`);
  inputAreaParent = undefined;
  dcconSelectorRoot = undefined;
  dcconListContainer = undefined;
  dcconSelectorRootIcon = undefined;
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

const inputAreaExists = () => {
  if(!inputArea || !dccons) return;
  inputAreaParent = inputArea.parentElement;
  inputArea.onkeyup = chatInputHandler;
  inputArea.onpaste = chatInputHandler;
  
  /**
   * root
   *  - wrapper
   *    - list
   * 
   */

  if(!dcconSelectorRoot || !dcconListContainer)
  {
    dcconSelectorRoot = document.createElement("div");
    dcconSelectorWrapper = document.createElement("div");
    dcconListContainer = document.createElement("div");

    dcconSelectorRoot.classList.add("dccon-selector-root");
    dcconSelectorWrapper.classList.add("dccon-selector-wrapper");
    dcconListContainer.classList.add("dccon-list");

    dcconSelectorWrapper.appendChild(dcconListContainer);
    dcconSelectorRoot.appendChild(dcconSelectorWrapper);
    isSelectorOpen = false;
  }
  dcconListContainer.innerHTML = "";
  // inputArea.parentElement.appendChild(dcconSelectorRoot);
}


const elementInitializer = () => {
  function metaLoader(){
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
      const profileElement = document.querySelector('[data-a-target="watch-mode-to-home"]');
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
  }

  function finder(){
    if(isVod === false)
    {
      logger(1, "searching chat input area...");
      inputArea = getChatInputArea();
      if(inputArea)
      {
        inputAreaExists();
      }
      
      logger(1, "searching chat icon area...");
      iconArea = getIconArea();
      if(iconArea)
      {

      }

      logger(1, "searching chat send button...");
      chatSendButton = getChatSendButton();
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

    logger(1, "searching chat area...");
    chatArea = getChatArea();
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


const run = async () => {
  logger(1, "start loading...");
  chromeLocalData = (await chrome.storage.local.get());

  titleArea = document.getElementsByTagName('title')[0];
  titleObserver = new MutationObserver(titleObserverHandler);
  titleObserver.observe(titleArea, titleObserverOptions);

  elementInitializer();
}

window.onload = run;
