import { remoteCall } from "./remote-callable.js";
import { getUrlOfTab } from "./utility.js";

let currentHost = "";
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

function updateRemainTime() {
  let mSec = unlockEndTime - Date.now();
  let dur = convertDur(mSec);
  remainTimeDiv.innerText = `${pad0(dur[0])}:${pad0(dur[1])}:${pad0(dur[2])}`;
  if (mSec >= 1000) {
    window.setTimeout(updateRemainTime, (dur[3] + 900) % 1000);
  } else {
    window.setTimeout(function(){
      window.close();
    }, mSec+100);
  }
}

function doOnLoaded() {
  // open the option page with special method.
  // Using hyperlink directly will open the page in the popup window
  let goOptions = document.getElementById("go-options");
  goOptions.onclick = function (e) {
    chrome.runtime.openOptionsPage();
  };

  remainTimeDiv = document.getElementById("remain-time");

  // set current browsing host
  let currentHostTxt = document.getElementById("current-host");
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    currentHost = getUrlOfTab(tabs[0]).hostname;
    currentHostTxt.innerText = currentHost;

    remoteCall(
      "browse-monitor",
      "isMonitoring",
      [currentHost],
      function (hostname) {
        if (!hostname) return;
        monitoredHost = hostname;
        remoteCall(
          "lock-time-monitor",
          "endTimePoint",
          [monitoredHost],
          function (endTimePoint) {
            if (endTimePoint == undefined) {
              remainTimeDiv.innerText = "ERROR!";
              console.error("Accessing monitored page without unlocking.");
              return;
            }
            unlockEndTime = endTimePoint;
            updateRemainTime();
          }
        );
      }
    );
  });
}

window.addEventListener("load", doOnLoaded);
