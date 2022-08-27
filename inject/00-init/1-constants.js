const SELECTOR_HEIGHT = 200;
const ICON_HEIGHT = 100;
const THUMBNAIL_HEIGHT = 40;

////////////////////////////////////////
// element selectors

const rightColumnSelector = `.right-column`;

const chatAreaSelector = `.video-chat__message-list-wrapper ul, .chat-scrollable-area__message-container`;
const chatScrollSelector = `div[data-a-target='chat-scroller'] .simplebar-scroll-content`

const inputAreaSelector = `[data-a-target="chat-input"]`;
const inputAreaParentSelector = `.chat-room__content`;
const inputAreaContentSelector = `[data-a-target="chat-input-text"]`;
const inputSendButtonSelector = `[data-a-target="chat-send-button"]`;

const iconAreaSelector = `.chat-input__input-icons`;
const profileAreaSelector = `[data-a-target="watch-mode-to-home"]`;

const offlineSelector = `.channel-status-info--offline`;

const logger = {
  debug: console.debug.bind(window.console, "[DCCON Selector][DEBUG] "),
  info: console.info.bind(window.console, "[DCCON Selector][INFO] "),
  log: console.log.bind(window.console, "[DCCON Selector][LOG] "),
  error: console.error.bind(window.console, "[DCCON Selector][ERROR] "),
  warn: console.warn.bind(window.console, "[DCCON Selector][WARN] "),
}

/**
 * 실행 중에 변경될 일 없는 변수 선언
 */
const init_1_constants = async () => {
  logger.debug("[init_1_constants]");
  return;
}

////////////////////////////////////////
