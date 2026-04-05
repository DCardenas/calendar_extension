import { UploadActionEvent, UploadResponse } from '../events';
import { parseICS } from '../ics/parse';
import { Signal } from '../signal/Signal';

export class Task {
  readonly id: string;
  private _status: TaskStatus;

  readonly taskStatusChanged: Signal<{
    status: TaskStatus;
    message: string;
  }> = new Signal();

  readonly taskRemoved: Signal<void> = new Signal();

  constructor(readonly file: File) {
    this.id = Math.random().toString(36).slice(2, 9);
    this._status = TaskStatus.PENDING;
  }

  get status() {
    return this._status;
  }

  updateStatus(status: TaskStatus, message: string) {
    this._status = status;

    this.taskStatusChanged.emit({ status, message });
  }

  remove() {
    this.taskRemoved.emit();
  }

  async process() {
    this.updateStatus(TaskStatus.PROCESSING, 'Reading file...');

    try {
      const text = await this.readFile(this.file);
      const events = parseICS(text);

      if (events.length === 0) {
        throw new Error('No events found');
      }

      this.updateStatus(
        TaskStatus.PROCESSING,
        `Uploading ${events.length} events...`,
      );

      return new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          new UploadActionEvent(events),
          (response?: UploadResponse) => {
            if (response?.options.success) {
              this.updateStatus(
                TaskStatus.SUCCESS,
                `Added ${events.length} events`,
              );
            } else {
              this.updateStatus(
                TaskStatus.ERROR,
                response?.options.error || 'Upload failed',
              );
            }
            resolve();
          },
        );
      });
    } catch (err: any) {
      this.updateStatus(TaskStatus.ERROR, err.message || 'Failed');
    }
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}
