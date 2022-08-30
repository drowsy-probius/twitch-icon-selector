/**
 * 디시콘 데이터 마다 DOM을 만들어서
 * preRenderedDccons에 저장함.
 * 
 */
 const buildIconElements = async () => {
  await Promise.all(icons.map(icon => {
    return new Promise((resolve, reject) => {
      const iconImage = document.createElement("img");
      if(iconRenderOptions.type === 0)
      {
        iconImage.classList.add("icon");
      }
      else if(iconRenderOptions.type === 1)
      {
        iconImage.classList.add("icon-small");
      }
      else if(iconRenderOptions.type === 2)
      {
        iconImage.classList.add("icon-emoji");
      }
      iconImage.src = icon.uri;
      iconImage.alt = `~${icon.keywords[0]}`;
      iconImage.height = `${0}px`;
      iconImage.onerror = `this.onerror=null; this.src="${icon.originUri}";`;
      iconImage.setAttribute("data-uri", icon.uri);
      iconImage.setAttribute("data-hash", icon.nameHash);
      iconImage.setAttribute("data-name", icon.name);
      iconImage.setAttribute("data-keywords", icon.keywords);
      iconImage.setAttribute("data-tags", icon.tags);
      iconImage.setAttribute("data-tippy-content", `~${icon.keywords[0]}`);
      /**
       * 채팅 창에 렌더되는 큰 이미지는 cloneNode로 복사해서 사용한다.
       * 그런데 cloneNode는 이벤트리스너를 복사할 수 없으니까
       * 복사하는 부분에서 onclick 설정한다.
       */

      const iconThumbnail = document.createElement("img");
      iconThumbnail.classList.add("icon-item");
      iconThumbnail.src = icon.thumbnailUri;
      iconThumbnail.alt = `~${icon.keywords[0]}`;
      iconThumbnail.height = `${0}px`;
      iconThumbnail.onerror = `this.onerror=null; this.src="${icon.originUri}";`;
      iconThumbnail.setAttribute("data-uri", icon.thumbnailUri);
      iconThumbnail.setAttribute("data-hash", icon.nameHash);
      iconThumbnail.setAttribute("data-name", icon.name);
      iconThumbnail.setAttribute("data-keywords", `${icon.keywords}`);
      iconThumbnail.setAttribute("data-tags", icon.tags);
      iconThumbnail.setAttribute("data-tippy-content", `~${icon.keywords[0]}`);
      iconThumbnail.onclick = iconClickHandler;

      preRenderedIcons.image[icon.nameHash] = iconImage;
      preRenderedIcons.thumbnail[icon.nameHash] = iconThumbnail;

      resolve(true);
    })
  }));
  setTippyInstance();
}

////////////////////////////////////////

/**
 * icon 목록을 이용해서 미리 img태그를 생성한 뒤 메모리에 기억한다.
 */
const run_2_createList = async () => {
  if(fail)
  {
    logger.info(`[run_1_functions]`, error);
    return;
  }
  
  try 
  {
    logger.debug("[run_2_createList]");

    await buildIconElements();
    return true;
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