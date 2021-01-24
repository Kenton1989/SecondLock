import {} from "./common-page.js";
import { DynamicPage } from "./dynamic-page.js";
import { setTextForClass } from "./utility.js";

function main() {
  DynamicPage.dynamicInit(function (args) {
    setTextForClass("blocked-link", args.blocked_link);
  });
}

window.addEventListener("load", main);
