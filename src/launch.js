/** */
ready(function() {
    console.log('DOM is ready, call initWidget');
    if(!window.GPTMysiteAsyncInit){
      initAysncEvents();
    }
    initWidget();
});

/** */
function ready(callbackFunction){
    // if(document.readyState != 'loading'){
    //   console.log('in ifffffff', document.readyState)
    //   callbackFunction()
    // }
    // else{
    //   document.addEventListener("DOMContentLoaded", callbackFunction)
    // }
    document.addEventListener('scroll', start);
    document.addEventListener('mousedown', start);
    document.addEventListener('mousemove', start);
    document.addEventListener('touchstart', start);
    document.addEventListener('keydown', start);

    function start(){
      if(document.readyState==='complete'){
        callbackFunction()
      }else if(window.attachEvent){
        window.attachEvent('onload',callbackFunction);
      }else{
        window.addEventListener('load',callbackFunction,false);
      }

      document.removeEventListener('scroll', start);
      document.removeEventListener('mousedown', start);
      document.removeEventListener('mousemove', start);
      document.removeEventListener('touchstart', start);
      document.removeEventListener('keydown', start);
    }


}


/** */
function loadIframe(GPTMysiteScriptBaseLocation) {
    var dev = window.location.hostname.includes('localhost')? true: false;

    var containerDiv = document.createElement('div');
    containerDiv.setAttribute('id','GPTMysite-container');
    containerDiv.classList.add("closed");
    document.body.appendChild(containerDiv);

    var iDiv = document.createElement('div');
    iDiv.setAttribute('id','GPTMysitediv');
    containerDiv.appendChild(iDiv);

    var ifrm = document.createElement("iframe");
    ifrm.setAttribute("frameborder", "0");
    ifrm.setAttribute("border", "0");
    ifrm.setAttribute("title", "GPTMysite Widget")

    var srcGPTMysite = '<html lang="en">';
    srcGPTMysite += '<head>';
    srcGPTMysite += '<meta charset="utf-8">';
    srcGPTMysite += '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0" />';
    srcGPTMysite += '<title>Tilechat Widget</title>';
    srcGPTMysite += '<base href="'+GPTMysiteScriptBaseLocation+ '/">';
    srcGPTMysite += '<link rel="icon" type="image/x-icon" href="favicon.ico">';
    srcGPTMysite += '<link rel="stylesheet" type="text/css" href="' + GPTMysiteScriptBaseLocation +'/assets/styles/GPTMysite_v1.scss" media="all">';
    srcGPTMysite += '</head>';
    srcGPTMysite += '<body>';
    srcGPTMysite += '<chat-root></chat-root>';
    srcGPTMysite += '<script async type="text/javascript" src="'+GPTMysiteScriptBaseLocation+'/runtime.js"></script>';
    srcGPTMysite += '<script async type="text/javascript" src="'+GPTMysiteScriptBaseLocation+'/polyfills.js"></script>';
    srcGPTMysite += '<script async type="text/javascript" src="'+GPTMysiteScriptBaseLocation+'/vendor.js"></script>';
    srcGPTMysite += '<script async type="text/javascript" src="'+GPTMysiteScriptBaseLocation+'/main.js"></script>';
    srcGPTMysite += '<link type="text/css" rel="stylesheet" href="'+GPTMysiteScriptBaseLocation+'/styles.css" media="all"></link>';
    srcGPTMysite += '</body>';
    srcGPTMysite += '</html>';

    ifrm.setAttribute('id','GPTMysiteiframe');
    ifrm.setAttribute('GPTMysite_context','parent');

    /** */
    window.GPTMysite.on('onInit', function(event_data) {
        // console.log("launch onInit isopen", GPTMysiteScriptBaseLocation, window.GPTMysite.angularcomponent.component.g.isOpen);
        if (window.GPTMysite.angularcomponent.component.g.isOpen) {
            containerDiv.classList.add("open");
            containerDiv.classList.remove("closed");
            iDiv.classList.remove("callout");
        } else {
            containerDiv.classList.add("closed");
            containerDiv.classList.remove("open");
            iDiv.classList.remove("messagePreview");
        }
    });
    /** */
    window.GPTMysite.on('onOpen', function(event_data) {
        containerDiv.classList.add("open");
        containerDiv.classList.remove("closed");
        iDiv.classList.remove("callout");
        iDiv.classList.remove("messagePreview");
    });
    /** */
    window.GPTMysite.on('onClose', function(event_data) {
        containerDiv.classList.add("closed");
        containerDiv.classList.remove("open");
    });

    /** */
    window.GPTMysite.on('onOpenEyeCatcher', function(event_data) {
        iDiv.classList.add("callout");
    });
    /** */
    window.GPTMysite.on('onClosedEyeCatcher', function(event_data) {
        iDiv.classList.remove("callout");
    });

    /** */
    window.GPTMysite.on('onConversationUpdated', function(event_data) {
        const messagePreview = window.GPTMysite.angularcomponent.component.g.isOpenNewMessage
        const isOpen = window.GPTMysite.angularcomponent.component.g.isOpen
        try {
            if (!isOpen && messagePreview) {
                iDiv.classList.add("messagePreview");
                iDiv.classList.remove("callout");
                // ----------------------------//
            }
        } catch(er) {
            console.error("onConversationUpdated > error: " + er);
        }
    });

    window.GPTMysite.on('onCloseMessagePreview', function(event_data) {
        try {
            iDiv.classList.remove("messagePreview");
        } catch(er) {
            console.error("onCloseMessagePreview > error: " + er);
        }
    });


    /**** BEGIN EVENST ****/
    /** */
    window.GPTMysite.on('onNewConversation', function(event_data) {
        // console.log("test-custom-auth.html onNewConversation >>>",event_data);
        const GPTMysiteToken = window.GPTMysite.angularcomponent.component.g.GPTMysiteToken;
        // console.log(">>>> GPTMysiteToken >>>> ",event_data.detail.appConfigs.apiUrl+event_data.detail.default_settings.projectid);
        if(GPTMysiteToken) {
          var httpRequest = createCORSRequest('POST', event_data.detail.appConfigs.apiUrl+event_data.detail.default_settings.projectid+'/events',true); //set async to false because loadParams must return when the get is complete
          httpRequest.setRequestHeader('Content-type', 'application/json');
          httpRequest.setRequestHeader('Authorization',GPTMysiteToken);
          httpRequest.send(JSON.stringify({ "name":"new_conversation",
                                            "attributes": {
                                              "request_id":event_data.detail.newConvId,
                                              "department": event_data.detail.global.departmentSelected.id,
                                              "participants": event_data.detail.global.participants,
                                              "language": event_data.detail.global.lang,
                                              "subtype":"info",
                                              "fullname":event_data.detail.global.attributes.userFullname,
                                              "email":event_data.detail.global.attributes.userEmail,
                                              "attributes":event_data.detail.global.attributes
                                            }
                                          }
          ));
        }
    });

    /** @deprecated event */
    window.GPTMysite.on('onLoggedIn', function(event_data) {
        // console.log("test-custom-auth.html onLoggedIn",event_data);
        const GPTMysiteToken = window.GPTMysite.angularcomponent.component.g.GPTMysiteToken;
        // console.log("------------------->>>> GPTMysiteToken: ",window.GPTMysite.angularcomponent.component.g);
        if(GPTMysiteToken) {
            var httpRequest = createCORSRequest('POST', event_data.detail.appConfigs.apiUrl+event_data.detail.default_settings.projectid+'/events',true); //set async to false because loadParams must return when the get is complete
            httpRequest.setRequestHeader('Content-type','application/json');
            httpRequest.setRequestHeader('Authorization',GPTMysiteToken);
            httpRequest.send(JSON.stringify({"name":"logged_in","attributes": {"fullname":event_data.detail.global.attributes.userFullname, "email":event_data.detail.global.attributes.userEmail, "language": event_data.detail.global.lang, "attributes":event_data.detail.global.attributes}}));
        }
    });

    /** */
    window.GPTMysite.on('onAuthStateChanged', function(event_data) {
        // console.log("test-custom-auth.html onAuthStateChanged",event_data);
        const GPTMysiteToken = window.GPTMysite.angularcomponent.component.g.GPTMysiteToken;
        // console.log("------------------->>>> GPTMysiteToken: ",window.GPTMysite.angularcomponent.component.g);
        if(GPTMysiteToken) {
            var httpRequest = createCORSRequest('POST', event_data.detail.appConfigs.apiUrl+event_data.detail.default_settings.projectid+'/events',true); //set async to false because loadParams must return when the get is complete
            httpRequest.setRequestHeader('Content-type','application/json');
            httpRequest.setRequestHeader('Authorization',GPTMysiteToken);
            httpRequest.send(JSON.stringify({"name":"auth_state_changed","attributes": {"user_id":event_data.detail.global.senderId, "isLogged":event_data.detail.global.isLogged, "event":event_data.detail.event, "subtype":"info", "fullname":event_data.detail.global.attributes.userFullname, "email":event_data.detail.global.attributes.userEmail, "language":event_data.detail.global.lang, "attributes":event_data.detail.global.attributes}}));
            httpRequest.onload = function(event) {
              if(event.target && event.target.status === 401){
                window.GPTMysite.hide()
                window.GPTMysite.dispose()
              }
            }
          }
    });
    /**** END EVENST ****/

    iDiv.appendChild(ifrm);

    if(GPTMysiteScriptBaseLocation.includes('localhost')){
      ifrm.contentWindow.document.open();
      ifrm.contentWindow.document.write(srcGPTMysite);
      ifrm.contentWindow.document.close();
    }else {
      ifrm.srcdoc = srcGPTMysite
    }


}


function initAysncEvents() {
  console.log('INIT ASYNC EVENTS')

  window.GPTMysiteAsyncInit = function() {
    // console.log('launch GPTMysiteAsyncInit:::', window.GPTMysite.q)
    window.GPTMysite.on('onLoadParams', function(event_data) {
      if (window.GPTMysite && window.GPTMysite.q && window.GPTMysite.q.length>0) {
        window.GPTMysite.q.forEach(f => {
          if (f.length>=1) {
            var functionName = f[0];
            if (functionName==="onLoadParams") {
              //CALLING ONLY FUNCTION 'onLoadParams'
              if (f.length==2) {
                var functionCallback = f[1];
                if(typeof functionCallback === "function") {
                  window.GPTMysite.on(functionName, functionCallback);
                  functionCallback(event_data);
                } else {
                  console.error("initAysncEvents --> functionCallback is not a function.");
                }
              }
            }else if(functionName=='setParameter'){
              //CALLING ONLY METHOD 'setParameter' AND CHECK IF IT HAS OBJECT ARG
              if (f.length==2) {
                var functionArgs = f[1];
                if(typeof functionArgs === "object") {
                  window.GPTMysite[functionName](functionArgs);
                } else {
                  console.error("initAysncEvents --> functionArgs is not a object.");
                }
              }
            }
          }
        });
      }
    });

    window.GPTMysite.on('onBeforeInit', function(event_data) {
      if (window.GPTMysite && window.GPTMysite.q && window.GPTMysite.q.length>0) {
        // console.log("w.q", window.GPTMysite.q);
        window.GPTMysite.q.forEach(f => {
          if (f.length>=1) {
            var functionName = f[0];
            if (functionName==="onLoadParams" || functionName==="setParameter") {
              //SKIP FUNCTION WITH NAMES 'onLoadParams' AND METHOD 'setParameter'
            } else if (functionName.startsWith("on")) {
              // CALLING METHOD THAT STARTS WITH 'on'
              if (f.length==2) {
                var functionCallback = f[1];
                if(typeof functionCallback === "function"){
                  window.GPTMysite.on(functionName, functionCallback); //potrei usare window.GPTMysite ?!?
                  if (functionName==="onBeforeInit") {
                      functionCallback(event_data)
                  }
                } else {
                  console.error("functionCallback is not a function.");
                }
              }
            } else {
              //CALLING REMAININGS METHOD and CHECK IF CONTAINS ARG TO PASS THROUGH THE METHOD
              if (f.length==2) {
                let args = f[1]
                window.GPTMysite[functionName](args);
              } else {
                window.GPTMysite[functionName]();
              }
            }

          }
        });

      }

      // RICHIAMATO DOPO L'INIT DEL WIDGET
      window.GPTMysite = function() {
        if (arguments.length>=1) {
          var functionName = arguments[0];
          if (arguments.length==2) {
              var functionCallback = arguments[1];
          }
          var methodOrProperty = window.GPTMysite[functionName];
          if(typeof methodOrProperty==="function"){
            return window.GPTMysite[functionName](functionCallback);
          }else { //property
            return window.GPTMysite[functionName];
          }
        }
      };

    });
  }
}


/**
 *
 */
function initWidget() {
    var GPTMysiteroot = document.createElement('chat-root');
    var GPTMysiteScriptLocation = document.getElementById("GPTMysite-jssdk").src;
    //var currentScript = document.currentScript;
    //var GPTMysiteScriptLocation = '';
    //setInterval(function(){
        //GPTMysiteScriptLocation = currentScript.src;
        var GPTMysiteScriptBaseLocation = GPTMysiteScriptLocation.replace("/launch.js","");
        window.GPTMysite = new function() {
            //this.type = "macintosh";
            this.GPTMysiteroot = GPTMysiteroot;
            this.on = function (event_name, handler) {
                GPTMysiteroot.addEventListener(event_name, handler);
            };
            this.getBaseLocation = function() {
                return GPTMysiteScriptBaseLocation;
            }
        }

        try {
            window.GPTMysiteAsyncInit();
        }catch(er) {
            if (typeof window.GPTMysiteAsyncInit == "undefined") {
                console.log("GPTMysiteAsyncInit() doesn't exists");
            } else {
                console.log(er);
            }
        }
        document.body.appendChild(GPTMysiteroot);
        initCSSWidget(GPTMysiteScriptBaseLocation);
        loadIframe(GPTMysiteScriptBaseLocation);
    //},2000);
}





function initCSSWidget(GPTMysiteScriptBaseLocation) {
    var cssId = 'iframeCss';  // you could encode the css path itself to generate id..
    // if (!document.getElementById(cssId))
    // {
        var head  = document.getElementsByTagName('head')[0];
        var link  = document.createElement('link');
        link.id   = cssId;
        link.rel  = 'stylesheet';
        link.type = 'text/css';
        link.href = GPTMysiteScriptBaseLocation+'/iframe-style.css';
        link.media = 'print';
        link.onload = function(){
          link.media = 'all'
        }
        head.appendChild(link);
    // }
}


//DEPRECATED
function signInWithCustomToken() {
    let json = JSON.stringify({
        "id_project": "5b55e806c93dde00143163dd"
    });
	var httpRequest = createCORSRequest('POST', 'https://GPTMysite-server-pre.herokuapp.com/auth/signinAnonymously',true);
    if (!httpRequest) {
        throw new Error('CORS not supported');
    }
    httpRequest.setRequestHeader('Content-type','application/json');
	  httpRequest.send(json);
    httpRequest.onload = function() {
      if (httpRequest.readyState === XMLHttpRequest.DONE) {
        if (httpRequest.status === 200) {
                    try {
                        var response = JSON.parse(httpRequest.responseText);
                        window.GPTMysite.signInWithCustomToken(response);
                    }
                    catch(err) {
                        console.error(err.message);
                    }
                    return true;
        } else {
            alert('There was a problem with the request.');
        }
      }
   	};
	httpRequest.onerror = function() {
		console.error('There was an error!');
        return false;
	};
}


function createCORSRequest(method, url, async) {
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr) {
		xhr.open(method, url, async);
	} else if (typeof XDomainRequest != "undefined") {
		xhr = new XDomainRequest();
		xhr.open(method, url);
	} else {
		xhr = null;
	}
	return xhr;
}
