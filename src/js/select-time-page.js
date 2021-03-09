/**
 * This is the js for select-time.html
 */
import {} from "./common-page.js";
import { DynamicPage } from "./dynamic-page.js";
import { OptionCollection } from "./options-manager.js";
import { RemoteCallable } from "./remote-callable.js";
import { TabBlocker } from "./tab-blocker.js";
import {
  closeCurrentTab,
  setTextForClass,
  showTxt,
  validHostname,
  $id,
  $cls,
} from "./utility.js";

let minUnit = chrome.i18n.getMessage("min");
let minUnits = chrome.i18n.getMessage("mins");

let blockedHost = undefined;
let warningTxt = undefined;

const options = new OptionCollection("defDurations");

const MINUTE = 60000;
const MIN_UNLOCK_MINUTES = 1;
const MAX_UNLOCK_MINUTES = 1439;
/**
 * Unlock the blocked host of this page for the given duration.
 * @param {Number} minutes the duration in minute.
 */
function setUnlock(minutes) {
  console.debug(`Unlock ${blockedHost} for ${minutes} mins.`);

  if (minutes < MIN_UNLOCK_MINUTES) {
    showTxt(
      warningTxt,
      `The minimal unlock period is ${MIN_UNLOCK_MINUTES} mins.`
    );
    return;
  } else if (minutes > MAX_UNLOCK_MINUTES) {
    showTxt(
      warningTxt,
      `The maximal unlock period is ${MAX_UNLOCK_MINUTES} mins.`
    );
    return;
  }

  if (!blockedHost) {
    showTxt(warningTxt, "Blocked hostname is not set");
    return;
  }

  let unlockDuration = Math.round(minutes * MINUTE);
  RemoteCallable.call(
    "lock-time-monitor",
    "setTimerFor",
    [blockedHost, unlockDuration],
    function () {
      TabBlocker.notifyUnblock(blockedHost);
      // Delay for a while before closing to avoid potential frequent tab switching
      window.setTimeout(closeCurrentTab, 200);
    }
  );
}

// Initialize the blocked hostname
DynamicPage.dynamicInit(function (args) {
  blockedHost = args.blockedHost;
  setTextForClass("blocked-link", blockedHost);
  TabBlocker.autoUnblock(blockedHost);

  let closeAllBtn = $id("close-all");
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
        TabBlocker.notifyUnblock(blockedHost);
        // Delay for a while before closing to avoid potential frequent tab switching
        window.setTimeout(closeCurrentTab, 200);
      });
    });
  };
});

// Set where to show warning
warningTxt = $cls("warning")[0];

// Prepare buttons for default time selection
const defaultTimes = [1, 5, 10, 15, 30, 60, 120];
let timeBtnDiv = $id("buttons");
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

// Prepare for read user input minutes
let enterTimeBtn = $id("enter-time-btn");
let enterTimeLine = $id("enter-time-line");
let readUserInputTime = function () {
  let val = parseFloat(enterTimeLine.value);
  if (isNaN(val)) {
    showTxt(warningTxt, "Please enter a number.");
    return;
  }
  warningTxt.innerText = "";
  setUnlock(val);
};
enterTimeBtn.onclick = readUserInputTime;
enterTimeLine.onkeydown = function (e) {
  // Prevent user from enter something smaller than 1
  if (enterTimeLine.value.length == 0 && e.key == "0") e.preventDefault();
  // Shortcut for entering
  if (e.key == "Enter") readUserInputTime();
};

//////////// Unlock by entering end time point ////////////////
{
  let endTimePointInput = $id("end-time-point-input");
  let enterTimePointBtn = $id("enter-time-point-btn");

  let time = new Date(Date.now());
  let curH = time.getHours();
  let curM = time.getMinutes();

  // advance to nearest half hour / full hour
  // but at least 3 minutes unlock time is guaranteed
  const MIN_UNLOCK_TIME = 2;
  if (curM < 30 - MIN_UNLOCK_TIME) {
    time.setMinutes(30);
  } else if (curM >= 60 - MIN_UNLOCK_TIME) {
    time.setMinutes(30);
    time.setHours(curH + 1);
  } else {
    time.setMinutes(0);
    time.setHours(curH + 1);
  }

  // convert to HH:MM
  let timeStr = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  endTimePointInput.value = timeStr;
  const ONE_DAY = 1000 * 60 * 60 * 24;
  enterTimePointBtn.onclick = function () {
    // Parse input
    let endTime = endTimePointInput.value;
    let endH = parseInt(endTime.substr(0, 2), 10);
    let endM = parseInt(endTime.substr(3, 2), 10);
    // Find end time point
    let now = Date.now();
    let endDateTime = new Date(now);
    endDateTime.setHours(endH);
    endDateTime.setMinutes(endM);
    endDateTime.setSeconds(0);
    endDateTime.setMilliseconds(0);
    let end = endDateTime.getTime();
    if (end <= now) end += ONE_DAY;
    // set unlock time
    setUnlock((end - now) / MINUTE);
  };
}
