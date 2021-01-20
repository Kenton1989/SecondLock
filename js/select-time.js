let minUnit = chrome.i18n.getMessage("minute_single");
let minUnits = chrome.i18n.getMessage("minute_plural");

function selectTime(btn) {}

timeBtnDiv = document.getElementById("buttons");
const defaultTimes = [1, 5, 10, 15, 30, 60];

defaultTimes.forEach((minutes) => {
  newBtn = document.createElement("button");
  if (minutes == 1) {
    newBtn.innerText = minutes + " " + minUnit;
  } else {
    newBtn.innerText = minutes + " " + minUnits;
  }
  newBtn.value = minutes;
  newBtn.classList.add("time-select");
  newBtn.onclick = selectTime;
  timeBtnDiv.appendChild(newBtn);
});
