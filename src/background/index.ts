import attachDebugger from './attachDebugger'

const isDebuggerAvailable = (): boolean => typeof chrome.debugger !== 'undefined'

const attachTab = (tabId: number): void => {
  if (!isDebuggerAvailable()) return
  chrome.debugger.getTargets((targets) => {
    const already = targets.some((t) => t.tabId === tabId && t.attached)
    if (!already) attachDebugger(tabId)
  })
}

chrome.tabs.onCreated.addListener((tab) => {
  if (tab.id) attachDebugger(tab.id)
})

chrome.tabs.onActivated.addListener(({ tabId }) => attachTab(tabId))

// Only reattach when a new page actually starts loading — avoids duplicate attaches on every DOM event
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') attachTab(tabId)
})

// Keep-alive heartbeat for Chromium MV3 service workers
if (typeof chrome.alarms !== 'undefined') {
  chrome.alarms.create('keepAlive', { periodInMinutes: 0.4 })
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') chrome.runtime.getPlatformInfo(() => {})
  })
}
