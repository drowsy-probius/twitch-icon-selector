////////////////////////////////////////////////////////////
// 설정 값

const WHITELIST_STREAMERS = [
  "funzinnu"
];

////////////////////////////////////////////////////////////
// 전역 변수


////////////////////////////////////////////////////////////
// 공통 함수

const logger = {
  debug: console.debug.bind(window.console, "[DCCON Selector][DEBUG] "),
  info: console.info.bind(window.console, "[DCCON Selector][INFO] "),
  log: console.log.bind(window.console, "[DCCON Selector][LOG] "),
  warn: console.warn.bind(window.console, "[DCCON Selector][WARN] "),
  error: console.error.bind(window.console, "[DCCON Selector][ERROR] "),
}

/**
 * 
 * @param parent 
 * HTML Element
 * @returns 
 * 1번째 최하위 요소
 */
const getLeafElement = (parent) => {
  let node = parent;
  while(node && node.children && node.children.length !== 0)
  {
    node = node.children[0];
  }
  return node;
}

////////////////////////////////////////////////////////////
// html 요소 검색 관련 함수

/**
 * 채팅 공간 중 최상위 요소을 리턴함.
 * 
 * .stream-chat이면 생방송 채팅창, 또는 popout 채팅창
 * .video-chat이면 다시보기 채팅창
 * @returns 
 * 채팅 구역
 */
const getChatArea = () => {
  return document.querySelector(`.stream-chat, .video-chat`);
}

/**
 * 
 * .chat-scrollable-area__message-container 이면 생방송 또는 popout
 * .video-chat__message-list-wrapper ul 이면 다시보기
 * 
 * @param {*} parent 
 * getChatArea함수로 얻은 채팅 구역
 * @returns 
 * 채팅 목록이 올라오는 구역
 */
const getChatListArea = (parent) => {
  return parent.querySelector(`.chat-scrollable-area__message-container, .video-chat__message-list-wrapper ul`);
}


/**
 * 
 * @param parent 
 * getChatArea함수로 얻은 채팅 구역
 * @returns 
 * 사용자 입력 구역
 */
const getChatInputArea = (parent) => {
  return getLeafElement(parent.querySelector(`[data-a-target="chat-input"]`));
}

/**
 * 
 * @param parent 
 * getChatArea함수로 얻은 채팅 구역
 * @returns 
 * 비트, 이모티콘 등의 선택 아이콘이 있는 구역
 */
const getChatIconArea = (parent) => {
  return parent.querySelector(`.chat-input__input-icons`);
}


/**
 * 
 * @param parent 
 * getChatArea함수로 얻은 채팅 구역
 * @returns 
 * 채팅 보내기 버튼 요소 (button)
 */
const getChatSendButton = (parent) => {
  return parent.querySelector(`[data-a-target="chat-send-button"]`);
}

/**
 * VOD 시청 중일때 스트리머 아이디를 url로부터 알아낼 수 없음.
 * 스트리머 홈 관련 요소에서 가져옴
 * @returns 
 * 스트리머 프로필 요소
 */
const getStreamerProfile = () => {
  return document.querySelector(`[data-a-target="watch-mode-to-home"]`);
}


////////////////////////////////////////////////////////////
// html 요소 조작 관련 함수

/**
 * 올라온 채팅이 디시콘일 경우 디시콘 크기 (100px)만큼 아래로 스크롤함
 * @returns 
 */
const scrollChatByOne = () => {
  return document.querySelector("div[data-a-target='chat-scroller'] .simplebar-scroll-content")?.scrollBy(0, 100);
}



////////////////////////////////////////////////////////////
// 디시콘 관련 함수

/**
 * 디시콘 메타데이터를 로컬 저장소로부터 불러옴
 * 
 * @param {string} streamer 
 * @returns 
 */
const getDcconsFromStorage = (streamer) => {
  return new Promise(async (resolve, reject) => {
    try 
    {
      localData = await chrome.storage.local.get();
      const streamerData = localData.dcconMetadata[streamer];
      if(streamerData === undefined)
      {
        logger.warn(`${streamer}'s dccon is not in local cache`, localData);
        return;
      }
      logger.info(`loaded ${streamer}'s dccon! length:${streamerData.data.length}`);
      resolve(streamerData.data);
    }
    catch(err)
    {
      reject(err);
    }
  })
}

/**
 * 
 * @param {*} dccons 
 * @param {*} keyword 
 * ~가 포함되지 않은 키워드
 * @param {*} options 
 * @returns 
 */
const filterDcconsByKeyword = (dccons, keyword, options) => {
  const result = [];
  const dcconStatus = options.dcconStatus ?? [];
  for(const dccon of dccons)
  {
    const keywords = dccon.keywords ?? [];
  }
  return result;
}


////////////////////////////////////////////////////////////
// 옵저버 처리기

/**
 * html-head-title 태그 감시
 * (웹 페이지 이동할 때 여기가 변경됨)
 * @param {*} mutationList 
 * @param {*} observer 
 */
const titleObserverHandler = (mutationList, observer) => {

}

/**
 * 채팅창에 새로운 채팅이 올라옴 감지
 * @param {*} mutationList 
 * @param {*} observer 
 */
const chatListObserverHandler = (mutationList, observer) => {

}

/**
 * 채팅창 사라짐, 생김 감시
 * @param {*} mutationList 
 * @param {*} observer 
 */
const chatAreaObserverHandler = (mutationList, observer) => {

}


////////////////////////////////////////////////////////////
// 이벤트 리스너



const chatInputAreaKeyupHandler = (e) => {

}


const chatInputAreaKeydownHandler = (e) => {

}


////////////////////////////////////////////////////////////
// 




////////////////////////////////////////////////////////////
// 시작점

const entryFunction = () => {

}

window.onload = entryFunction;