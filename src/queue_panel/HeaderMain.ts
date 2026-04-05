import { QueuePanel } from './QueuePanel';
import { Toast } from '../toast/Toast';

export class HeaderMain {
  readonly el: HTMLDivElement;

  constructor({ queuePanel, toast }: { queuePanel: QueuePanel; toast: Toast }) {
    this.el = document.createElement('div');
    this.el.id = 'header-main';
    this.el.classList.add('header-main');
    this.el.innerHTML = `<h3>Upload Queue</h3>`;

    this.addClearButton(queuePanel, toast);
    this.addRefreshButton();
  }

  private addClearButton(queuePanel: QueuePanel, toast: Toast) {
    const clearButton = new ClearButton({
      onclick: () => {
        this.el.classList.remove('visible');
        if (queuePanel.needsSync) {
          toast.show();
        }
      },
    });
    this.el.appendChild(clearButton.el);
  }

  private addRefreshButton() {
    const refreshButton = new RefreshButton();
    refreshButton.el.addEventListener('click', () => {
      window.location.reload();
    });
    this.el.appendChild(refreshButton.el);
  }
}

class ClearButton {
  readonly el: HTMLButtonElement;

  constructor({ onclick }: { onclick: () => void }) {
    this.el = document.createElement('button');
    this.el.id = 'ics-clear-completed';
    this.el.textContent = 'Clear';
    this.el.title = 'Clear completed tasks';
    this.el.style.display = 'none';
    this.el.addEventListener('click', onclick);
  }
}

class RefreshButton {
  readonly el: HTMLButtonElement;

  constructor() {
    this.el = document.createElement('button');
    this.el.id = 'ics-refresh-calendar';
    this.el.textContent = 'Sync';
    this.el.title = 'Refresh page to see new events';
  }
}
