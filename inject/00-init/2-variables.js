let fail = false;
let error = undefined;

let lastUrl = "";
let isWhitelist = false;
let isVod = false;
let isPopout = false;
let isClip = false;
let isLive = false;
let isOffline = false;
let watchingStreamer = "";

let chromeLocalData = {};
let icons = [];
let streamers = [];
let iconStats = {};


let iconRenderOptions = {
  /**
   * 0: default (100, 100)
   * 1: small (70, 70)
   * 2: emoji (28, 28) and inline (no render limit)
   */
  type: 0,

}

const preRenderedIcons = {
  image: {},
  thumbnail: {},
}

let rightColumn, streamChatArea;
let chatArea;
let inputArea, inputAreaParent, inputSendButton;
let iconSelectorPosition;
let iconArea;
let profileArea;

let currentChatText;
let lastSearchKeyword;

/**
 * chatAreaObserver: 채팅창 숨기기, 다시 열기 등 감시
 * titleObserver: 다른 주소로 이동할 때 title태그가 변경됨. 
 *                그것으로 페이지 변경 감시
 */
let chatAreaObserver, titleObserver;
let streamChatObserver;
let isChatHidden = false;

let iconSelectorRoot, iconSelectorListWrapper, iconSelectorList;
let isSelectorOpen = false;
let showSelector = true;
let iconSelectorCursor = -1;
let iconSelectorCursorArrowCount = 0;

let imageTippyInstance, thumbnailTippyInstance;
let inputTippyInstance;


/**
 * 실행 중에 변경될 수 있는
 * 전역 변수 선언
 */
const init_2_variables = async () => {
  logger.debug("[init_2_variables]");
  return;
}

////////////////////////////////////////