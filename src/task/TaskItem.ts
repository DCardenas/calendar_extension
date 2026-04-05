import { Task, TaskStatus } from './Task';

export class TaskItem {
  readonly el: HTMLDivElement;

  constructor({ task, removeTask }: { task: Task; removeTask: () => void }) {
    this.el = document.createElement('div');
    this.el.className = ID;
    this.el.innerHTML = HTML_TEMPLATE(task);

    task.taskStatusChanged.attach(({ status, message }) => {
      this.updateStatus(status, message);
    });

    task.taskRemoved.attach(() => {
      this.el.remove();
    });

    const taskActionDiv = this.el.querySelector('.task-action');
    if (!taskActionDiv) {
      throw new Error('Task action div not found');
    }

    const removeTaskButton = new RemoveTaskButton({ removeTask });
    taskActionDiv.appendChild(removeTaskButton.el);
  }

  private updateStatus(status: TaskStatus, message: string) {
    const messageEl = this.el.querySelector('.task-message');
    const statusBtn = this.el.querySelector(
      '.task-status-btn',
    ) as HTMLButtonElement;

    if (messageEl) messageEl.textContent = message;

    if (statusBtn) {
      statusBtn.className = `task-status-btn ${status}`;
      statusBtn.disabled = status === 'pending' || status === 'processing';
    }

    if (status === 'success' || status === 'error') {
      this.el.classList.add('completed');
    } else {
      this.el.classList.remove('completed');
    }
  }
}

class RemoveTaskButton {
  readonly el: HTMLButtonElement;

  constructor({ removeTask }: { removeTask: () => void }) {
    this.el = document.createElement('button');
    this.el.className = 'task-status-btn pending';
    this.el.title = 'Clear task';
    this.el.disabled = true;

    this.el.addEventListener('click', (e) => {
      e.stopPropagation();
      removeTask();
    });
  }
}

const ID = 'ics-task-item';
const HTML_TEMPLATE = (task: Task) => `
    <div class="task-icon">📅</div>
    <div class="task-details">
        <div class="task-name">${task.file.name}</div>
        <div class="task-message">Waiting...</div>
    </div>
    <div class="task-action"></div>
`;
