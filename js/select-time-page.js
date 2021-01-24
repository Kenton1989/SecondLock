import {} from "./common-page.js";
import { DynamicPage } from "./dynamic-page.js";
import { setTextForClass } from "./utility.js";

let minUnit = chrome.i18n.getMessage("minute_single");
let minUnits = chrome.i18n.getMessage("minute_plural");

const defaultTimes = [1, 5, 10, 15, 30, 60, 120];

function selectTime(btn) {}

function main() {
  DynamicPage.dynamicInit(function (args) {
    setTextForClass("blocked-link", args.blocked_link);
  });

  let timeBtnDiv = document.getElementById("buttons");

  for (const minutes of defaultTimes) {
    let newBtn = document.createElement("button");
    if (minutes == 1) {
      newBtn.innerText = minutes + " " + minUnit;
    } else {
      newBtn.innerText = minutes + " " + minUnits;
    }
    newBtn.value = minutes;
    newBtn.classList.add("time-select");
    newBtn.onclick = selectTime;
    timeBtnDiv.appendChild(newBtn);
  }
}

window.addEventListener("load", main);
