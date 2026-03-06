const injectSpoofing = () => {
  chrome.storage.local.get([
    'ipData', 'timezone', 'lat', 'lon', 'locale', 'userAgent', 'platform',
    'locationBrowserDefault', 'userAgentBrowserDefault'
  ], (storage) => {
    // We inject a script tag directly into the DOM so it runs in the MAIN world.
    // Firefox MV3 doesn't easily support world: 'MAIN' in the manifest yet.
    const code = `
      (() => {
        const s = ${JSON.stringify(storage)};
        
        // spoof timezone & locale
        if (!s.locationBrowserDefault) {
          if (s.timezone || s.locale) {
            const OriginalDateTimeFormat = Intl.DateTimeFormat;
            Intl.DateTimeFormat = function(locales, options) {
              options = options || {};
              if (s.timezone) options.timeZone = s.timezone;
              return new OriginalDateTimeFormat(s.locale || locales, options);
            };
            Intl.DateTimeFormat.prototype = OriginalDateTimeFormat.prototype;
          }
          
          // spoof geolocation
          if (s.lat || s.lon) {
            navigator.geolocation.getCurrentPosition = function(success, error, options) {
              success({
                coords: {
                  latitude: parseFloat(s.lat || (s.ipData && s.ipData.lat) || 0),
                  longitude: parseFloat(s.lon || (s.ipData && s.ipData.lon) || 0),
                  accuracy: 10, altitude: null, altitudeAccuracy: null, heading: null, speed: null
                },
                timestamp: Date.now()
              });
            };
          }
        }

        // spoof user agent & platform
        if (!s.userAgentBrowserDefault) {
          if (s.userAgent) {
            Object.defineProperty(navigator, 'userAgent', { get: () => s.userAgent });
          }
          if (s.platform) {
            Object.defineProperty(navigator, 'platform', { get: () => s.platform });
          }
        }
      })();
    `;
    
    const script = document.createElement('script');
    script.textContent = code;
    // Inject as early as possible so scripts loaded after it get the spoofed values
    (document.head || document.documentElement).appendChild(script);
    script.remove();
  });
};

injectSpoofing();
