import {getUrlOfTab} from "./general.js"
import {MinHeap} from "./min_heap.js"

const kSelectTimeURL = chrome.runtime.getURL("select-time.html");
const kBlockPageURL = chrome.runtime.getURL("blocking.html");
const kOptionURL = chrome.runtime.getURL("options.html");

const kBlackListProtocol = new Set(["http:", "https:"]);

var whiteList = [undefined, null, ""];

var activated = true;


chrome.runtime.onInstalled.addListener(function() {
    chrome.storage.sync.set({activated: true}, function(){
        console.log("Lock is activated");
    })
});

chrome.storage.sync.get("activated", function(data){
    activated = data.activated;
    console.log("Init activated: "+data.activated);
})

chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (changes.activated != undefined) {
        activated = changes.activated.newValue;
        console.log("background buffered activated changed: "+activated);
    }
  });

function shouldBlock(tab) {
    if (!activated) {
        return false;
    }
    var url = getUrlOfTab(tab);
    if (!kBlackListProtocol.has(url.protocol)) {
        console.log("Protocol not in black list");
        return false;
    }
    return true;
}

function blockTab(tab) {
    console.log("Blocking the tab");
    window.setTimeout(function(){
        chrome.tabs.create({
            url: kOptionURL,
            openerTabId: tab.id
            }
        );
    }, 100);
}

function onTabChanged(tab) {
    var url = getUrlOfTab(tab);
    console.log("Tab changed: ")
    console.log("Need to update timing info");
    console.log("host: " + url.hostname);
    console.log("protocol: " + url.protocol)
    
    if (shouldBlock(tab)) {
        blockTab(tab);
    }
}

function onTabSwitched(tab) {
    if (!tab.url) return;
    console.log("Switched tab."); 
    console.log(tab);
    onTabChanged(tab);
}

chrome.tabs.onUpdated.addListener(function(id, changes, tab){
    // if (!tab.active || tab.status != "complete" || !tab.url || !changes.url) return;
    if (!tab.active || !tab.url || !changes.url) return;
    console.log("Tab local changes.");
    console.log(tab);
    console.log(changes);
    onTabChanged(tab);
});

chrome.tabs.onActivated.addListener(function(tabInfo) {
    chrome.tabs.get(tabInfo.tabId, onTabSwitched);
});

chrome.windows.onFocusChanged.addListener(function(winId){
    if (winId == chrome.windows.WINDOW_ID_NONE) return;
    window.setTimeout(function(){
        chrome.tabs.query({active: true, windowId: winId}, function(tabs){
            console.assert(tabs.length == 1,
                                "Window "+winId+" should have one active tab, "+
                                "but has "+tabs.length+" instead.");
            onTabSwitched(tabs[0]);
        });
    }, 200);
});
