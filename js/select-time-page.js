import {} from "./common-page.js";
import { DynamicPage } from "./dynamic-page.js";
import { RemoteCallable } from "./remote-callable.js";
import { setTextForClass, closeCurrentTab } from "./utility.js";

let minUnit = chrome.i18n.getMessage("minute_single");
let minUnits = chrome.i18n.getMessage("minute_plural");

const defaultTimes = [1, 5, 10, 15, 30, 60, 120];
const MINUTE = 60000;
const MIN_UNLOCK_MIN = 1;

let blockedHost = undefined;
let warningTxt = undefined;

function setUnlock(minutes) {
  console.debug(`Unlock ${blockedHost} for ${minutes} mins.`);

  if (!blockedHost) {
    warningTxt.innerText = "Blocked hostname is not set";
    return;
  }

  let unlockDuration = Math.round(minutes * MINUTE);
  RemoteCallable.call(
    "lock-time-monitor",
    "unlockFor",
    [blockedHost, unlockDuration],
    closeCurrentTab
  );
}

function main() {
  // Initialize the blocked hostname
  DynamicPage.dynamicInit(function (args) {
    setTextForClass("blocked-link", args.blocked_link);
    blockedHost = args.blocked_link;
  });

  // Set where to show warning
  warningTxt = document.getElementsByClassName("warning")[0];

  // Prepare for default time selection
  let timeBtnDiv = document.getElementById("buttons");
  for (const minutes of defaultTimes) {
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

  // Prepare for read user input minutes
  let enterTimeBtn = document.getElementById("enter-time-btn");
  let enterTimeLine = document.getElementById("enter-time-line");
  let readUserInputTime = function () {
    let val = parseFloat(enterTimeLine.value);
    if (isNaN(val)) {
      warningTxt.innerText = "Please enter a number.";
    } else {
      warningTxt.innerText = "";
      setUnlock(val);
    }
  };
  enterTimeBtn.onclick = readUserInputTime;
  enterTimeLine.onkeydown = function (e) {
    // Prevent user from enter something smaller than 1
    if (enterTimeLine.value.length == 0 && e.key == "0") e.preventDefault();
    // Quick entering
    if (e.key == "Enter") readUserInputTime();
  };
}

window.addEventListener("load", main);
