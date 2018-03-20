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
    "runSpeedTest": function(){
        var self = this;
        return new Promise(function(resolve, reject) {
            self.acquireElement(".button__wrapper button.button, .share-assembly button").then(
                function(startButtons){
                    startButtons[0].click();
                    self.outputStartEvent();
                    self.acquireElement(".results-speed .result-tile-download .result-value .number").then(function(downloadResultBlocks){
                        self.waitForChild(downloadResultBlocks[0],"span",self.config.startButtonWait).then(
                            function(result){
                                // console.log("download speed found',result);
                                self.watchContentChanges(result[0], "download", self.config.reportUnits ? downloadResultBlocks[0].parentNode : null);
                            }
                            ,function(err){
                                reject("error while watching results!",err);
                            }
                        );
                    });
                    self.acquireElement(".results-speed .result-tile-upload .result-value .number").then(function(uploadResultBlocks){
                        self.waitForChild(uploadResultBlocks[0],"span",self.config.uploadStartWait).then(
                            function(result){
                                // console.log("upload speed found',result);
                                self.watchContentChanges(result[0], "upload", self.config.reportUnits ? uploadResultBlocks[0].parentNode : null);
                            }
                            ,
                            function(err){
                                reject("error while watching results!",err);
                            }
                        );
                    });
                    self.acquireElement(".results-container").then(function(resultContainers){
                        // console.log("watching",resultContainers,"for the finish");
                        self.waitForFinish(resultContainers[0]).then(
                            function(){
                                resolve("finished speed test!");
                            },
                            function(){
                                reject("speed test failed!");
                            }
                        );
                    });
                    //watch for modals
                    self.acquireElement(".test").then(function(testAreas){
                        self.waitForChild(testAreas[0],".modal__container",self.config.testTimeout).then(
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
    "acquireElement": function(selector){
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
    "waitForChild": function(element,childSelector,timeout) {
        // console.warn("waiting for",childSelector,"in",element);
        var self = this;
        return new Promise(function(resolve,reject){
            timeout = timeout || self.config.elementHuntTimeoutDefault;
            // console.warn("going to watch',element,'for a',childSelector);

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
            var childObserver = new MutationObserver(function(mutations){
                mutations.forEach(function(mutation){
                    // console.info("childList mutation");
                    if (mutation.type == "childList") {
                        if(getChild()){
                            hasAppeared = true;
                            childObserver.disconnect();
                            // resolve(mutation.addedNodes[0]); // this works too.
                            resolve(getChild());
                        }
                    }
                });
            });
            window.setTimeout(function(){
                if (!hasAppeared) {
                    reject("timed out waiting for \"" + childSelector + "\" to appear within " + element);
                }
            },timeout);
            childObserver.observe(element, childObserverConfig);
        });
    },
    "waitForFinish": function(element){
        var self = this;
        return new Promise(function(resolve,reject){
            var timeout = self.config.testTimeout;
            var hasEnded = false;
            var finishObserverConfig = {
                attributes: true,
                attributeFilter: ["class"]
            };
            var finishObserver = new MutationObserver(function(mutations){
                // console.warn("watching for attr mutations");
                mutations.forEach(function(mutation){
                    if(mutation.target.classList && mutation.target.classList.contains("results-container-stage-finished")){
                        hasEnded = true;
                        finishObserver.disconnect();
                        resolve();
                    }
                });
            });
            window.setTimeout(function(){
                if (!hasEnded) {
                    reject("timeed out waiting for test to run within 2 minutes",element);
                }
            },timeout);
            finishObserver.observe(element, finishObserverConfig);
        });
    },
    "outputChangeObj": function(resultObj){
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
    "outputResult": function(resultString){
        if(this.platform=="andriod"){
        // TODO spit this out to Android
        }
        else if(this.platform=="ios"){
            window.webkit.messageHandlers.resultHandler.postMessage(resultString);
        }
        else{
            console.log(resultString);
        }
    },
    "outputStartEvent": function(){
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
    "watchContentChanges": function(element,descriptor,parentElement){
        // console.warn("watching for',descriptor,'speeds','in',element);
        var self = this;
        var observerConfig = {
            characterData: true,
            subtree: true
        };
        var observer = new MutationObserver(function(mutations){
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
                self.outputChangeObj(resultObj);
            });
        });
        observer.observe(element, observerConfig);
    },
    "start": function(){
        var self = this;
        this.runSpeedTest().then(function(){ // can accept a 'result' obj
            self.outputResult("succeeded");
        },function(){
            self.outputResult("failed"); // can pass an error if needed
        });
    },
    "init": function(platform){
        if(platform) this.platform = platform;
        if(this.platform == "ios"){ // iOs runs after page is ready, so it can run on ahead.
            this.start();
        }
        else {
            var goodReadyStates = ["complete","loaded","interactive"];
            if (document.readyState && goodReadyStates.indexOf(document.readyState) > -1) {
                // document is already ready to go
                this.start();
            }
            else document.addEventListener("DOMContentLoaded", function() {
                this.start();
            });
        }
    }
};

// ooklaTest.init();
// ooklaTest.init('ios');
// ooklaTest.init('android');
