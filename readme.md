# Deprecated

이 레포는 업데이트되지 않습니다.

이후 유지보수 및 개발은 아래 레포에서 진행됩니다.

[iconttv-extension](https://github.com/iconttv/iconttv-extension)

---

# Features

- 트위치 생방송, 트위치 다시보기, popout 채팅창, 클립 페이지에서 작동
- 페이지 이동 시에도 끊김 없이 동작
- 버튼 클릭 시 아이콘 목록 보기
- 채팅창에 `~` 입력 시 아이콘 목록 검색 가능
- 아이콘 목록에서 `←`, `→`으로 탐색, `↓`으로 입력. (커서가 입력의 끝이 아닐 때는 남은 문자열을 클립보드에 복사함) 
- 아이콘 목록에서 클릭시 입력창에 붙여넣기 또는 클립보드에 복사
- 채팅창에서 아이콘 클릭 시 입력창에 붙여넣기 또는 클립보드에 복사
- ~~아이콘 목록은 사용자가 입력한 아이콘 중에서 빈도가 높은 순으로 정렬되어서 표시됩니다. (개인 통계 부분은 브라우저에 로그인 되어 있다면 동기화 됩니다.)~~
- 일부 스트리머에 한해서 `[]` 명령어를 지원합니다. 
```
[b]굵은글씨
[i]기울어짐
[s]취소선
'''굵은글씨'''
''기울어짐''
~~취소선~~
--취소선--
__밑줄글씨__
[br]줄바꿈
[mq]흘러갈말[/mq]
```



![채팅창 데모](./no_extension/demo_chat.gif)

- 전체 아이콘 목록과 개인 통계를 볼 수 있음. [소스코드 - chrome branch](https://github.com/k123s456h/twitch-icon-frontend) 

![통계창 데모](./no_extension/demo_frontend.gif)

# special thanks to...

Funzinnu

Icons by svgrepo.com

# FAQs

- 이미지 서버는 어떤 것으로 사용하는가?

개인 서버에서 업데이트가 필요할 때마다 또는 2주마다 해당 스트리머가 제공하는 아이콘 목록을 불러온 후 파싱 및 서버에 캐시해놓음. 그것을 사용함.

# TODOs?

## BUGs
- [ ] `[mq]`태그에서 `direction` 설정하고 `scrollamount` 설정한 뒤에 `s` 자동완성 할 때 `scrolldelay`가 표시되지 않고 `scrollamount`가 나오는 버그 있음.

- [ ] 아래키 입력 이후에 채팅을 전부 지우고 다시 쓸 때 절반 정도의 경우로 선택기가 활성화 되지 않음 : `~팝콘` 입력 후 페페팝콘 선택한 다음에 ~까지 지우고 아무 글자나 친 뒤 다시 전부 지우고 ~입력해보기 // 재현되지 않음. 테스트 필요
- [ ] 채팅창의 플러그인 아이콘 공간을 사용자 입력이 침범할 수 있음. 동작에 문제를 주지는 않음. 미적인 영역. 스트리머마다 비트 아이콘이 선택 사항이라서 고정적인 값으로 css를 변경할 수 없음. 비트가 있으면 `[data-a-target="cat-input"]`의 css 중 `padding-right`가 `9.5rem` 없으면 `6.5rem`이면 적당함. => betterttv 형식으로 바꾸면 해결될 문제
- [ ] 렌더링 되지 않은 아이콘 항목도 통계에 반영되는 현상. 수정할 필요는 없다고 생각함.

- [ ] 채팅 일시 밴 당한 이후에 자동으로 로직이 동작하지 않음. => betterttv 형식으로 바꾸면 해결될 문제


- [x] ~~볼트공중 작게부터 안돌아감 => 아이콘에 공통 클래스를 넣어서 해결~~
- [x] ~~자동 스크롤 안됨 => `chatScrollByOne`를 제일 마지막에 실행하는 것으로 해결~~
- [x] ~~특정 상황에서 마우스 툴팁이 뜨지 않는 경우가 있음. 아마 키보드 선택 활성화 이후에 발생하는 것으로 보임. 선택창 닫고 연 뒤에는 정상화 됨~~
- [x] ~~채팅창 숨기고 다시 보였을 때 선택기가 활성화 되지 않음 => .`stream-chat`에 observer 설치하기~~
- [x] ~~영문 대소문자 구분 안하도록 해야 함.~~
- [x] ~~`~피곤` 입력 시에 뭔가 의도하지 않은게 나옴 => name이 같아서 생기는 문제. nameHash로 사용해서 해결~~
- [x] ~~링크 또는 이모티콘이 포함된 채팅인 경우 순서가 이상하게 됨. => 현재 코드는 공백으로 나눠서 각 토큰을 `span.text-fragment` 으로 생성하는 식으로 만듬. `span.text-fragment`의 부모를 찾아서 자식을 찾고 `.text-fragment`이후에 아이콘 이미지 요소를 추가하는 방식으로 구현해야 할 듯.~~
- [ ] `Error: QUOTA_BYTES_PER_ITEM quota exceeded` => [stackoverflow](https://stackoverflow.com/questions/33015723/unchecked-runtime-lasterror-while-running-storage-set-quota-bytes-per-item-quot)

## Features
- 봇 명령어 `!` 구현하기 : 목록은 수동 관리 해야할 듯

- `↑`키로 최근에 입력한 메시지 가져오기

- `webpack`사용하기 + `betterttv`에서 유용한 기능 구현하기

- [webextension-polyfill](https://www.npmjs.com/package/webextension-polyfill) 사용해서 크롬, 파이어폭스 한번에 개발하기