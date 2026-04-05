import { HeaderMain } from './HeaderMain';
import { QueuePanel } from './QueuePanel';
import { Toast } from '../toast/Toast';

export class Header {
  readonly el: HTMLDivElement;

  constructor({ queuePanel, toast }: { queuePanel: QueuePanel; toast: Toast }) {
    this.el = document.createElement('div');
    this.el.id = 'ics-queue-header';
    this.el.classList.add('queue-header');

    const headerMain = new HeaderMain({ queuePanel, toast });
    this.el.appendChild(headerMain.el);

    const closeButton = new CloseButton();
    this.el.appendChild(closeButton.el);
    closeButton.el.addEventListener('click', () => {
      this.el.classList.remove('visible');
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
