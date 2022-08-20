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

let dccons;
let runner;
let inputArea, inputAreaParent, inputAreaContent;
let chatArea, chatObserver;
let iconArea;
let dcconSelectorRoot, dcconSelectorWrapper, dcconListContainer, dcconDialog;
let dcconSelectorRootIcon, isSelectorOpen;
let titleArea, titleObserver;

/***************************************************** */

const logger = (...args) => {
  console.log("[DCCON Selector] ", ...args);
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
  return document.querySelectorAll(".chat-scrollable-area__message-container")[0];
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
    const dialogParent = document.getElementById("dccon-dialog");
    dialogParent.innerHTML = ""
    dcconSelectorRoot.classList.remove("show");
    dcconSelectorRoot.classList.add("hide");
    inputAreaParent.removeChild(dcconSelectorRoot);

  }
}

const dcconClickHandler = async (e) => {
  e.preventDefault();
  const currentInput = getChatInputAreaContent(inputArea).innerText.trim().split(" ").pop();
  

  // const removeLength = currentInput.length;
  /*
  // hange inputArea to `textarea` tag
  // this is dangerous. 
  
  // if(inputAreaContent.tagName !== "INPUT")
  // {
  //   logger(inputArea, inputAreaContent);

  //   const customInputArea = document.createElement("input");
  //   Array.from(inputAreaContent.attributes).forEach(attribute => {
  //     customInputArea.setAttribute(
  //       attribute.nodeName === "id" ? "data-id" : attribute.nodeName,
  //       attribute.nodeValue
  //     );
  //   });
  //   while(inputAreaContent.childNodes.length > 0)
  //   {
  //     customInputArea.appendChild(inputAreaContent.childNodes[0]);
  //   }
  //   customInputArea.type = "text";
  //   customInputArea.value = inputAreaContent.innerText.trim();

  //   logger(inputArea, customInputArea);
  //   inputAreaContent.parentElement.replaceChild(customInputArea, inputAreaContent);
  //   inputAreaContent = customInputArea;
  // }

  
  // how to remove string in <span> tag?
  
  // const keyboardEvent = new KeyboardEvent("keyup", {
  //   bubbles: true,
  //   cancelable: false,
  //   view: window,
  //   ctrlKey: false,
  //   altKey: false,
  //   shiftKey: false,
  //   metaKey: false,
  //   composed: true,
  //   key: "Backspace",
  //   code: "Backspace",
  // });
  // for(let i=0; i<removeLength; i++)
  // {
  //   logger(inputAreaContent.innerText, inputAreaContent.innerText.slice(0, -1));

  //   inputArea.dispatchEvent(keyboardEvent);
  //   inputAreaContent.innerText = inputAreaContent.innerText.slice(0, -1);
  //   logger(inputAreaContent.value);
  // }
  */
  
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
  logger(currentInput, currentInput.length, keyword, "prefix?", isPrefix);
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
    const parent = document.getElementById("dccon-dialog");
    const pos = e.target.getBoundingClientRect();
    const popup = document.createElement('div');
    popup.classList.add("dcccon-dialog-popup");
    popup.innerText = `${keyword} 복사됨!`;
    popup.style.left = `${pos.x}px`;
    popup.style.top = `${e.pageY + 1 - pos.y - 200}px`;
    popup.style.display = `block`;
    parent.innerHTML = "";

    await navigator.clipboard.writeText(keyword);

    parent.appendChild(popup);
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
    itemIcon.title = keywords.join(" ");
    itemIcon.onclick = dcconClickHandler;

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
  const text = chatDiv.innerText;
  let newHTML = "";
  let tokens = [];
  for(let token of text.split(" "))
  {
    if(token.startsWith('~'))
    {
      const keyword = token.substr(1);
      const dccon = findExactlyMatch(keyword)
      if(dccon)
      {
        token = `<br>
                <img 
                  class="dccon" 
                  src="${dccon.uri}" 
                  data-uri="${dccon.uri}" 
                  data-name="${dccon.name}" 
                  data-keywords="~${keyword}" 
                  title="~${keyword}" 
                  data-tags="${dccon.tags}">
                </img>
                <br>`
      }
    }
    tokens.push(token);
  }
  newHTML = tokens.join(" ");
  if(text !== newHTML)
  {
    chatDiv.innerHTML = newHTML
    // logger(`${text} => ${newHTML}`);
  }
}

const replaceChatAll = () => {
  chatArea.querySelectorAll(".text-fragment").forEach(chatDiv => {
    replaceChatData(chatDiv);
  });
}

const chatObserverHandler = (mutationList, observer) => {
  for(const record of mutationList)
  {
    const children = record.addedNodes;
    for(const child of children)
    {
      const chatDiv = child.querySelector(".text-fragment");
      if(!chatDiv) continue;
      replaceChatData(chatDiv);
    }
  }
}

const titleObserverHandler = (mutationList, observer) => {
  logger(`title changed! reloading...`);
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
  chatObserver.disconnect();
  chatObserver = undefined;

  while(!inputArea)
  {
    inputArea = getChatInputArea();
    if(inputArea)
    {
      inputAreaExists();
    }
  }
  while(!iconArea)
  {
    iconArea = getIconArea();
  }
  while(!chatArea)
  {
    chatArea = getChatArea();
    if(chatArea)
    {
      replaceChatAll();
      chatObserver = new MutationObserver(chatObserverHandler);
      chatObserver.observe(chatArea, chatObserverOptions);
    }
  }
  logger(`reloaded!`);
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
    dcconDialog = document.createElement('div');
    dcconDialog.id = "dccon-dialog";

    dcconSelectorRoot.classList.add("dccon-selector-root");
    dcconSelectorWrapper.classList.add("dccon-selector-wrapper");
    dcconListContainer.classList.add("dccon-list");

    dcconSelectorWrapper.appendChild(dcconListContainer);
    dcconSelectorRoot.appendChild(dcconDialog);
    dcconSelectorRoot.appendChild(dcconSelectorWrapper);
    
    isSelectorOpen = false;
  }
  dcconListContainer.innerHTML = "";
  // inputArea.parentElement.appendChild(dcconSelectorRoot);
}


const run = async () => {
  logger("loaded!");
  // const streamer = getStreamerFromURL();
  const streamer = "funzinnu";
  if(!(streamer in URLS))
  {
    logger(`${streamer} is not in whitelist. exit...`);
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
  logger(`loaded dccon length: ${dccons.length}`);

  titleArea = document.getElementsByTagName('title')[0];
  titleObserver = new MutationObserver(titleObserverHandler);
  titleObserver.observe(titleArea, titleObserverOptions);

  while(!inputArea)
  {
    inputArea = getChatInputArea();
    if(inputArea)
    {
      inputAreaExists();
    }
  }
  while(!iconArea)
  {
    iconArea = getIconArea();
  }
  while(!chatArea)
  {
    chatArea = getChatArea();
    replaceChatAll();

    chatObserver = new MutationObserver(chatObserverHandler);
    chatObserver.observe(chatArea, chatObserverOptions);
  }
}

window.onload = run;

