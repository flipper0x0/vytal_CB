import { IpData } from '../types'

const STORAGE_KEYS = [
  'ipData', 'timezone', 'timezoneMatchIP', 'lat', 'latitudeMatchIP',
  'lon', 'longitudeMatchIP', 'locale', 'localeMatchIP', 'userAgent',
  'platform', 'locationBrowserDefault', 'userAgentBrowserDefault',
] as const

type StorageData = Partial<Record<typeof STORAGE_KEYS[number], any>>

const storageGet = (): Promise<StorageData> =>
  new Promise((resolve) =>
    chrome.storage.local.get([...STORAGE_KEYS], (data) => resolve(data as StorageData))
  )

const debuggerSend = (tabId: number, method: string, params?: object): Promise<void> =>
  new Promise((resolve) =>
    chrome.debugger.sendCommand({ tabId }, method, params ?? {}, () => resolve())
  )

const attachDebugger = async (tabId: number): Promise<void> => {
  if (!chrome.debugger) return

  const s = await storageGet()

  const hasLocation = !s.locationBrowserDefault && (s.timezone || s.lat || s.lon || s.locale)
  const hasUA = !s.userAgentBrowserDefault && (s.userAgent || s.platform)

  if (!hasLocation && !hasUA) return

  chrome.debugger.attach({ tabId }, '1.3', async () => {
    if (chrome.runtime.lastError) return

    if (hasLocation) {
      if (s.timezone) {
        await debuggerSend(tabId, 'Emulation.setTimezoneOverride', {
          timezoneId: s.timezone,
        }).catch(() => chrome.debugger.detach({ tabId }))
        if (chrome.runtime.lastError) return
      }

      if (s.locale) {
        await debuggerSend(tabId, 'Emulation.setLocaleOverride', { locale: s.locale })
      }

      if (s.lat || s.lon) {
        const ip = s.ipData as IpData | undefined
        await debuggerSend(tabId, 'Emulation.setGeolocationOverride', {
          latitude: s.lat ? parseFloat(s.lat) : ip?.lat ?? 0,
          longitude: s.lon ? parseFloat(s.lon) : ip?.lon ?? 0,
          accuracy: 1,
        })
      }
    }

    if (hasUA) {
      await debuggerSend(tabId, 'Emulation.setUserAgentOverride', {
        userAgent: s.userAgent ?? '',
        platform: s.platform ?? '',
      })
    }
  })
}

export default attachDebugger
