declare var ICAL: any;

interface CalendarEventData {
    summary: string;
    description?: string;
    location?: string;
    start: { dateTime: string, timeZone?: string } | { date: string };
    end:   { dateTime: string, timeZone?: string } | { date: string };
}

// 1. Inject DOM elements
function injectUI() {
    const dropZone = document.createElement('div');
    dropZone.id = 'ics-drop-zone';
    dropZone.innerHTML = `
        <div id="ics-drop-zone-content">
            <div id="ics-drop-zone-icon">📅</div>
            <h1>Drop .ics file here</h1>
            <p>Add events directly to your Google Calendar</p>
        </div>
    `;
    document.body.appendChild(dropZone);

    const toast = document.createElement('div');
    toast.id = 'ics-toast';
    document.body.appendChild(toast);
}

function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
    const toast = document.getElementById('ics-toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.className = `show ${type}`;
    
    setTimeout(() => {
        toast.className = '';
    }, 4000);
}

// 2. Setup Drag and Drop Listeners
function setupDragAndDrop() {
    const dropZone = document.getElementById('ics-drop-zone');
    if (!dropZone) return;

    let dragCounter = 0; // To handle child elements properly

    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        dropZone.classList.add('active');
    });

    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            dropZone.classList.remove('active');
            dropZone.classList.remove('drag-over');
        }
    });

    window.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    window.addEventListener('drop', async (e) => {
        e.preventDefault();
        dragCounter = 0;
        dropZone.classList.remove('active');
        dropZone.classList.remove('drag-over');

        const file = e.dataTransfer?.files?.[0];
        if (!file || !file.name.endsWith('.ics')) {
            showToast('Please drop a valid .ics file', 'error');
            return;
        }

        try {
            const text = await readFile(file);
            const events = parseICS(text);
            
            if (events.length === 0) {
                showToast('No events found in file', 'error');
                return;
            }

            showToast(`Uploading ${events.length} event(s)...`);
            
            chrome.runtime.sendMessage({ action: 'UPLOAD_EVENTS', events }, (response: any) => {
                if (response?.success) {
                    showToast(`Successfully added ${events.length} event(s)!`, 'success');
                } else {
                    showToast(`Failed: ${response?.error || 'Unknown error'}`, 'error');
                }
            });

        } catch (err: any) {
            showToast(err.message || 'Failed to parse file', 'error');
        }
    });
}

function readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
    });
}

function parseICS(icsData: string): CalendarEventData[] {
    const jcalData = ICAL.parse(icsData);
    const comp = new ICAL.Component(jcalData);
    const vevents = comp.getAllSubcomponents('vevent');
    
    const events: CalendarEventData[] = [];

    for (const vevent of vevents) {
        const event = new ICAL.Event(vevent);
        
        const calendarEvent: Partial<CalendarEventData> = {
            summary: event.summary || 'Untitled Event',
        };

        if (event.description) calendarEvent.description = event.description;
        if (event.location) calendarEvent.location = event.location;

        if (event.startDate.isDate) {
            // Full day events
            // toISODate returns YYYY-MM-DD
            const startStr = String(event.startDate).split('T')[0];
            const endStr = String(event.endDate).split('T')[0];
            calendarEvent.start = { date: startStr };
            calendarEvent.end = { date: endStr };
        } else {
            // Precise time events
            calendarEvent.start = { dateTime: event.startDate.toJSDate().toISOString() };
            calendarEvent.end = { dateTime: event.endDate.toJSDate().toISOString() };
        }

        events.push(calendarEvent as CalendarEventData);
    }

    return events;
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        injectUI();
        setupDragAndDrop();
    });
} else {
    injectUI();
    setupDragAndDrop();
}
