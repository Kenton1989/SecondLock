/**
 * This is the js for popup.html
 */
import { RemoteCallable } from "./remote-callable.js";
import { generalTranslate } from "./translation.js";
import { closeTabs, getUrlOfTab, queryTabsUnder } from "./utility.js";

generalTranslate();

let currentTab = undefined;
let currentPageUrl = "";
let monitoredHost = undefined;
let unlockEndTime = undefined;
let remainTimeDiv = undefined;

const SECOND = 1000;
const MINUTE = 60000;
const HOUR = 3600000;

remainTimeDiv = document.getElementById("remain-time");

function updateRemainTimeDisplay(remainTimeInMs) {
  // format the rest time to HH:MM:SS format
  let timeStr = new Date(remainTimeInMs).toISOString().substr(11, 8);
  remainTimeDiv.innerText = timeStr;
}

function setupRemainTimeDisplay() {
  let mSec = unlockEndTime - Date.now();
  updateRemainTimeDisplay(mSec);

  let offset = (mSec % 1000) - 100;
  if (offset < 50) offset += 1000;
  
  window.setTimeout(function () {
    window.setInterval(function () {
      updateRemainTimeDisplay(unlockEndTime - Date.now());
    }, 1000);
  }, offset);
}

// open the option page with special method.
// Using hyperlink directly will open the page in the popup window
let goOptions = document.getElementById("go-options");
goOptions.onclick = function (e) {
  chrome.runtime.openOptionsPage();
};

// TODO - add quick adding blacklist support
function quickAddBlacklist() {
  let urlObj = new URL(currentPageUrl);
}

/**
 * Setup the time countdown
 */
function setupCountdownDiv(state) {
  // state = {
  //   isMonitored: ???,
  //   monitoredHost: ???,
  //   isUnlocked: ???,
  //   unlockEndTime: ???,
  //   needCalmDown: ???,
  //   calmDownEndTime: ???,
  // };
  if (state.isMonitored) {
    monitoredHost = state.monitoredHost;
    if (!state.isUnlocked) {
      remainTimeDiv.innerText = "ERROR!";
      console.error("Accessing monitored page without unlocking.");
      return;
    }
    unlockEndTime = state.unlockEndTime;
    setupRemainTimeDisplay();

    let stopBtn = document.getElementById("stop-timer-btn");
    stopBtn.style.display = "inline-block";
    stopBtn.onclick = function () {
      // close all monitored tabs and end the timer
      RemoteCallable.call("background-aux", "stopTimingAndClose", [
        monitoredHost,
      ]);
    };
  } else {
    // TODO - add quick adding blacklist support
    // let urlObj = new URL(currentPageUrl);
    // if (MONITORED_PROTOCOL.has(urlObj.protocol)) {
    //   let addBlacklistBtn = document.getElementById("add-blacklist-btn");
    //   addBlacklistBtn.style.display = "inline-block";
    //   addBlacklistBtn.onclick = quickAddBlacklist;
    // }
  }
}

// get current browsing host and display
let currentHostTxt = document.getElementById("current-host");
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  currentTab = tabs[0];
  currentPageUrl = currentTab.url;
  let urlObj = getUrlOfTab(currentTab);

  currentHostTxt.innerText = urlObj.hostname;

  RemoteCallable.call(
    "background-aux",
    "queryPageState",
    [currentPageUrl],
    setupCountdownDiv
  );
});
