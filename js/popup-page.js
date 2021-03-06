/**
 * This is the js for popup.html
 */
import { remoteCall, RemoteCallable } from "./remote-callable.js";
import { closeTabs, getUrlOfTab, queryTabsUnder } from "./utility.js";

let currentPageUrl = "";
let monitoredHost = undefined;
let unlockEndTime = undefined;
let remainTimeDiv = undefined;

const SECOND = 1000;
const MINUTE = 60000;
const HOUR = 3600000;

/**
 * convert a number to string of the given length
 * padded with 0 at the beginning
 * @param {Number} num the number to pad
 * @param {Number} len length after padding
 */
function pad0(num, len = 2) {
  return num.toString().padStart(len, "0");
}

/**
 * convert the duration into h:m:s.ms format
 * @param {number} milliseconds the duration in milliseconds
 * @return {number[]} array in this format [hour, minutes, seconds, milliseconds]
 */
function convertDur(milliseconds) {
  let mSec = milliseconds % SECOND;
  let sec = Math.floor(milliseconds / SECOND) % 60;
  let min = Math.floor(milliseconds / MINUTE) % 60;
  let hour = Math.floor(milliseconds / HOUR);
  return [hour, min, sec, mSec];
}

const TIME_BUFFER_LO = 50;
const TIME_BUFFER_HI = 150;
const TIME_BUFFER = (TIME_BUFFER_HI + TIME_BUFFER_LO) >> 1;

remainTimeDiv = document.getElementById("remain-time");

function updateRemainTime() {
  let mSec = unlockEndTime - Date.now();
  let dur = convertDur(mSec);
  remainTimeDiv.innerText = `${pad0(dur[0])}:${pad0(dur[1])}:${pad0(dur[2])}`;
  if (mSec >= 1000) {
    let len = dur[3];
    if (len < TIME_BUFFER_LO) len += 1000 - TIME_BUFFER;
    else if (len > TIME_BUFFER_HI) len -= TIME_BUFFER;
    else len = 1000;
    window.setTimeout(updateRemainTime, len);
  } else {
    window.setTimeout(function () {
      window.close();
    }, mSec + 100);
  }
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
    updateRemainTime();

    let stopBtn = document.getElementById("stop-timer-btn");
    stopBtn.style.display = "inline-block";
    stopBtn.onclick = function () {
      // close all monitored tabs and end the timer
      queryTabsUnder(monitoredHost, function (tabs) {
        closeTabs(tabs, () =>
          RemoteCallable.call(
            "lock-time-monitor",
            "stopTiming",
            [monitoredHost],
            window.close
          )
        );
      });
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
  let tab = tabs[0];
  currentPageUrl = tab.url;
  let urlObj = getUrlOfTab(tab);

  currentHostTxt.innerText = urlObj.hostname;

  let query = {
    queryHostMonitoredState: {
      url: tab.url,
    },
  };
  // console.debug("Query: ", query);
  chrome.runtime.sendMessage(query, setupCountdownDiv);
});
