const SELECTOR_HEIGHT = 200;
const ICON_HEIGHT = 100;
const THUMBNAIL_HEIGHT = 40;

////////////////////////////////////////
// element selectors for twitch.tv

const rightColumnSelector = `.right-column`;

// 생방송 채팅창 숨김 감지 위한 선택자
const streamChatSelector = `.stream-chat`;
const hiddenChatSelector = `[data-test-selector="stream-chat-hidden-state"]`;

const chatAreaSelector = `.video-chat__message-list-wrapper ul, .chat-scrollable-area__message-container`;
const chatScrollSelector = `div[data-a-target='chat-scroller'] .simplebar-scroll-content`

const inputAreaSelector = `[data-a-target="chat-input"]`;
const inputAreaParentSelector = `.chat-room__content`;
// const inputAreaContentSelector = `[data-a-target="chat-input-text"]`;
const inputSendButtonSelector = `[data-a-target="chat-send-button"]`;

const iconAreaSelector = `.chat-input__input-icons`;
const profileAreaSelector = `[data-a-target="watch-mode-to-home"]`;

const offlineSelector = `.channel-status-info--offline`;

////////////////////////////////////////
// element selectors for tgd.kr
/**
 * div 태그 안에 각 문단이 p태그로 감싸져 있음.
 */
const articleContentSelector = `#article-content`;

const commentsSelector = `.reply-content`;

const commentInputSelector = `#comment-write-form-area [contenteditable="true"]`;

const commentWriteButtonSelector = `#writeCommentBtn`;

/**
 * 글쓰기 창
 * https://tgd.kr/board/write/streamerID
 */
const articleInputSelector = `#articleWriteForm [contenteditable="true"]`;

const articleWriteButtonSelector = `#article-write-button`;



const logger = {
  debug: console.debug.bind(window.console, "[ICON Selector][DEBUG] "),
  info: console.info.bind(window.console, "[ICON Selector][INFO] "),
  log: console.log.bind(window.console, "[ICON Selector][LOG] "),
  error: console.error.bind(window.console, "[ICON Selector][ERROR] "),
  warn: console.warn.bind(window.console, "[ICON Selector][WARN] "),
}

/**
 * 실행 중에 변경될 일 없는 변수 선언
 */
const init_1_constants = async () => {
  logger.debug("[init_1_constants]");
  return;
}

////////////////////////////////////////
