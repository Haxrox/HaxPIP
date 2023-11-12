// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var prevTabId = -1;

function sendMessage(tabId, messageType, ...args) {
    console.log("sendMessage: " + tabId + " | " + messageType);
    chrome.tabs.sendMessage(tabId, { type: messageType, args: args }).catch((err) => {
        if (err.message.includes("Could not establish connection. Receiving end does not exist.")) {
            addScript(tabId).then(() => {
                // setTimeout(sendMessage, 500, tabId, messageType, args);
            }).catch((err) => {
                console.error(err);
            });
        }
        console.error(err);
    });
}

function addScript(tabId) {
    console.log("addScript: " + tabId);
    return chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["script.js"],
    });
}

chrome.action.onClicked.addListener((tab) => {
    sendMessage(prevTabId, "togglePIP");
});

chrome.tabs.onActivated.addListener((activeInfo) => {
    if (prevTabId != -1) {
        sendMessage(prevTabId, "enablePIP");
    }

    sendMessage(activeInfo.tabId, "disablePIP");
    prevTabId = activeInfo.tabId;
}); 

chrome.tabs.onCreated.addListener(addScript);
chrome.tabs.onRemoved.addListener((tabId, _) => {
    prevTabId == tabId ? -1 : prevTabId;
});