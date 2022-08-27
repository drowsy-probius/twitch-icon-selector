class Runner{
  stop;
  functions;

  constructor(first=false)
  {
    this.stop = false;
    this.functions = [
      init_1_constants,
      init_2_variables,
      init_3_functions,
      init_4_storage,
      first ? init_5_observer : ()=>{},

      find_1_url,
      find_2_elements,
      find_3_streamer,

      run_1_functions,
      run_2_createList,
      run_3_modify,
      run_4_observer,
    ];
    this.run();
  }

  async run()
  {
    for(let i=0; i<this.functions.length; i++)
    {
      if(this.stop) return;
      await this.functions[i]();
    }

    const chatType = isVod ? "vod" :
                      isPopout ? "popout" :
                      isClip ? "clip" : "live";
    logger.log(`Loaded! ${watchingStreamer} in ${chatType}`);
  }
}

////////////////////////////////////////
let runner = new Runner(true);