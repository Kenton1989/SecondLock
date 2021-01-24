import {} from "./common-page.js";
import {DynamicPage} from "./dynamic-page.js";

function main() {
    DynamicPage.dynamicInit(function(args) {
        document.getElementById("blocked-link").innerText = args.blocked_link;
    });
}

window.addEventListener("load", main);