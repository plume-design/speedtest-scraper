/* global Promise */

// FURTHER READING
// https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver#MutationObserverInit

var ooklaTest = {
    "config":{
        "startButtonWait": 5000,
        "uploadStartWait": 60000,
        "testTimeout": 120000,
        "elementHuntTimeoutDefault": 1000,
        "elementHuntPollSpeed": 25,
        "reportUnits": false
    },
    "_runSpeedTest": function(){
        var self = this;
        return new Promise(function(resolve, reject) {
            self._acquireElement(".button__wrapper button.button, .share-assembly button").then(
                function(startButtons){
                    startButtons[0].click();
                    self._outputStartEvent();
                    self._acquireElement(".results-speed .result-tile-download .result-value .number").then(function(downloadResultBlocks){
                        self._waitForChild(downloadResultBlocks[0],"span",self.config.startButtonWait).then(
                            function(result){
                                // console.log("download speed found',result);
                                self._watchContentChanges(result[0], "download", self.config.reportUnits ? downloadResultBlocks[0].parentNode : null);
                            }
                            ,function(err){
                                reject("error while watching results!",err);
                            }
                        );
                    });
                    self._acquireElement(".results-speed .result-tile-upload .result-value .number").then(function(uploadResultBlocks){
                        self._waitForChild(uploadResultBlocks[0],"span",self.config.uploadStartWait).then(
                            function(result){
                                // console.log("upload speed found',result);
                                self._watchContentChanges(result[0], "upload", self.config.reportUnits ? uploadResultBlocks[0].parentNode : null);
                            }
                            ,
                            function(err){
                                reject("error while watching results!",err);
                            }
                        );
                    });
                    self._acquireElement(".results-container").then(function(resultContainers){
                        // console.log("watching",resultContainers,"for the finish");
                        self._waitForFinish(resultContainers[0]).then(
                            function(){
                                resolve("finished speed test!");
                            },
                            function(){
                                reject("speed test failed!");
                            }
                        );
                    });
                    //watch for modals
                    self._acquireElement(".test").then(function(testAreas){
                        self._waitForChild(testAreas[0],".modal__container",false).then(
                            function(){
                                reject("Modal error appeared");
                            }
                            // ,function(err){
                            //     //do not resolve, no need to reject.
                            // }
                        );
                    });
                }
                ,
                function(err){
                    reject("error finding the start button",err);
                }
            );
        });
    },
    "_acquireElement": function(selector){
        var self = this;
        return new Promise(function(resolve, reject) {
            var huntInterval = self.config.elementHuntPollSpeed;
            var huntTimeout = self.config.elementHuntTimeoutDefault;
            //look for the thing, for a little while...
            var huntLoop = setInterval(function(){
                huntForSelector();
            }, huntInterval);
            var huntLoopsRun = 0;

            function huntForSelector(){
                huntLoopsRun += 1;
                var huntResult = document.querySelectorAll(selector);
                if(huntResult.length > 0){
                    clearInterval(huntLoop);
                    resolve(huntResult);
                }
                else if(huntLoopsRun > (huntTimeout/huntInterval)){
                    clearInterval(huntLoop);
                    reject("Couldn't find the element \"" + selector + "\" within " + huntTimeout + "ms");
                }
            }
        });
    },
    "_waitForChild": function(element,childSelector,timeout) {
        // console.warn("waiting for",childSelector,"in",element);
        var self = this;
        return new Promise(function(resolve,reject){
            if (typeof timeout === "undefined") {
                timeout = self.config.elementHuntTimeoutDefault;
            }
            function getChild(){
                var result = element.querySelectorAll(childSelector);
                if(result.length > 0){
                    return result;
                }
                else return false;
            }

            if(getChild()){
                resolve(getChild());
            }

            var hasAppeared = false;
            var childObserverConfig = {childList: true};
            if(timeout){
                var waitTimeout = setTimeout(function(){
                    if (!hasAppeared) {
                        reject("timed out waiting for \"" + childSelector + "\" to appear within " + element);
                    }
                },timeout);
            }
            self.childObserver = new MutationObserver(function(mutations){
                mutations.forEach(function(mutation){
                    // console.info("childList mutation");
                    if (mutation.type == "childList") {
                        if(getChild()){
                            hasAppeared = true;
                            self.childObserver.disconnect();
                            if(timeout) clearTimeout (waitTimeout);
                            // resolve(mutation.addedNodes[0]); // this works too.
                            resolve(getChild());
                        }
                    }
                });
            });
            self.childObserver.observe(element, childObserverConfig);
        });
    },
    "_waitForFinish": function(element){
        var self = this;
        return new Promise(function(resolve,reject){
            var timeout = self.config.testTimeout;
            var hasEnded = false;
            var finishObserverConfig = {
                attributes: true,
                attributeFilter: ["class"]
            };
            var testTimeout = setTimeout(function(){
                if (!hasEnded) {
                    reject("timeed out waiting for test to run within 2 minutes",element);
                }
            },timeout);
            self.finishObserver = new MutationObserver(function(mutations){
                // console.warn("watching for attr mutations");
                mutations.forEach(function(mutation){
                    if(mutation.target.classList && mutation.target.classList.contains("results-container-stage-finished")){
                        hasEnded = true;
                        self.finishObserver.disconnect();
                        clearTimeout(testTimeout);
                        resolve();
                    }
                });
            });

            self.finishObserver.observe(element, finishObserverConfig);
        });
    },
    "_outputChangeObj": function(resultObj){
        if(this.platform=="andriod"){
        // TODO spit this out to Android
        }
        else if(this.platform=="ios"){
            // console.warn("ios!!!");
            window.webkit.messageHandlers.speedHandler.postMessage(resultObj);
        }
        else{
            console.log(resultObj);
        }
    },
    "_outputResult": function(resultString){
        if(this.platform=="andriod"){
        // TODO spit this out to Android
        }
        else if(this.platform=="ios"){
            window.webkit.messageHandlers.resultHandler.postMessage(resultString);
        }
        else{
            console.log(resultString);
        }
        this._disconnectObservers();
    },
    "_outputStartEvent": function(){
        var startString = "started";
        if(this.platform=="andriod"){
        // TODO spit this out to Android
        }
        else if(this.platform=="ios"){
            window.webkit.messageHandlers.startHandler.postMessage(startString);
        }
        else{
            console.log(startString);
        }
    },
    "_watchContentChanges": function(element,descriptor,parentElement){
        // console.warn("watching for',descriptor,'speeds','in',element);
        var self = this;
        var observerConfig = {
            characterData: true,
            subtree: true
        };
        self.changeObserver = new MutationObserver(function(mutations){
            mutations.forEach(function(mutation){
                var resultObj = {
                    "test": descriptor,
                    "value": parseFloat(mutation.target.data)
                };
                if(self.config.reportUnits){
                    // console.warn("parentElement",parentElement);
                    var foundUnit = parentElement.querySelectorAll(".unit")[0];
                    resultObj.unit = foundUnit ? foundUnit.innerText : "unknown";
                }
                self._outputChangeObj(resultObj);
            });
        });
        self.changeObserver.observe(element, observerConfig);
    },
    "_disconnectObservers": function(){
        var self = this;
        ["changeObserver","finishObserver","childObserver"].forEach(function(observer){
            self[observer] && self[observer].disconnect();
        });
    },
    "_start": function(){
        var self = this;
        this._runSpeedTest().then(function(){ // can accept a 'result' obj
            self._outputResult("completed");
        },function(){
            self._outputResult("failed"); // can pass an error if needed
        });
    },
    "init": function(platform){
        if(platform) this.platform = platform;
        if(this.platform == "ios"){ // iOs runs after page is ready, so it can run on ahead.
            this._start();
        }
        else {
            var goodReadyStates = ["complete","loaded","interactive"];
            if (document.readyState && goodReadyStates.indexOf(document.readyState) > -1) {
                // document is already ready to go
                this._start();
            }
            else document.addEventListener("DOMContentLoaded", function() {
                this._start();
            });
        }
    }
};

// ooklaTest.init();
// ooklaTest.init('ios');
// ooklaTest.init('android');
