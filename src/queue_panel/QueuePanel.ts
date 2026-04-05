import { QueueManager } from '../QueueManager';
import { Toast } from '../toast/Toast';
import { Header } from './Header';

export class QueuePanel {
  readonly el: HTMLDivElement;
  private _needsSync: boolean = false;

  constructor({
    toast,
    queueManager,
  }: {
    toast: Toast;
    queueManager: QueueManager;
  }) {
    this.el = this.createQueuePanel({ toast, queueManager });

    queueManager.addNewTasksListener(() => {
      this.show();
    });
  }

  get needsSync(): boolean {
    return this._needsSync;
  }

  setNeedsSync(needsSync: boolean) {
    this._needsSync = needsSync;
  }

  show() {
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
  }

  private createQueuePanel({
    toast,
    queueManager,
  }: {
    toast: Toast;
    queueManager: QueueManager;
  }): HTMLDivElement {
    const queuePanel = document.createElement('div');
    queuePanel.id = ID;
    document.body.appendChild(queuePanel);

    const header = new Header({ queuePanel: this, toast, queueManager });
    queuePanel.appendChild(header.el);

    const queueList = document.createElement('div');
    queueList.id = 'ics-queue-list';
    queuePanel.appendChild(queueList);

    return queuePanel;
  }
}

const ID = 'ics-queue-panel';
