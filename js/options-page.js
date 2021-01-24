import {} from "./common-page.js";
import {setupSectionNav} from "./nav-setup.js";
// import {DynamicPage} from "./dynamic-page.js";

function main() {
    setupSectionNav();

    let activate = document.getElementById("activate");
    let saveBtn = document.getElementById("save-options");
    
    chrome.storage.sync.get("activated", function(data) {
        activate.checked = data.activated;
        console.debug("Setup activated as " + data.activated)
    });

    saveBtn.addEventListener("click", function() {
        chrome.storage.sync.set({
            "activated": activate.checked
        },
        function() {
            console.debug("Options saved");
            console.debug("activated: "+activate.checked);
        });
    });
}

window.addEventListener("load", main);