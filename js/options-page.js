import {} from "./common-page.js";
import { setupSectionNav } from "./nav-setup.js";
import {
  reformatHostname,
  validHostname,
  validIPv4Address,
  validIPv6Hostname,
  blinkElement,
  validIPv6Address,
} from "./utility.js";

let templates = document;
/**
 * Make a host list item.
 * @param {String} host the hostname stored in the item
 */
let makeHostListItem = (function () {
  let tempItem = templates.getElementsByClassName("host-list-item")[0];
  let hostnameTxt = tempItem.getElementsByClassName("host")[0];

  return function (host) {
    hostnameTxt.innerText = host;
    let item = tempItem.cloneNode(true);
    let deleteBtn = item.getElementsByClassName("delete-btn")[0];
    let undoBtn = item.getElementsByClassName("undo-btn")[0];
    undoBtn.style.display = "none";

    deleteBtn.onclick = function () {
      item.classList.add("deleted");
      deleteBtn.style.display = "none";
      undoBtn.style.display = "block";
    };
    undoBtn.onclick = function () {
      item.classList.remove("deleted");
      undoBtn.style.display = "none";
      deleteBtn.style.display = "block";
    };

    return item;
  };
})();

/**
 * Add a list of hostname into the given element
 * @param {String[]} hosts array of hostname
 * @param {Element} hostListElement the element to put the list
 */
function setHostList(hosts, hostListElement) {
  hostListElement.innerHTML = "";
  for (const host of hosts) {
    let item = makeHostListItem(host);
    hostListElement.appendChild(item);
  }
}

const HOSTNAME_ALLOWED_KEY = /^[a-z0-9:\[\]\.\-]|(.{2,})$/i;
/**
 * Setup hostname input division
 * @param {String[]} hosts array of hostname
 * @param {Element} hostList the division element
 * @param {function(string[])} onSaveHostList callback when the hostname list is saved
 */
function setUpHostListDiv(
  hosts,
  hostListDiv,
  onSaveHostList = function (hostList) {}
) {
  let hostList = hostListDiv.getElementsByClassName("host-list")[0];
  setHostList(hosts, hostList);

  let warning = hostListDiv.getElementsByClassName("warning")[0];

  let userInput = hostListDiv.getElementsByClassName("host-input")[0];
  let addHostBtn = hostListDiv.getElementsByClassName("add-host-btn")[0];

  let hostSet = new Set(hosts);

  let enterHost = function () {
    let input = userInput.value;
    console.log(`Input: ${input}`);
    if (input.length <= 0) {
      warning.innerText = "Please enter a host.";
      blinkElement(warning);
      return;
    }

    let hostname = "";

    if (
      validHostname(input) ||
      validIPv4Address(input) ||
      validIPv6Hostname(input)
    ) {
      hostname = reformatHostname(input);
    } else if (validIPv6Address(input)) {
      hostname = reformatHostname(`[${input}]`);
    } else {
      warning.innerText = "Invalid host.";
      blinkElement(warning);
      return;
    }
    
    if (hostSet.has(hostname)) {
      warning.innerText = "Host already in the list."
      blinkElement(warning);
      return;
    }
    
    userInput.value = "";
    warning.innerText = "";
    let item = makeHostListItem(hostname);
    item.classList.add("unsaved");
    hostSet.add(hostname);
    hostList.appendChild(item);
  };

  userInput.onkeydown = function (e) {
    if (e.key == "Enter") enterHost();
    if (!HOSTNAME_ALLOWED_KEY.test(e.key)) e.preventDefault();
    if (/(Process)|(Unidentified)/.test(e.key)) {
      e.preventDefault();
      console.error("prevent process");
    }
  };

  addHostBtn.onclick = enterHost;

  let saveListBtn = hostListDiv.getElementsByClassName("save-host-btn")[0];
  saveListBtn.onclick = function () {
    let items = hostList.getElementsByClassName("host-list-item");
    for (const item of items) {
      if (!item.classList.contains("deleted")) continue;
      let host = item.getElementsByClassName("host")[0];
      hostSet.delete(host.innerText);
    }
    onSaveHostList([...hostSet]);
  };
}

function main() {
  setupSectionNav();

  templates = document.getElementById("templates");

  let activate = document.getElementById("activate");
  let saveBtn = document.getElementById("save-options");
  saveBtn.classList.add;

  chrome.storage.sync.get("activated", function (data) {
    activate.checked = data.activated;
    console.debug("Setup activated as " + data.activated);
  });

  saveBtn.addEventListener("click", function () {
    chrome.storage.sync.set(
      {
        activated: activate.checked,
      },
      function () {
        console.debug("Options saved");
        console.debug("activated: " + activate.checked);
      }
    );
  });

  let monitoredHostDiv = document.getElementById("monitored-host");
  let hostList = document.getElementsByClassName("host-list")[0];
  let hosts = ["bilibili.com", "youtube.com", "google.com"];
  setUpHostListDiv(hosts, monitoredHostDiv, function (list) {
    console.log(list);
    setHostList(list, hostList);
  });
}

window.addEventListener("load", main);
