import { DropZone } from './DropZone';
import { QueueManager } from './QueueManager';

export function setupDragAndDrop(
  dropZone: DropZone,
  queueManager: QueueManager,
) {
  let dragCounter = 0;

  window.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter++;
    dropZone.el.classList.add('active');
  });

  window.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter === 0) {
      dropZone.el.classList.remove('active');
      dropZone.el.classList.remove('drag-over');
    }
  });

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.el.classList.add('drag-over');
  });

  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropZone.el.classList.remove('active');
    dropZone.el.classList.remove('drag-over');

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      queueManager.processFiles(files);
    }
  });
}
