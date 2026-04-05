import { HeaderMain } from './HeaderMain';
import { QueuePanel } from './QueuePanel';
import { Toast } from '../toast/Toast';
import { QueueManager } from '../QueueManager';

export class Header {
  readonly el: HTMLDivElement;

  constructor({
    queuePanel,
    toast,
    queueManager,
  }: {
    queuePanel: QueuePanel;
    toast: Toast;
    queueManager: QueueManager;
  }) {
    this.el = document.createElement('div');
    this.el.id = 'ics-queue-header';
    this.el.classList.add('queue-header');

    const headerMain = new HeaderMain({ queueManager });
    this.el.appendChild(headerMain.el);

    const closeButton = new CloseButton();
    this.el.appendChild(closeButton.el);
    closeButton.el.addEventListener('click', () => {
      queuePanel.hide();
      if (queuePanel.needsSync) {
        toast.show();
      }
    });
  }
}

class CloseButton {
  readonly el: HTMLButtonElement;

  constructor() {
    this.el = document.createElement('button');
    this.el.id = 'ics-queue-close';
    this.el.textContent = '×';
  }
}
