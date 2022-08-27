/**
 * 새로고침 해야할 지 판단함
 * 
 * 거의 모든 변수를 초기화하고 함수를 다시 시작함.
 * 
 * 이거는 마지막 로직에서 선언, 관리해야한다고 생각함.
 * @param {*} mutationList 
 * @param {*} observer 
 */
 const refreshObserverHandler = async (mutationList, observer) => {
  if(watchingStreamer && lastUrl === location.href) return;
  logger.log(`url changed! reloading...`);

  fail = false;
  error = undefined;
  lastUrl = location.href;

  if(runner) runner.stop = true;
  runner = new Runner(false);
}

const setTitleObserver = () => {
  titleObserver = new MutationObserver(refreshObserverHandler);
  titleObserver.observe(document.getElementsByTagName("title")[0], {
    childList: true,
    attributes: false,
    subtree: false,
  });
}

////////////////////////////////////////

/**
 * title 태그 관찰자 설정
 */
const init_5_observer = async () => {
  if(fail) return;

  try 
  {
    logger.debug("[init_5_observer]");

    return setTitleObserver();
  }
  catch(err)
  {
    fail = true;
    error = err;
  }
  finally
  {
    return;
  }
}

////////////////////////////////////////