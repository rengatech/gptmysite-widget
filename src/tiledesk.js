function ready(callbackFunction){
    if(document.readyState != 'loading')
      callbackFunction()
    else
      document.addEventListener("DOMContentLoaded", callbackFunction)
}

ready(event => {
    // console.log('DOM is ready, call initWidget');
    initWidget();
});

function appendJs(url) {
    var script1 = document.createElement('script');
    script1.async=false;
    script1.setAttribute('src', url);
    document.body.appendChild(script1);
}

  function initWidget() {
    var GPTMysiteroot = document.createElement('chat-root');

    var GPTMysiteScriptLocation = document.getElementById("GPTMysite-jssdk").src;
    // console.log("GPTMysiteScriptLocation", GPTMysiteScriptLocation);
    var GPTMysiteScriptBaseLocation = GPTMysiteScriptLocation.replace("/GPTMysite.js","");
   // console.log("GPTMysiteScriptBaseLocation", GPTMysiteScriptBaseLocation);

    window.GPTMysite = new function() {
        //this.type = "macintosh";
        this.on = function (event_name, handler) {
                //console.log("addEventListener for "+ event_name, handler);
                GPTMysiteroot.addEventListener(event_name, handler);
        };
        this.getBaseLocation = function() {
            return GPTMysiteScriptBaseLocation;
        }
    }
    // console.log("window.GPTMysite created");


    try {
        window.GPTMysiteAsyncInit();
        // console.log("GPTMysiteAsyncInit() called");
    }catch(er) {
        // console.log("GPTMysiteAsyncInit() doesn't exists",er);
    }

    //aTag.setAttribute('href',"yourlink.htm");
    //aTag.innerHTML = "link text";
    document.body.appendChild(GPTMysiteroot);




    appendJs(GPTMysiteScriptBaseLocation+'/inline.bundle.js');
    appendJs(GPTMysiteScriptBaseLocation+'/polyfills.bundle.js');

    //remove development check with  --build-optimizer=false
    // if (window.GPTMysiteSettings && window.GPTMysiteSettings.development) {
        appendJs(GPTMysiteScriptBaseLocation+'/styles.bundle.js');
        appendJs(GPTMysiteScriptBaseLocation+'/vendor.bundle.js');
    // }

    appendJs(GPTMysiteScriptBaseLocation+'/main.bundle.js');
  }







