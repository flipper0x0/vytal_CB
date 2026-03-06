const STORAGE_KEYS = [
  'ipData', 'timezone', 'lat', 'lon', 'locale',
  'userAgent', 'platform', 'locationBrowserDefault', 'userAgentBrowserDefault',
]

const buildPayload = (s: Record<string, any>): string => {
  const ip = s.ipData ?? {}
  const lat = s.lat ? parseFloat(s.lat) : (ip.lat ?? 0)
  const lon = s.lon ? parseFloat(s.lon) : (ip.lon ?? 0)

  const spoofTzLocale = !s.locationBrowserDefault && (s.timezone || s.locale)
  const spoofGeo = !s.locationBrowserDefault && (s.lat || s.lon)
  const spoofUA = !s.userAgentBrowserDefault && (s.userAgent || s.platform)

  let code = '(() => {'

  if (spoofTzLocale) {
    code += `
  try {
    const _DTF = Intl.DateTimeFormat;
    Intl.DateTimeFormat = function(locales, opts) {
      opts = opts || {};
      ${s.timezone ? `opts.timeZone = ${JSON.stringify(s.timezone)};` : ''}
      return new _DTF(${s.locale ? JSON.stringify(s.locale) : 'locales'}, opts);
    };
    Object.assign(Intl.DateTimeFormat, _DTF);
    Intl.DateTimeFormat.prototype = _DTF.prototype;
  } catch(e) {}`
  }

  if (spoofGeo) {
    code += `
  try {
    const _coords = { latitude: ${lat}, longitude: ${lon}, accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null };
    const _pos = { coords: _coords, timestamp: Date.now() };
    navigator.geolocation.getCurrentPosition = (ok) => ok(_pos);
    navigator.geolocation.watchPosition = (ok) => { ok(_pos); return 0; };
  } catch(e) {}`
  }

  if (spoofUA) {
    code += `
  try {
    ${s.userAgent ? `Object.defineProperty(navigator, 'userAgent', { get: () => ${JSON.stringify(s.userAgent)}, configurable: true });` : ''}
    ${s.platform ? `Object.defineProperty(navigator, 'platform', { get: () => ${JSON.stringify(s.platform)}, configurable: true });` : ''}
  } catch(e) {}`
  }

  code += '})();'
  return code
}

const inject = (code: string): void => {
  const el = document.createElement('script')
  el.textContent = code
  ;(document.head ?? document.documentElement).prepend(el)
  el.remove()
}

chrome.storage.local.get(STORAGE_KEYS, (s) => {
  const hasLocation = !s.locationBrowserDefault && (s.timezone || s.lat || s.lon || s.locale)
  const hasUA = !s.userAgentBrowserDefault && (s.userAgent || s.platform)
  if (hasLocation || hasUA) inject(buildPayload(s))
})
