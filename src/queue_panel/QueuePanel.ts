import { Toast } from '../toast/Toast';
import { Header } from './Header';

export class QueuePanel {
  private readonly el: HTMLDivElement;
  private _needsSync: boolean = false;

  constructor({ toast }: { toast: Toast }) {
    const existing = document.getElementById(ID);
    if (existing) {
      this.el = existing as HTMLDivElement;
      return;
    }

    this.el = this.createQueuePanel({ toast });
  }

  get needsSync(): boolean {
    return this.needsSync;
  }

  private createQueuePanel({ toast }: { toast: Toast }): HTMLDivElement {
    const queuePanel = document.createElement('div');
    queuePanel.id = ID;
    document.body.appendChild(queuePanel);

    const header = new Header({ queuePanel: this, toast });
    queuePanel.appendChild(header.el);

    const queueList = document.createElement('div');
    queueList.id = 'ics-queue-list';
    queuePanel.appendChild(queueList);

    return queuePanel;
  }
}

const ID = 'ics-queue-panel';
