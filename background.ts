import {
  CalendarEventData,
  UploadActionEvent,
  UploadResponse,
} from './src/events';

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.action !== UploadActionEvent.action) return false;

  attemptUpload(request.events, sendResponse);

  // Return true to indicate we will sendResponse asynchronously
  return true;
});

async function attemptUpload(
  events: CalendarEventData[],
  responder: (response: UploadResponse) => void,
) {
  try {
    const token = await fetchAuthToken();
    await handleUploadEvents(token, events);
    responder(new UploadResponse({ success: true }));
  } catch (err: any) {
    console.error('Upload Error:', err);
    responder(new UploadResponse({ success: false, error: err.message }));
  }
}

async function handleUploadEvents(token: string, events: CalendarEventData[]) {
  for (const event of events) {
    const response = await saveEvent(token, event);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create event:', errorText);
      throw new Error(
        `Calendar API Error: ${response.statusText} - ${errorText}`,
      );
    }

    // Brief delay to mitigate rate limiting if uploading multiple events
    await new Promise((res) => setTimeout(res, RATE_LIMIT_DELAY_MS));
  }
}

const FETCH_EVENTS_URI =
  'https://www.googleapis.com/calendar/v3/calendars/primary/events';

async function saveEvent(
  token: string,
  event: CalendarEventData,
): Promise<Response> {
  const response = await fetch(FETCH_EVENTS_URI, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  return response;
}

const RATE_LIMIT_DELAY_MS = 250;

async function fetchAuthToken() {
  return new Promise<string>((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(
          new Error(
            chrome.runtime.lastError?.message ||
              'Authentication failed. Make sure your OAuth Client ID is configured.',
          ),
        );
      } else {
        resolve(token as string);
      }
    });
  });
}
