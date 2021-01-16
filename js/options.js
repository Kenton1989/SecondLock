
var activate = document.getElementById("activate");
var saveBtn = document.getElementById("save-options");

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
