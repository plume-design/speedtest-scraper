var timeoutSeconds = 60;
var pollInterval = 500;

var runSpeedTest = new Promise(function(resolve, reject) {
	var startButtons = document.querySelectorAll('#skst-enh-init-test-btn');
	if(startButtons.length > 0){
		startButtons[0].click();
	}
	else{
		reject('no start button found');
	}
	var checkInterval = setInterval(function(){ checkForResult() }, pollInterval);
	var loopsRun = 0;
	function checkForResult(){
		loopsRun += 1;
		if(document.querySelectorAll('.skst-enh-result-number').length > 0){
			clearInterval(checkInterval);
			setTimeout(function(){ //wait for page to fully render
				resolve(fetchResult());
			}, pollInterval);
		}
		else if(loopsRun > (timeoutSeconds*1000/pollInterval)){
			reject('timeout');
		}
		else outputCurrentStatus();
	}

});

function fetchResult(){
	var wholeNumberElements = document.querySelectorAll('.skst-enh-result-number');
	var wholeNumbers = [];
	Array.prototype.forEach.call(wholeNumberElements, function(el, i){
		wholeNumbers.push(el.innerText);
	});

	var decimalElements = document.querySelectorAll('.skst-enh-table-decimal');
	var decimals = [];
	Array.prototype.forEach.call(decimalElements, function(el, i){
		decimals.push(el.innerText);
	});

	var unitElements = document.querySelectorAll('.skst-enh-table-measurement');
	var units = [];
	Array.prototype.forEach.call(unitElements, function(el, i){
		units.push(el.innerText);
	});

	var latency = document.querySelectorAll('.skst-enh-sm-nu')[0].innerText;

	var speedTestResults = {
		"download": wholeNumbers[0]+decimals[0]+units[0],
		"upload": wholeNumbers[1]+decimals[1]+units[1],
		"latency": latency
	}

	return speedTestResults;
}

function outputCurrentStatus(){
	var statusString = ''
	statusString += document.querySelectorAll('.skst-enh-livereadout-container__test')[0].innerText;
	statusString += ':';
	statusString += document.querySelectorAll('.skst-enh-livereadout-container__number')[0].innerText;
	statusString += document.querySelectorAll('.skst-enh-livereadout-container__number-decimals')[0].innerText;
	statusString += document.querySelectorAll('.skst-enh-livereadout-container__number-unit')[0].innerText;
	if(statusString !== ':') console.log(statusString);
}

//run the damned thing!
document.addEventListener("DOMContentLoaded", function() {
	runSpeedTest.then(function(result){
		console.log(result);
	},function(error){
		console.error(error);
	});
});
