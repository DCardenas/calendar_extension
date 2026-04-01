interface CalendarEventData {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string } | { date: string };
  end: { dateTime: string; timeZone?: string } | { date: string };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'UPLOAD_EVENTS') {
    handleUploadEvents(request.events)
      .then(() => sendResponse({ success: true }))
      .catch((err) => {
        console.error('Upload Error:', err);
        sendResponse({ success: false, error: err.message });
      });

    // Return true to indicate we will sendResponse asynchronously
    return true;
  }
});

async function handleUploadEvents(events: CalendarEventData[]) {
  // 1. Get Auth Token
  const token = await new Promise<string>((resolve, reject) => {
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

  // 2. Upload Events to Google Calendar sequentially
  for (const event of events) {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Failed to create event:', errorText);
      throw new Error(
        `Calendar API Error: ${response.statusText} - ${errorText}`,
      );
    }

    // Brief delay to mitigate rate limiting if uploading multiple events
    await new Promise((res) => setTimeout(res, 250));
  }
}
