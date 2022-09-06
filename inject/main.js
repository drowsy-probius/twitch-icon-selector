const initStages = [
  init_1_constants,
  init_2_variables,
  init_3_functions,
  init_4_storage,
  init_5_observer,
]

const findStages = [
  find_1_url,
  find_2_elements,
  find_3_streamer,
]

const runStages = [
  run_1_functions,
  run_2_createList,
  run_3_modify,
  run_4_observer,
]

/**
 * first - boolean 
 * - init 단계의 observer (title 태그 observer) 실행할 지 결정. 
 * 같은 페이지 내에서 새로고침할 경우 필요 없음.
 * 
 * startStage - int, (0, 1, 2)
 * - 0이면 init단계, 1이면 find 단계, 2이면 run 단계부터 시작
 */
class Runner{
  stop;
  functions;

  constructor(first=false, startStage=0)
  {
    this.stop = false;
    this.functions = [];
    if(!startStage || startStage < 0 || startStage > 2) startStage = 0;
    if(startStage === 0)
    {
      this.functions = [
        ...(first ? initStages : initStages.slice(0, -1)),
        ...findStages,
        ...runStages,
      ]
    }
    else if(startStage === 1)
    {
      lastSearchKeyword = undefined;
      this.functions = [
        ...findStages,
        ...runStages,
      ]
    }
    else if(startStage === 2)
    {
      lastSearchKeyword = undefined;
      this.functions = [
        ...runStages
      ];
    }
    this.run();
  }

  async run()
  {
    for(let i=0; i<this.functions.length; i++)
    {
      if(this.stop) return;
      await (async () => {
        if(fail) {
          logger.info(error);
          return;
        };
        await this.functions[i](); 
      })();
    }
  }
}

////////////////////////////////////////
let runner = new Runner(true);