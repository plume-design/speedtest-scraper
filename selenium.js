//https://github.com/SeleniumHQ/selenium/tree/master/javascript/node/selenium-webdriver
const {Builder, By, Key, until, logging} = require('selenium-webdriver');

const fs = require('fs');

(async function example() {
  let theScript = fs.readFileSync('speed_test_scraper.js', 'utf8');

  let caps = {
    "browserName": 'chrome', // chrome, firefox
    "loggingPrefs": {
      'driver': 'DEBUG',
      'browser': 'INFO'
    }
  };


  // let driver = await new Builder().forBrowser('chrome').withCapabilities(caps).build();
  let driver = await new Builder()
    .usingServer()
    .withCapabilities(caps).build();
  try {
    await driver.get('http://plumewifi.speedtestcustom.com/').then(()=> {
      // console.log('[%s] %s', entry.level.name, entry.message);
      console.log('page loaded');
    });
    driver.executeScript(theScript + "ooklaTest.init('selenium');").then(() => {
      console.log('script loaded');
    },() =>{
      console.log('failure!!!!!!!!!!!!!!!!!');
    });

    let testOver = false;



    let logs = function(){
      driver.manage().logs().get(logging.Type.BROWSER)
      .then((logs) => {
        // console.log('logs?');
          logs.forEach(log => {
            if (log.message.includes("completed") || log.message.includes("failed")){
              console.log("RESULT: " + log.message + " " + log.timestamp);
              testOver = true;
            }
            // console.log(log.message + " " + log.timestamp);
          })
      })
    }

    // await driver.wait(until(function(){return testOver}), 121000).then((logstring) => {console.log("test ended")});
    driver.sleep(121000);

  } catch(err) {
    console.log("!!!!" + err);
  } finally {
    // await driver.quit();
  }
})();
