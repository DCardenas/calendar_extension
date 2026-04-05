import { Signal } from './signal/Signal';
import { Task, TaskStatus } from './task/Task';

export class QueueManager {
  private tasks: Task[] = [];
  private isProcessing: boolean = false;
  public needsSync: boolean = false;

  readonly newTasksSignal = new Signal<Task>();
  readonly syncSignal = new Signal<boolean>();
  readonly tasksUpdatedSignal = new Signal<Task[]>();

  addFiles(files: FileList | File[]) {
    const newTasks: Task[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.name.endsWith('.ics')) continue;

      const task = new Task(file);

      this.tasks.push(task);
      newTasks.push(task);
    }

    if (newTasks.length > 0) {
      newTasks.forEach((task) => this.newTasksSignal.emit(task));
      this.processNext();
    }
  }

  clearCompletedTasks() {
    this.tasks = this.tasks.filter((task) => {
      if (
        task.status === TaskStatus.SUCCESS ||
        task.status === TaskStatus.ERROR
      ) {
        task.remove();
        return false;
      }
      return true;
    });

    this.tasksUpdatedSignal.emit(this.tasks);
  }

  removeTask(taskId: string) {
    const index = this.tasks.findIndex((t) => t.id === taskId);
    if (index === -1) return;

    const task = this.tasks[index];
    if (
      task.status === TaskStatus.SUCCESS ||
      task.status === TaskStatus.ERROR
    ) {
      task.remove();
      this.tasks.splice(index, 1);
      this.tasksUpdatedSignal.emit(this.tasks);
    }
  }

  setNeedsSync(needsSync: boolean) {
    this.needsSync = needsSync;
    this.syncSignal.emit(this.needsSync);
  }

  private async processNext() {
    if (this.isProcessing) return;

    const nextTask = this.tasks.find((t) => t.status === TaskStatus.PENDING);
    if (!nextTask) return;

    this.isProcessing = true;
    await nextTask.process();
    this.isProcessing = false;

    this.processNext();
  }
}
