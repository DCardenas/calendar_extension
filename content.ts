import { DropZone } from './src/DropZone';
import { QueueManager } from './src/QueueManager';
import { setupDragAndDrop } from './src/drag_and_drop';
import { QueuePanel } from './src/queue_panel/QueuePanel';
import { TaskItem } from './src/task/TaskItem';
import { Toast } from './src/toast/Toast';

function injectUi() {
  const queueManager = new QueueManager();
  const dropZone = new DropZone();
  const toast = new Toast();
  new QueuePanel({ toast, queueManager });

  setupDragAndDrop(dropZone, queueManager);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    injectUi();
  });
} else {
  injectUi();
}
