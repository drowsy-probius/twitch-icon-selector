const URLS = {
  "funzinnu": "https://www.funzinnu.com/stream/dccon.js",
  /**
   * funzinnu
   * 
   * dcConsData = [
   *  {name, uri, keywords: [], tags: []},
   * ]
   */
}

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

let isVod, isPopout;
let dccons;
let runner;
let rightColumn;
let inputArea, inputAreaParent, inputAreaContent;
let chatArea, chatObserver;
let iconArea;
let dcconSelectorRoot, dcconSelectorWrapper, dcconListContainer, dcconDialog;
let dcconSelectorRootIcon, isSelectorOpen;
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

const getRightColumn = () => {
  return isPopout 
  ? document.querySelector('.chat-room')
  : document.querySelector('.right-column');
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

const getRelativePosition = (target, mouseEvent) => {
  const {x, y} = target.getBoundingClientRect();
  const {clientX, clientY} = mouseEvent;

  logger(2, {x: x, y: y}, {x: clientX, y: clientY}, {x: clientX-x , y: clientY-y});

  return {
    x: clientX - x,
    y: clientY - y,
  }
}

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
    dcconDialog = document.getElementById('dccon-dialog');
    dcconDialog.innerHTML = ""
    dcconSelectorRoot.classList.remove("show");
    dcconSelectorRoot.classList.add("hide");
    inputAreaParent.removeChild(dcconSelectorRoot);

  }
}

const dcconMouseoverHandler = async (e) => {
  dcconDialog = document.getElementById('dccon-dialog');
  const popup = document.createElement('div');
  const keyword = e.target.getAttribute("data-keywords").split(",")[0];
  const pos = getRelativePosition(dcconDialog, e);
  popup.classList.add("dcccon-dialog-popup");
  popup.innerText = `${keyword}`;
  popup.style.left = `${pos.x}px`;
  popup.style.top = `${pos.y}px`;
  popup.style.display = `block`;
  dcconDialog.innerHTML = "";
  dcconDialog.appendChild(popup);
}

const dcconMouseoutHandler = async (e) => {
  dcconDialog = document.getElementById('dccon-dialog');
  dcconDialog.innerHTML = "";
}

const dcconClickHandler = async (e) => {
  e.preventDefault();
  const currentInput = getChatInputAreaContent(inputArea).innerText.trim().split(" ").pop();
  
  inputArea.focus();
  let keywords = e.target.getAttribute("data-keywords").split(',');
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
    keyword = keyword.substr(currentInput.length);
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text", `${keyword} `);
    const event = new ClipboardEvent("paste", {
      clipboardData: dataTransfer,
      bubbles: true,
    });
    inputArea.dispatchEvent(event);
    
    toggleSelector(false);
  }
  else 
  {
    /**
     * 아니라면 그냥 클립보드에 복사
     */
    await navigator.clipboard.writeText(keyword);

    dcconDialog = document.getElementById('dccon-dialog');
    const pos = getRelativePosition(dcconDialog, e);
    const popup = document.createElement('div');
    popup.classList.add("dcccon-dialog-popup", "disappear");
    popup.innerText = `${keyword} 복사됨!`;
    popup.style.left = `${pos.x}px`;
    popup.style.top = `${pos.y}px`;
    popup.style.display = `block`;
    dcconDialog.innerHTML = "";
    dcconDialog.appendChild(popup);
  }
}

const dcconClickHandlerInChat = async (e) => {
  e.preventDefault();
  const keyword = `~${e.target.getAttribute("data-keywords").split(',')[0]}`;

  if(inputArea)
  {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData("text", `${keyword} `);
    const event = new ClipboardEvent("paste", {
      clipboardData: dataTransfer,
      bubbles: true,
    });
    inputArea.dispatchEvent(event);
  }
  else 
  {
    await navigator.clipboard.writeText(keyword);

    dcconDialog = document.getElementById('dccon-dialog');
    const popup = document.createElement('div');
    const pos = getRelativePosition(dcconDialog, e);
    popup.classList.add("dcccon-dialog-popup", "disappear");
    popup.innerText = `${keyword} 복사됨!`;
    popup.style.left = `${pos.x}px`;
    popup.style.top = `${pos.y}px`;
    popup.style.display = `block`;
    dcconDialog.innerHTML = "";
    dcconDialog.appendChild(popup);
  }
}

const chatInputHandler = (e) => {
  if(!inputArea || !dcconSelectorRoot) return;
  const text = inputArea.innerText.trimLeft();
  const keyword = text.split(" ").pop();
  if(text.length === 0 || keyword.length === 0 || !keyword.startsWith("~"))
  {
    toggleSelector(false);
    return;
  }
  toggleSelector(true);

  dcconListContainer.innerHTML = "";
  const dcconList = dcconFilter(keyword.substr(1));
  for(const dccon of dcconList)
  {
    const itemIcon = document.createElement("img");
    itemIcon.classList.add("dccon-item");
    itemIcon.src = dccon.uri;

    const keywords = dccon.keywords.map(k => `~${k}`); 

    itemIcon.setAttribute("data-uri", dccon.uri);
    itemIcon.setAttribute("data-name", dccon.name);
    itemIcon.setAttribute("data-keywords", `${keywords}`);
    itemIcon.setAttribute("data-tags", dccon.tags);
    // itemIcon.title = keywords.join(" ");
    itemIcon.alt = keywords;
    itemIcon.onclick = dcconClickHandler;
    itemIcon.onmouseover = dcconMouseoverHandler;
    itemIcon.onmouseout = dcconMouseoutHandler;

    dcconListContainer.appendChild(itemIcon);
  }
}

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

const replaceChatData = (chatDiv) => {
  const parent = chatDiv.parentElement;
  const text = chatDiv.innerText;

  const debugList = [];

  chatDiv.innerText = "";
  text.split(" ").forEach((token, index, arr) => {
    if(token.startsWith('~'))
    {
      const keyword = token.substr(1);
      const dccon = findExactlyMatch(keyword)
      if(dccon)
      {
        const img = document.createElement("img");
        img.classList.add("dccon");
        img.src = dccon.uri;
        // img.title = `~${keyword}`;
        img.alt = `~${keyword}`;
        img.setAttribute("data-uri", dccon.uri);
        img.setAttribute("data-name", dccon.name);
        img.setAttribute("data-keywords", dccon.keywords);
        img.setAttribute("data-tags", dccon.tags);
        img.onclick = dcconClickHandlerInChat;
        img.onmouseover = dcconMouseoverHandler;
        img.onmouseout = dcconMouseoutHandler;
        parent.appendChild(document.createElement("br"));
        parent.appendChild(img);
        parent.appendChild(document.createElement("br"));

        debugList.push(img);

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

    debugList.push(txt);
  });

  logger(2, text, '=>', debugList.map(v => v.alt || v.innerText));
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
  logger(2 , `title changed! reloading...`);
  inputAreaParent = undefined;
  dcconSelectorRoot = undefined;
  dcconListContainer = undefined;
  dcconDialog = undefined;
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

  logger(2 , "vod?", isVod);

  elementInitializer();
  logger(2 , `reloaded!`);
}


const inputAreaExists = () => {
  if(!inputArea || !dccons) return;
  inputAreaParent = inputArea.parentElement;
  inputArea.onkeyup  = chatInputHandler;
  
  /**
   * root
   *  - wrapper
   *    - list
   *  - dialog
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
  function finder(){
    if(isVod === false)
    {
      if(!inputArea)
      {
        logger(2 , "searching chat input area...");
        inputArea = getChatInputArea();
        if(inputArea)
        {
          inputAreaExists();
        }
      }
      if(!iconArea)
      {
        logger(2 , "searching chat icon area...");
        iconArea = getIconArea();
        if(iconArea)
        {

        }
      }
    }

    if(!rightColumn)
    {
      logger(2 , "searching right column...");
      rightColumn = getRightColumn();
      if(rightColumn)
      {
        dcconDialog = document.createElement('div');
        dcconDialog.id = "dccon-dialog";
        rightColumn.appendChild(dcconDialog);
      }
    }

    if(!chatArea)
    {
      logger(2 , "searching chat area...");
      chatArea = getChatArea();
      if(chatArea)
      { 
        replaceChatAll();
        chatObserver = new MutationObserver(chatObserverHandler);
        chatObserver.observe(chatArea, chatObserverOptions);
      }
    }
  }

  finder();
  const job = setInterval(() => {
    if((isVod === false && (!inputArea || !iconArea)) || !chatArea || !rightColumn)
    {
      finder();
    }
    else 
    {
      clearInterval(job);
    }
  }, 100);
}


const run = async () => {
  logger(2 , "loaded!");
  // const streamer = getStreamerFromURL();
  const streamer = "funzinnu";
  if(!(streamer in URLS))
  {
    logger(2 , `${streamer} is not in whitelist. exit...`);
    return;
  }

  dccons = (await chrome.storage.local.get(streamer))[streamer].data;
  if(!dccons || dccons.length === 0)
  {
    chrome.runtime.sendMessage({command: "refresh", streamer: streamer}, async (response) => {
      console.log(response.result);
      dccons = (await chrome.storage.local.get(streamer))[streamer].data;
    });
  }
  logger(2 , `loaded dccon length: ${dccons.length}`);

  titleArea = document.getElementsByTagName('title')[0];
  titleObserver = new MutationObserver(titleObserverHandler);
  titleObserver.observe(titleArea, titleObserverOptions);

  elementInitializer();
}

window.onload = run;

