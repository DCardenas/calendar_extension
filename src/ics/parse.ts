import { CalendarEventData } from '../events';

declare var ICAL: {
  parse(icsData: string): any;
  Component: any;
  Event: any;
};

export function parseICS(icsData: string): CalendarEventData[] {
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
      const startStr = String(event.startDate).split('T')[0];
      const endStr = String(event.endDate).split('T')[0];
      calendarEvent.start = { date: startStr };
      calendarEvent.end = { date: endStr };
    } else {
      calendarEvent.start = {
        dateTime: event.startDate.toJSDate().toISOString(),
      };
      calendarEvent.end = {
        dateTime: event.endDate.toJSDate().toISOString(),
      };
    }
    events.push(calendarEvent as CalendarEventData);
  }
  return events;
}
