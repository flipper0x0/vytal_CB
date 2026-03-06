import attachDebugger from './attachDebugger'

const attachTab = (tabId: number) => {
  if (!chrome.debugger) {
    console.warn("Debugger API is not available (likely running in Firefox). Core functionality will be limited.");
    return;
  }
  
  chrome.debugger.getTargets((tabs) => {
    const currentTab = tabs.find((obj) => obj.tabId === tabId)
    if (!currentTab?.attached) {
      attachDebugger(tabId)
    }
  })
}

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id) attachDebugger(tab.id)
})

chrome.tabs.onActivated.addListener((tab) => {
  attachTab(tab.tabId)
})

chrome.tabs.onUpdated.addListener((tabId) => {
  attachTab(tabId)
})

// Keep-Alive Mechanism for Chromium MV3 Service Workers
// Prevents the service worker from sleeping while debugging is active
if (typeof chrome.alarms !== "undefined") {
  chrome.alarms.create('keepAlive', { periodInMinutes: 0.4 });
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
      chrome.runtime.getPlatformInfo(() => {
         // Dummy call to reset the service worker idle timer
      });
    }
  });
}
