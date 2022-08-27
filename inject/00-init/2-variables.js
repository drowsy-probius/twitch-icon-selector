let fail = false;
let error = undefined;

let lastUrl = "";
let isWhitelist = false;
let isVod = false;
let isPopout = false;
let isClip = false;
let watchingStreamer = "";

let chromeLocalData = {};
let icons = [];
let streamers = [];
let iconStats = {};

const preRenderedIcons = {
  image: {},
  thumbnail: {},
}

let rightColumn;
let chatArea;
let inputArea, inputAreaParent, inputAreaContent, inputSendButton;
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

let iconSelectorRoot, iconSelectorListWrapper, iconSelectorList;
let isSelectorOpen = false;
let showSelector = true;
let iconSelectorCursor = -1;
let iconSelectorCursorArrowCount = 0;

let imageTippyInstance, thumbnailTippyInstance;


/**
 * 실행 중에 변경될 수 있는
 * 전역 변수 선언
 */
const init_2_variables = async () => {
  logger.debug("[init_2_variables]");
  return;
}

////////////////////////////////////////