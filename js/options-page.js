/**
 * This is the js for options.html
 */
import {} from "./common-page.js";
import { HostnameSet } from "./hostname-set.js";
import { setupSectionNav } from "./nav-setup.js";
import { ALL_OPTION_NAME, OptionCollection } from "./options-manager.js";
import {
  reformatHostname,
  validHostname,
  validIPv4Address,
  validIPv6Hostname,
  validIPv6Address,
  showTxt,
  formatBytes,
} from "./utility.js";

let options = new OptionCollection(...ALL_OPTION_NAME);

//////////////////////// monitored list //////////////////////////

/**
 * Make a host list item.
 * @param {String} host the hostname stored in the item
 */
let makeHostListItem = (function () {
  // Local variable encapsulation
  let tempItem = document.getElementsByClassName("host-list-item")[0];
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

/**
 * Add a list of hostname into the given element
 * @param {String[]} hosts array of hostname
 * @param {Element} hostListElement the element to put the list
 * @param {HostnameSet} hostSet the set of hostname
 */
function setHostList(hosts, hostListElement, hostSet = undefined) {
  if (hostSet) {
    hostSet.clear();
    hostSet.addList(hosts);
    hosts = [...hostSet];
  }
  hosts.sort();
  hostListElement.innerHTML = "";
  for (const host of hosts) {
    let item = makeHostListItem(host);
    hostListElement.appendChild(item);
  }
}

/**
 * Setup hostname input division
 * @param {String[]} hosts array of hostname
 * @param {Element} hostList the division element
 * @param {function(String[])} onSaveHostList callback when the hostname list is saved
 */
function setUpHostListDiv(hosts, hostListDiv, onSaveHostList = function () {}) {
  // set of hostname already in the list
  let hostSet = new HostnameSet(hosts);
  let dirty = false;
  hostListDiv.hostSet = hostSet;

  // get the host list and setup
  let hostList = hostListDiv.getElementsByClassName("host-list")[0];
  setHostList(hosts, hostList, hostSet);

  // prepare the element to display warning
  let warning = hostListDiv.getElementsByClassName("warning")[0];

  // prepare elements for user input
  let userInput = hostListDiv.getElementsByClassName("host-input")[0];
  let addHostBtn = hostListDiv.getElementsByClassName("add-host-btn")[0];

  let enterHost = function () {
    let input = userInput.value.trim();

    // warn for empty input
    if (!input) {
      showTxt(warning, "Please enter a host.");
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
      showTxt(warning, "Unknown host format.");
      return;
    }

    // warn for entering existing hostname
    if (hostSet.has(hostname)) {
      showTxt(warning, "the host is already being monitored.");
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
  };

  // prepare for saving list
  let saveListBtn = hostListDiv.getElementsByClassName("save-host-btn")[0];
  saveListBtn.onclick = function () {
    // filter out the deleted item
    let items = hostList.childNodes;
    for (const item of items) {
      if (!item.classList.contains("deleted")) continue;
      let host = item.getElementsByClassName("host")[0];
      dirty = hostSet.remove(host.innerText) || dirty;
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

//////////////////// monitored host list ///////////////////////
let monitoredHostDiv = document.getElementById("monitored-host");
let monitoredHostListEle = monitoredHostDiv.getElementsByClassName("host-list")[0];
setUpHostListDiv([], monitoredHostDiv, function (list) {
  console.log(list);
  setHostList(list, monitoredHostListEle);
  options.monitoredList.set(list);
});

options.monitoredList.doOnUpdated(function (list) {
  setHostList(list, monitoredHostListEle, monitoredHostDiv.hostSet);
});

///////////////////// Whitelist ////////////////////////
let whitelistHostDiv = document.getElementById("whitelist-host");
let whitelistHostListEle = whitelistHostDiv.getElementsByClassName("host-list")[0];
setUpHostListDiv([], whitelistHostDiv, function (list) {
  console.log(list);
  setHostList(list, whitelistHostListEle);
  options.whitelistHost.set(list);
});

options.whitelistHost.doOnUpdated(function (list) {
  setHostList(list, whitelistHostListEle, whitelistHostDiv.hostSet);
});


///////////////////// Notification //////////////////////////
// TODO - add notification functions
options.notificationOn.doOnUpdated(function (notiOn) {});

//////////////////// Active Days ///////////////////////////
// TODO - add active days support

/////////////////////// Selection Page ///////////////////////

let defaultDurInput = document.getElementById("default-time");
let defaultDurSave = document.getElementById("save-default-time-btn");
let lastSaveDefDur = [];
const MIN_DUR_MIN = 1;
const MAX_DUR_MIN = 1000;
const MAX_DUR_CNT = 10;

function loadDefaultDurations(list) {
  defaultDurInput.value = list.toString();
}

function saveDefaultDuration(str) {
  // clear unsaved tag
  selectionPageSectionTitle.classList.remove("unsaved");

  if (str == lastSaveDefDur.toString()) {
    console.log("list is not changed. Skip saving.");
    return;
  }

  let sList = str.split(",");
  let res = new Set();
  for (let s of sList) {
    s = s.trim();
    let val = 0;
    val = parseInt(s);
    if (val >= MIN_DUR_MIN && val <= MAX_DUR_MIN) {
      res.add(val);
    }
    if (res.size >= MAX_DUR_CNT) break;
  }

  let list = [...res];
  list = list.sort((a, b) => a - b);
  
  // set without checking dirtiness to clear potential invalid values
  loadDefaultDurations(list);

  if (list.toString() == lastSaveDefDur.toString()) {
    console.log("list is not changed. Skip saving.");
    return;
  }
  lastSaveDefDur = list;
  options.defDurations.set(list);
}

options.defDurations.doOnUpdated(function (durList) {
  lastSaveDefDur = durList;
  loadDefaultDurations(durList);
});

defaultDurSave.onclick = function () {
  saveDefaultDuration(defaultDurInput.value);
};

const selectionPageSectionTitle = document.querySelector("#selection-page .section-title");
defaultDurInput.oninput = function() {
  selectionPageSectionTitle.classList.add("unsaved");
}

////////////////////// Blocking Page ///////////////////////
// TODO - allow customizing motto displayed on blocking page

////////////////////// storage & sync ////////////////////////

let localUseSpaceTxt = document.getElementById("local-used-space");
chrome.storage.local.getBytesInUse(function (val) {
  localUseSpaceTxt.innerText = formatBytes(val);
});

let cloudUseSpaceTxt = document.getElementById("cloud-used-space");
chrome.storage.sync.getBytesInUse(function (val) {
  cloudUseSpaceTxt.innerText = formatBytes(val);
});

let cloudMaxSpaceTxt = document.getElementById("cloud-max-space");
cloudMaxSpaceTxt.innerText = formatBytes(chrome.storage.sync.QUOTA_BYTES);

// TODO - add syncing support
