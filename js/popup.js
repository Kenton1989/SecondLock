import {getUrlOfTab} from "./general.js"

var startBtn = document.getElementById("start");
var digitTxt = document.getElementById("digits");
var goOptions = document.getElementById("go-options");
var currentHostTxt = document.getElementById("current-host");

var sec = 0;
const end = 5;

function incToEnd() {
    if (sec >= end) return;

    ++sec;
    digitTxt.innerText = sec;
    window.setTimeout(incToEnd, 1000);
}

startBtn.onclick = function(e) {
    sec = 0;
    digitTxt.innerText = sec;
    window.setTimeout(incToEnd, 1000);
};

goOptions.onclick = function(e) {
    chrome.runtime.openOptionsPage();
}

chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    console.assert(tabs.length == 1, "There are more than one active tab in the window!");
    console.log(tabs[0]);
    currentHostTxt.innerText = getUrlOfTab(tabs[0]).hostname;
});