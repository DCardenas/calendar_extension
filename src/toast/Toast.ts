export class Toast {
  private readonly el: HTMLDivElement;

  constructor() {
    const existing = document.getElementById(ID);
    if (existing) {
      this.el = existing as HTMLDivElement;
      return;
    }

    this.el = this.createToast();
  }

  private createToast(): HTMLDivElement {
    const toast = document.createElement('div');
    toast.id = ID;
    toast.innerHTML = INITIAL_HTML;
    toast.classList.add('sync-content');
    document.body.appendChild(toast);

    const syncActions = new SyncActions({ toast: this });
    toast.appendChild(syncActions.el);

    return toast;
  }

  show() {
    this.el.classList.add('visible');
  }

  hide() {
    this.el.classList.remove('visible');
  }
}

class SyncActions {
  readonly el: HTMLDivElement;

  constructor({ toast }: { toast: Toast }) {
    this.el = document.createElement('div');
    this.el.id = 'sync-actions';
    this.el.appendChild(new SyncNowButton().el);
    this.el.appendChild(new SyncDismissButton({ toast }).el);
  }
}

class SyncNowButton {
  readonly el: HTMLButtonElement;

  constructor() {
    this.el = document.createElement('button');
    this.el.id = 'ics-sync-now';
    this.el.textContent = 'Sync Now';

    this.el.addEventListener('click', () => {
      window.location.reload();
    });
  }
}

class SyncDismissButton {
  readonly el: HTMLButtonElement;

  constructor({ toast }: { toast: Toast }) {
    this.el = document.createElement('button');
    this.el.id = 'ics-sync-dismiss';
    this.el.textContent = 'Dismiss';

    this.el.addEventListener('click', () => {
      toast.hide();
    });
  }
}

const ID = 'ics-sync-toast';
const INITIAL_HTML = `
  <span class="sync-icon">🔔</span>
  <span class="sync-message">Sync required to see your new events.</span>
`;
