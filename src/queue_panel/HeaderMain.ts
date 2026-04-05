import { QueueManager } from '../QueueManager';

export class HeaderMain {
  readonly el: HTMLDivElement;

  constructor({ queueManager }: { queueManager: QueueManager }) {
    this.el = document.createElement('div');
    this.el.id = 'header-main';
    this.el.classList.add('header-main');
    this.el.innerHTML = `<h3>Upload Queue</h3>`;

    this.addClearButton();
    this.addRefreshButton({ queueManager });
  }

  private addClearButton() {
    const clearButton = new ClearButton({
      onclick: () => {
        this.el.classList.remove('visible');
      },
    });
    this.el.appendChild(clearButton.el);
  }

  private addRefreshButton({ queueManager }: { queueManager: QueueManager }) {
    const refreshButton = new RefreshButton({ queueManager });
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

  constructor({ queueManager }: { queueManager: QueueManager }) {
    this.el = document.createElement('button');
    this.el.id = 'ics-refresh-calendar';
    this.el.textContent = 'Sync';
    this.el.title = 'Refresh page to see new events';

    queueManager.addSyncListener((needsSync) => {
      needsSync
        ? this.el.classList.add('visible')
        : this.el.classList.remove('visible');
    });
  }
}
