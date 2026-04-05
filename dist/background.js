"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/events.ts
  var UploadActionEvent, UploadResponse;
  var init_events = __esm({
    "src/events.ts"() {
      "use strict";
      UploadActionEvent = class {
        constructor(events) {
          this.events = events;
        }
        events;
        static action = "UPLOAD_EVENTS";
      };
      UploadResponse = class {
        constructor(options) {
          this.options = options;
        }
        options;
      };
    }
  });

  // background.ts
  var require_background = __commonJS({
    "background.ts"() {
      init_events();
      chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
        if (request.action !== UploadActionEvent.action) return false;
        attemptUpload(request.events, sendResponse);
        return true;
      });
      async function attemptUpload(events, responder) {
        try {
          const token = await fetchAuthToken();
          await handleUploadEvents(token, events);
          responder(new UploadResponse({ success: true }));
        } catch (err) {
          console.error("Upload Error:", err);
          responder(new UploadResponse({ success: false, error: err.message }));
        }
      }
      async function handleUploadEvents(token, events) {
        for (const event of events) {
          const response = await saveEvent(token, event);
          if (!response.ok) {
            const errorText = await response.text();
            console.error("Failed to create event:", errorText);
            throw new Error(
              `Calendar API Error: ${response.statusText} - ${errorText}`
            );
          }
          await new Promise((res) => setTimeout(res, RATE_LIMIT_DELAY_MS));
        }
      }
      var FETCH_EVENTS_URI = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
      async function saveEvent(token, event) {
        const response = await fetch(FETCH_EVENTS_URI, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(event)
        });
        return response;
      }
      var RATE_LIMIT_DELAY_MS = 250;
      async function fetchAuthToken() {
        return new Promise((resolve, reject) => {
          chrome.identity.getAuthToken({ interactive: true }, (token) => {
            if (chrome.runtime.lastError || !token) {
              reject(
                new Error(
                  chrome.runtime.lastError?.message || "Authentication failed. Make sure your OAuth Client ID is configured."
                )
              );
            } else {
              resolve(token);
            }
          });
        });
      }
    }
  });
  require_background();
})();
