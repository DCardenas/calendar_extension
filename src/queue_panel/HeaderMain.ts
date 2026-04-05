import { QueueManager, TaskStatus } from '../QueueManager';

export class HeaderMain {
  readonly el: HTMLDivElement;

  constructor({ queueManager }: { queueManager: QueueManager }) {
    this.el = document.createElement('div');
    this.el.id = 'header-main';
    this.el.classList.add('header-main');
    this.el.innerHTML = `<h3>Upload Queue</h3>`;

    this.addClearButton({ queueManager });
    this.addRefreshButton({ queueManager });
  }

  private addClearButton({ queueManager }: { queueManager: QueueManager }) {
    const clearButton = new ClearButton({
      onclick: () => {
        this.el.classList.remove('visible');
      },
      queueManager,
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

  constructor({
    onclick,
    queueManager,
  }: {
    onclick: () => void;
    queueManager: QueueManager;
  }) {
    this.el = document.createElement('button');
    this.el.id = 'ics-clear-completed';
    this.el.textContent = 'Clear';
    this.el.title = 'Clear completed tasks';
    this.el.style.display = 'none';
    this.el.addEventListener('click', onclick);

    queueManager.tasksUpdatedSignal.attach((tasks) => {
      this.el.style.display = tasks.some(
        (task) =>
          task.status === TaskStatus.SUCCESS ||
          task.status === TaskStatus.ERROR,
      )
        ? 'inline-block'
        : 'none';
    });
  }
}

class RefreshButton {
  readonly el: HTMLButtonElement;

  constructor({ queueManager }: { queueManager: QueueManager }) {
    this.el = document.createElement('button');
    this.el.id = 'ics-refresh-calendar';
    this.el.textContent = 'Sync';
    this.el.title = 'Refresh page to see new events';

    queueManager.syncSignal.attach((needsSync) => {
      needsSync
        ? this.el.classList.add('visible')
        : this.el.classList.remove('visible');
    });
  }
}
