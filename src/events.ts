export interface CalendarEventData {
  summary: string;
  description?: string;
  location?: string;
  start: { dateTime: string; timeZone?: string } | { date: string };
  end: { dateTime: string; timeZone?: string } | { date: string };
}

export class UploadActionEvent {
  constructor(readonly events: CalendarEventData[]) {}

  static readonly action = 'UPLOAD_EVENTS';
}

export class UploadResponse {
  constructor(
    readonly options: {
      readonly success: boolean;
      readonly error?: string;
    },
  ) {}
}
