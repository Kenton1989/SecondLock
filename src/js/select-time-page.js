/**
 * This is the js for select-time.html
 */
import {} from "./common-page.js";
import { DynamicPage } from "./dynamic-page.js";
import { OptionCollection } from "./options-manager.js";
import { RemoteCallable } from "./remote-callable.js";
import { autoUnblock, notifyUnblock } from "./tab-blocker.js";
import {
  blinkElement,
  closeCurrentTab,
  setTextForClass,
  validHostname,
} from "./utility.js";

let minUnit = chrome.i18n.getMessage("min");
let minUnits = chrome.i18n.getMessage("mins");

let blockedHost = undefined;
let warningTxt = undefined;

const options = new OptionCollection("defDurations");

const MINUTE = 60000;
/**
 * Unlock the blocked host of this page for the given duration.
 * @param {Number} minutes the duration in minute.
 */
function setUnlock(minutes) {
  console.debug(`Unlock ${blockedHost} for ${minutes} mins.`);

  if (!blockedHost) {
    warningTxt.innerText = "Blocked hostname is not set";
    return;
  }

  let unlockDuration = Math.round(minutes * MINUTE);
  RemoteCallable.call("lock-time-monitor", "setTimerFor", [
    blockedHost,
    unlockDuration,
  ], function(){
    notifyUnblock(blockedHost);
    // Delay for a while before closing to avoid potential frequent tab switching
    window.setTimeout(closeCurrentTab, 200);
  });
}

// Initialize the blocked hostname
DynamicPage.dynamicInit(function (args) {
  blockedHost = args.blockedHost;
  setTextForClass("blocked-link", blockedHost);
  autoUnblock(blockedHost);

  let closeAllBtn = document.getElementById("close-all");
  let pattern = blockedHost;
  if (validHostname(blockedHost)) {
    pattern = `*.${blockedHost}`;
  }
  closeAllBtn.onclick = function () {
    // close all page about the hostname
    chrome.tabs.query({ url: `*://${pattern}/*` }, function (tabs) {
      let tabIds = tabs.map((t) => t.id);
      chrome.tabs.remove(tabIds, function () {
        // Close time-selection and blocking page about the hostname
        notifyUnblock(blockedHost);
        // Delay for a while before closing to avoid potential frequent tab switching
        window.setTimeout(closeCurrentTab, 200);
      });
    });
  };
});

// Set where to show warning
warningTxt = document.getElementsByClassName("warning")[0];

// Prepare buttons for default time selection
const defaultTimes = [1, 5, 10, 15, 30, 60, 120];
let timeBtnDiv = document.getElementById("buttons");
function setDefDurBtnList(minsList) {
  timeBtnDiv.innerHTML = "";
  for (const minutes of minsList) {
    let newBtn = document.createElement("button");
    if (minutes == 1) {
      newBtn.innerText = `${minutes} ${minUnit}`;
    } else {
      newBtn.innerText = `${minutes} ${minUnits}`;
    }
    newBtn.onclick = function () {
      setUnlock(minutes);
    };
    timeBtnDiv.appendChild(newBtn);
  }
}
setDefDurBtnList(defaultTimes);
options.defDurations.doOnUpdated(function (minsList) {
  setDefDurBtnList(minsList);
});

const MIN_UNLOCK_MIN = 1;
const MAX_UNLOCK_MIN = 1000;
// Prepare for read user input minutes
let enterTimeBtn = document.getElementById("enter-time-btn");
let enterTimeLine = document.getElementById("enter-time-line");
let readUserInputTime = function () {
  let val = parseFloat(enterTimeLine.value);
  if (isNaN(val)) {
    warningTxt.innerText = "Please enter a number.";
  } else if (val < MIN_UNLOCK_MIN) {
    warningTxt.innerText = `The minimal unlock period is ${MIN_UNLOCK_MIN} mins.`;
  } else if (val > MAX_UNLOCK_MIN) {
    warningTxt.innerText = `The maximal unlock period is ${MAX_UNLOCK_MIN} mins.`;
  } else {
    warningTxt.innerText = "";
    setUnlock(val);
  }
  blinkElement(warningTxt);
};
enterTimeBtn.onclick = readUserInputTime;
enterTimeLine.onkeydown = function (e) {
  // Prevent user from enter something smaller than 1
  if (enterTimeLine.value.length == 0 && e.key == "0") e.preventDefault();
  // Shortcut for entering
  if (e.key == "Enter") readUserInputTime();
};
