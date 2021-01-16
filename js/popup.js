
startBtn = document.getElementById("start");
digitTxt = document.getElementById("digits");
goOptions = document.getElementById("go-options");

var sec = 0;
const end = 5;

function incToEnd() {
    if (sec >= end) return;

    ++sec;
    digitTxt.innerText = sec;
    window.setTimeout(incToEnd, 1000);
}

goOptions.onclick = function(e) {
    chrome.runtime.openOptionsPage();
}

startBtn.onclick = function(e) {
    window.setTimeout(incToEnd, 1000);
};