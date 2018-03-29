/* global Promise  */

// TO LINT:
// npm install eslint -g
// eslint speed_test_scraper.js

// TO MINIFY/UFLIGY:
// npm install uglify-js -g
// uglifyjs speed_test_scraper.js -c -m -o speed_test_scraper.min.js

// FURTHER READING
// https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver#MutationObserverInit

var ooklaTest = { // eslint-disable-line no-unused-vars
    "config":{
        "firstDownloadStatTimeout": 10000,
        "firstUploadStatTimeout": 60000,
        "testTimeout": 120000,
        "elementHuntTimeoutDefault": 5000,
        "elementHuntPollSpeed": 100,
        "reportUnits": false
    },
    "_runSpeedTest": function(){
        var self = this;
        return new Promise(function(resolve, reject) {
            self._acquireElement(".button__wrapper button.button, .share-assembly button").then(
                function(startButtons){
                    startButtons[0].click();
                    self._output("startHandler","started");
                    self._output("statusHandler","Start button found and clicked");

                    self._acquireElement(".results-speed .result-tile-download .result-value .number").then(function(downloadResultBlocks){
                        self._waitForChild(downloadResultBlocks[0],"span",self.config.firstDownloadStatTimeout).then(
                            function(result){
                                // self._outputSingleStat(result[0].innerText,downloadResultBlocks[0],"download");
                                self._output("statusHandler","Download stat watcher starting!!!");
                                // self._watchContentChanges(result[0], "download", self.config.reportUnits ? downloadResultBlocks[0].parentNode : null);

                                var observerConfig = {
                                    characterData: true,
                                    subtree: true
                                };
                                self.changeObserver = new MutationObserver(function(mutations){
                                    mutations.forEach(function(mutation){
                                        self._outputSingleStat(mutation.target.data,self.config.reportUnits ? downloadResultBlocks[0].parentNode : null,"download");
                                    });
                                });
                                self.changeObserver.observe(result[0], observerConfig);


                                self._output("statusHandler","Download stat watcher started!!!");
                            }
                            ,function(err){
                                self._output("statusHandler","error while waiting for download results span");
                                reject(err);
                            }
                        );
                    },
                    function(error){
                        reject(error); // acquire timed out.
                    });
                    self._acquireElement(".results-speed .result-tile-upload .result-value .number").then(function(uploadResultBlocks){
                        self._waitForChild(uploadResultBlocks[0],"span",self.config.firstUploadStatTimeout).then(
                            function(result){
                                // self._outputSingleStat(result[0].innerText,uploadResultBlocks[0],"upload");
                                self._output("statusHandler","Upload stat watcher started!!!");
                                // self._watchContentChanges(result[0], "upload", self.config.reportUnits ? uploadResultBlocks[0].parentNode : null);

                                var observerConfig = {
                                    characterData: true,
                                    subtree: true
                                };
                                self.changeObserver = new MutationObserver(function(mutations){
                                    mutations.forEach(function(mutation){
                                        self._outputSingleStat(mutation.target.data,self.config.reportUnits ? uploadResultBlocks[0].parentNode : null,"upload");
                                    });
                                });
                                self.changeObserver.observe(result[0], observerConfig);


                                self._output("statusHandler","Upload stat watcher started!!!");
                            }
                            ,
                            function(err){
                                self._output("statusHandler","error while waiting for upload results span");
                                reject(err);
                            }
                        );
                    },
                    function(error){
                        reject(error); // acquire timed out.
                    });
                    self._acquireElement(".results-speed .result-tile").then(function(testAreas){
                        self._output("statusHandler","Watching for upload area highlight (a.k.a. download complete)");
                        // self._watchContentChanges(result[0], "upload", self.config.reportUnits ? uploadResultBlocks[0].parentNode : null);

                        var observerConfig = {
                            attributes: true,
                            attributeFilter: ["class"],
                            attributeOldValue: true
                        };

                        // result-active-test : added = started, removed = complete.

                        self.activationObserver = new MutationObserver(function(mutations){
                            // var hasStarted = false;
                            function determineTest(classList){
                                return classList.contains("result-tile-download") ? "download" : classList.contains("result-tile-upload") ? "upload" : "unknown";
                            }
                            mutations.forEach(function(mutation){
                                var oldClasses = mutation.oldValue.split(" ");
                                if(oldClasses.includes("result-active-test") && !mutation.target.classList.contains("result-active-test")){
                                    self._output("startHandler",determineTest(mutation.target.classList) + "Finished");
                                }
                                else if(!oldClasses.includes("result-active-test") && mutation.target.classList.contains("result-active-test")){
                                    self._output("startHandler",determineTest(mutation.target.classList) + "Started");
                                }
                            });
                        });
                        testAreas.forEach(function(testArea){
                            self.activationObserver.observe(testArea, observerConfig);
                        });


                        self._output("statusHandler","Upload stat watcher started!!!");
                    },
                    function(error){
                        reject(error); // acquire timed out.
                    });
                    self._acquireElement(".results-container").then(function(resultContainers){
                        // console.log("watching",resultContainers,"for the finish");
                        self._waitForFinish(resultContainers[0]).then(
                            function(){
                                self._output("statusHandler","finished speed test!");
                                resolve("finished speed test!");
                            },
                            function(){
                                self._output("statusHandler","speed test failed!");
                                reject("speed test failed (timeout)!");
                            }
                        );
                    },
                    function(error){
                        reject(error); // acquire timed out.
                    });
                    //watch for modals
                    self._acquireElement(".test").then(function(testAreas){
                        self._waitForChild(testAreas[0],".modal__container",false,true).then(
                            function(){
                                self._output("statusHandler","Modal error appeared");
                                reject("Modal error appeared");
                            }
                            // ,function(err){
                            //     //do not resolve, no need to reject.
                            // }
                        );
                    },
                    function(error){
                        reject(error); // acquire timed out.
                    });
                }
                ,
                function(err){
                    self._output("statusHandler","finished speed test!");
                    reject("error finding the start button",err);
                }
            );
        });
    },
    "_outputSingleStat":function(value,parentElement,statName){
        var resultObj = {
            "test": statName,
            "value": parseFloat(value)
        };
        if(this.config.reportUnits){
            // console.warn("parentElement",parentElement);
            var foundUnit = parentElement.querySelectorAll(".unit");
            if(foundUnit.length > 0){
                resultObj.unit = foundUnit[0].innerText;
            }

        }
        this._output("speedHandler",resultObj);
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
                    self._output("statusHandler",selector + "acquired");
                    resolve(huntResult);
                }
                else if(huntLoopsRun > (huntTimeout/huntInterval)){
                    clearInterval(huntLoop);
                    var statusString = "Couldn't find the element \"" + selector + "\" within " + huntTimeout + "ms";
                    self._output("statusHandler",statusString);
                    reject(statusString);
                }
            }
        });
    },
    "_waitForChild": function(element,childSelector,timeout,watchForDescendents) {
        var self = this;

        self.childObservers = self.childObservers || [];
        var newObserverIndex = self.childObservers.length;

        var statusString = "Waiting for " + childSelector + " in (" + element.classList + ") with timeout of " + timeout + (watchForDescendents ? "(Observer index: " + newObserverIndex + ").  Watching descendendents." : ".");
        self._output("statusHandler",statusString);

        return new Promise(function(resolve,reject){
            if (typeof timeout === "undefined") {
                timeout = self.config.elementHuntTimeoutDefault;
            }
            function getChild(){
                var result = element.querySelectorAll(childSelector);
                if(result.length > 0){
                    var successString = "Found \"" + childSelector + "\" within (" + element.classList + ") (oberver index " + newObserverIndex + ")";
                    self._output("statusHandler",successString);
                    return result;
                }
                else return false;
            }

            var foundChild = getChild();
            if(foundChild){
                self._output("statusHandler","Found element " + childSelector + " right away");
                resolve(foundChild);
            }

            var hasAppeared = false;
            var childObserverConfig = {
                subtree: watchForDescendents ? true : false,
                childList: true
            };

            var failureString = "Timed out waiting for \"" + childSelector + "\" to appear within (" + element.classList + ")";
            if(timeout){
                var waitTimeout = setTimeout(function(){
                    if (!hasAppeared) {
                        self._output("statusHandler",failureString);
                        reject(failureString);
                    }
                },timeout);
            }

            self.childObservers.push(new MutationObserver(function(mutations){
                mutations.forEach(function(mutation){
                    if (mutation.type == "childList") {
                        self._output("statusHandler","childList mutation observed, hunting for "+childSelector);
                        var observedChild = getChild();
                        if(observedChild){
                            hasAppeared = true;
                            self.childObservers[newObserverIndex].disconnect(); //it hasn't been added to the list yet, but that's where it WILL be
                            if(timeout) clearTimeout (waitTimeout);
                            // resolve(mutation.addedNodes[0]); // this works too.
                            resolve(observedChild);
                        }
                    }
                });
            }));
            self.childObservers[newObserverIndex].observe(element, childObserverConfig);
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
                    self._output("statusHandler","Timed out waiting for test to run within 2 minutes");
                    reject(element);
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
    "_output": function(handler,messageContent){
        //Handlers:
        // statusHandler - just fire off random status notes.
        if(this.platform=="android"){
            if (window.appInterface) { //android version
                if(messageContent !== null && typeof messageContent === "object"){
                    messageContent = JSON.stringify(messageContent);
                }
                window.appInterface[handler](messageContent);
            }
        }
        else if(this.platform=="ios"){
            window.webkit.messageHandlers[handler].postMessage(messageContent);
        }
        else{
            var outputHandler = (handler === "statusHandler") ? console.debug : console.log; // eslint-disable-line no-console
            outputHandler(handler,messageContent);
        }
    },
    "_disconnectObservers": function(){
        var self = this;
        ["changeObserver","finishObserver"].forEach(function(observer){
            self[observer] && self[observer].disconnect();
        });
        //there may be multiple childObservers, so loop!
        self.childObservers.forEach(function(childObserver){
            childObserver.disconnect();
        });
    },
    "_start": function(){
        var self = this;
        this._runSpeedTest().then(function(){ // can accept a 'result' obj
            self._output("resultHandler","completed");
        },function(){
            self._output("resultHandler","failed"); // can pass an error if needed
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
