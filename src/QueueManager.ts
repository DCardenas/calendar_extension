import { CalendarEventData, UploadActionEvent, UploadResponse } from './events';
import { parseICS } from './ics/parse';
import { Signal } from './signal/Signal';

export class QueueManager {
  private tasks: QueueTask[] = [];
  private isProcessing: boolean = false;
  public needsSync: boolean = false;

  readonly newTasksSignal = new Signal();
  readonly syncSignal = new Signal<boolean>();
  readonly tasksUpdatedSignal = new Signal<QueueTask[]>();

  addFiles(files: FileList | File[]) {
    const newTasks: QueueTask[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.endsWith('.ics')) continue;

      const task: QueueTask = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: TaskStatus.PENDING,
        message: 'Waiting...',
      };
      this.tasks.push(task);
      newTasks.push(task);
      this.renderTask(task);
    }

    if (newTasks.length > 0) {
      this.newTasksSignal.emit();
      this.processNext();
    }
  }

  clearCompletedTasks() {
    this.tasks = this.tasks.filter((task) => {
      if (
        task.status === TaskStatus.SUCCESS ||
        task.status === TaskStatus.ERROR
      ) {
        if (task.element) {
          task.element.remove();
        }
        return false;
      }
      return true;
    });

    this.tasksUpdatedSignal.emit(this.tasks);
  }

  removeTask(taskId: string) {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index !== -1) {
      const task = this.tasks[index];
      if (
        task.status === TaskStatus.SUCCESS ||
        task.status === TaskStatus.ERROR
      ) {
        if (task.element) {
          task.element.remove();
        }
        this.tasks.splice(index, 1);
        this.tasksUpdatedSignal.emit(this.tasks);
      }
    }
  }

  setNeedsSync(needsSync: boolean) {
    this.needsSync = needsSync;
    this.syncSignal.emit(this.needsSync);
  }

  private async processNext() {
    if (this.isProcessing) return;

    const nextTask = this.tasks.find((t) => t.status === TaskStatus.PENDING);
    if (!nextTask) {
      // Check if all are done to potentially hide panel after a delay
      return;
    }

    this.isProcessing = true;
    await this.runTask(nextTask);
    this.isProcessing = false;

    this.processNext();
  }

  private async runTask(task: QueueTask) {
    this.updateTask(task, TaskStatus.PROCESSING, 'Reading file...');

    try {
      const text = await this.readFile(task.file);
      const events = parseICS(text);

      if (events.length === 0) {
        throw new Error('No events found');
      }

      this.updateTask(
        task,
        TaskStatus.PROCESSING,
        `Uploading ${events.length} events...`,
      );

      return new Promise<void>((resolve) => {
        chrome.runtime.sendMessage(
          new UploadActionEvent(events),
          (response?: UploadResponse) => {
            if (response?.options.success) {
              this.updateTask(
                task,
                TaskStatus.SUCCESS,
                `Added ${events.length} events`,
              );
            } else {
              this.updateTask(
                task,
                TaskStatus.ERROR,
                response?.options.error || 'Upload failed',
              );
            }
            resolve();
          },
        );
      });
    } catch (err: any) {
      this.updateTask(task, TaskStatus.ERROR, err.message || 'Failed');
    }
  }

  private updateTask(
    task: QueueTask,
    status: QueueTask['status'],
    message: string,
  ) {
    task.status = status;
    task.message = message;

    if (task.element) {
      const messageEl = task.element.querySelector('.task-message');
      const statusBtn = task.element.querySelector(
        '.task-status-btn',
      ) as HTMLButtonElement;

      if (messageEl) messageEl.textContent = message;

      if (statusBtn) {
        statusBtn.className = `task-status-btn ${status}`;
        statusBtn.disabled = status === 'pending' || status === 'processing';
      } else {
        // Ensure status button exists (handles unrefreshed pages)
        const actionEl = task.element.querySelector('.task-action');
        if (actionEl) {
          const newBtn = document.createElement('button');
          newBtn.className = `task-status-btn ${status}`;
          newBtn.disabled = status === 'pending' || status === 'processing';
          newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeTask(task.id);
          });
          actionEl.innerHTML = ''; // Clear old content if any
          actionEl.appendChild(newBtn);
        }
      }

      if (status === 'success' || status === 'error') {
        task.element.classList.add('completed');
      } else {
        task.element.classList.remove('completed');
      }
      this.tasksUpdatedSignal.emit(this.tasks);
    }
  }

  private renderTask(task: QueueTask) {
    const container = document.getElementById('ics-queue-list');
    if (!container) return;

    const taskEl = document.createElement('div');
    taskEl.className = 'ics-task-item';
    taskEl.innerHTML = `
            <div class="task-icon">📅</div>
            <div class="task-details">
                <div class="task-name">${task.file.name}</div>
                <div class="task-message">${task.message}</div>
            </div>
            <div class="task-action">
                <button class="task-status-btn pending" title="Clear task" disabled></button>
            </div>
        `;
    task.element = taskEl;

    const statusBtn = taskEl.querySelector('.task-status-btn');
    statusBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeTask(task.id);
    });

    container.appendChild(taskEl);
  }

  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
}

export enum TaskStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error',
}

interface QueueTask {
  id: string;
  file: File;
  status: TaskStatus;
  message: string;
  element?: HTMLElement;
}
