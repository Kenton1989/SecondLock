
const selectTimeURL = chrome.runtime.getURL("select-time.html");

var activate = document.getElementById("activate");
var saveBtn = document.getElementById("save-options");
var selectLink = document.getElementById("go-select");

selectLink.href = selectTimeURL;

chrome.storage.sync.get("activated", function(data) {
    activate.checked = data.activated;
    console.log("Setup activated as " + data.activated)
});

saveBtn.onclick = function(e) {
    chrome.storage.sync.set({
            "activated": activate.checked
        },
        function() {
            console.log("Options saved");
            console.log("activated: "+activate.checked);
        });
};
