import { QueueManager } from '../QueueManager';
import { TaskItem } from '../task/TaskItem';
import { Toast } from '../toast/Toast';
import { Header } from './Header';

export class QueuePanel {
  readonly el: HTMLDivElement;

  constructor({
    toast,
    queueManager,
  }: {
    toast: Toast;
    queueManager: QueueManager;
  }) {
    this.el = this.createQueuePanel({ toast, queueManager });

    const queueList = document.createElement('div');
    queueList.id = 'ics-queue-list';
    this.el.appendChild(queueList);

    queueManager.newTasksSignal.attach((task) => {
      const taskView = new TaskItem({
        task,
        removeTask: () => queueManager.removeTask(task.id),
      });
      queueList.appendChild(taskView.el);
      this.show();
    });
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

    return queuePanel;
  }
}

const ID = 'ics-queue-panel';
