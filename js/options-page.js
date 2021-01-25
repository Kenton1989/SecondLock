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

const HOSTNAME_NOT_ALLOWED_KEY = /^[^a-z0-9:\[\]\.\-]$/i;
/**
 * Setup hostname input division
 * @param {String[]} hosts array of hostname
 * @param {Element} hostList the division element
 * @param {function(String[])} onSaveHostList callback when the hostname list is saved
 */
function setUpHostListDiv(hosts, hostListDiv, onSaveHostList = function () {}) {
  // get the host list and setup
  let hostList = hostListDiv.getElementsByClassName("host-list")[0];
  setHostList(hosts, hostList);

  // prepare the element to display warning
  let warning = hostListDiv.getElementsByClassName("warning")[0];

  // set of hostname already in the list
  let hostSet = new Set(hosts);
  let dirty = false;

  // prepare elements for user input
  let userInput = hostListDiv.getElementsByClassName("host-input")[0];
  let addHostBtn = hostListDiv.getElementsByClassName("add-host-btn")[0];

  let enterHost = function () {
    let input = userInput.value;

    // warn for empty input
    if (!input) {
      warning.innerText = "Please enter a host.";
      blinkElement(warning);
      return;
    }

    // Format the input hostname.
    let hostname = "";
    if (
      validHostname(input) ||
      validIPv4Address(input) ||
      validIPv6Hostname(input)
    ) {
      hostname = reformatHostname(input);
    } else if (validIPv6Address(input)) {
      // Square brackets are needed for IPv6 hostname.
      hostname = reformatHostname(`[${input}]`);
    } else {
      // warn for bad format
      warning.innerText = "Invalid host format.";
      blinkElement(warning);
      return;
    }

    // warn for entering existing hostname
    if (hostSet.has(hostname)) {
      warning.innerText = "Host already in the list.";
      blinkElement(warning);
      return;
    }

    // accept input hostname
    userInput.value = "";
    warning.innerText = "";
    let item = makeHostListItem(hostname);
    item.classList.add("unsaved");
    hostSet.add(hostname);
    dirty = true;
    hostList.appendChild(item);
  };

  addHostBtn.onclick = enterHost;
  userInput.onkeydown = function (e) {
    // Shortcut for entering
    if (e.key == "Enter") enterHost();
    // Prevent some of invalid input
    if (HOSTNAME_NOT_ALLOWED_KEY.test(e.key)) e.preventDefault();
  };

  // prepare for saving list
  let saveListBtn = hostListDiv.getElementsByClassName("save-host-btn")[0];
  saveListBtn.onclick = function () {
    // filter out the deleted item
    let items = hostList.childNodes;
    for (const item of items) {
      if (!item.classList.contains("deleted")) continue;
      let host = item.getElementsByClassName("host")[0];
      hostSet.delete(host.innerText);
      dirty = true;
    }

    if (dirty) {
      onSaveHostList([...hostSet]);
      dirty = false;
    } else {
      console.log("Host list is not modified. Skip saving.");
    }

    warning.innerText = "";
  };
}

setupSectionNav();

// read element templates
templates = document.getElementById("templates");

/**
 * Make a host list item.
 * @param {String} host the hostname stored in the item
 */
let makeHostListItem = (function () {
  // Local variable encapsulation
  let tempItem = templates.getElementsByClassName("host-list-item")[0];
  let hostnameTxt = tempItem.getElementsByClassName("host")[0];

  // actual function
  return function (host) {
    // Set hostname before clone the node.
    hostnameTxt.innerText = host;
    let item = tempItem.cloneNode(true);
    let deleteBtn = item.getElementsByClassName("delete-btn")[0];
    let undoBtn = item.getElementsByClassName("undo-btn")[0];

    undoBtn.style.display = "none";
    // delete and undo buttons will hide themselves, display the other one
    // and modify the deletion tag of this item
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

// Set up monitored host list
let monitoredHostDiv = document.getElementById("monitored-host");
let hostList = document.getElementsByClassName("host-list")[0];
let hosts = ["bilibili.com", "youtube.com", "google.com"];
setUpHostListDiv(hosts, monitoredHostDiv, function (list) {
  console.log(list);
  setHostList(list, hostList);
});

//////////////////// Old dirty codes /////////////////////
let activate = document.getElementById("activate");
let saveBtn = document.getElementById("save-general-btn");
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

