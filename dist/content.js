"use strict";
class QueueManager {
    tasks = [];
    isProcessing = false;
    addFiles(files) {
        const newTasks = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.name.endsWith('.ics'))
                continue;
            const task = {
                id: Math.random().toString(36).substr(2, 9),
                file,
                status: 'pending',
                message: 'Waiting...',
            };
            this.tasks.push(task);
            newTasks.push(task);
            this.renderTask(task);
        }
        if (newTasks.length > 0) {
            this.showPanel();
            this.processNext();
        }
    }
    async processNext() {
        if (this.isProcessing)
            return;
        const nextTask = this.tasks.find((t) => t.status === 'pending');
        if (!nextTask) {
            // Check if all are done to potentially hide panel after a delay
            return;
        }
        this.isProcessing = true;
        await this.runTask(nextTask);
        this.isProcessing = false;
        this.processNext();
    }
    async runTask(task) {
        this.updateTask(task, 'processing', 'Reading file...');
        try {
            const text = await this.readFile(task.file);
            const events = this.parseICS(text);
            if (events.length === 0) {
                throw new Error('No events found');
            }
            this.updateTask(task, 'processing', `Uploading ${events.length} events...`);
            return new Promise((resolve) => {
                chrome.runtime.sendMessage({ action: 'UPLOAD_EVENTS', events }, (response) => {
                    if (response?.success) {
                        this.updateTask(task, 'success', `Added ${events.length} events`);
                    }
                    else {
                        this.updateTask(task, 'error', response?.error || 'Upload failed');
                    }
                    resolve();
                });
            });
        }
        catch (err) {
            this.updateTask(task, 'error', err.message || 'Failed');
        }
    }
    updateTask(task, status, message) {
        task.status = status;
        task.message = message;
        if (task.element) {
            const statusEl = task.element.querySelector('.task-status');
            const messageEl = task.element.querySelector('.task-message');
            if (statusEl)
                statusEl.className = `task-status ${status}`;
            if (messageEl)
                messageEl.textContent = message;
            if (status === 'success' || status === 'error') {
                task.element.classList.add('completed');
            }
        }
    }
    renderTask(task) {
        const container = document.getElementById('ics-queue-list');
        if (!container)
            return;
        const taskEl = document.createElement('div');
        taskEl.className = 'ics-task-item';
        taskEl.innerHTML = `
            <div class="task-icon">📅</div>
            <div class="task-details">
                <div class="task-name">${task.file.name}</div>
                <div class="task-message">${task.message}</div>
            </div>
            <div class="task-status pending"></div>
        `;
        task.element = taskEl;
        container.appendChild(taskEl);
    }
    showPanel() {
        const panel = document.getElementById('ics-queue-panel');
        if (panel)
            panel.classList.add('visible');
    }
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }
    parseICS(icsData) {
        const jcalData = ICAL.parse(icsData);
        const comp = new ICAL.Component(jcalData);
        const vevents = comp.getAllSubcomponents('vevent');
        const events = [];
        for (const vevent of vevents) {
            const event = new ICAL.Event(vevent);
            const calendarEvent = {
                summary: event.summary || 'Untitled Event',
            };
            if (event.description)
                calendarEvent.description = event.description;
            if (event.location)
                calendarEvent.location = event.location;
            if (event.startDate.isDate) {
                const startStr = String(event.startDate).split('T')[0];
                const endStr = String(event.endDate).split('T')[0];
                calendarEvent.start = { date: startStr };
                calendarEvent.end = { date: endStr };
            }
            else {
                calendarEvent.start = {
                    dateTime: event.startDate.toJSDate().toISOString(),
                };
                calendarEvent.end = {
                    dateTime: event.endDate.toJSDate().toISOString(),
                };
            }
            events.push(calendarEvent);
        }
        return events;
    }
}
const queueManager = new QueueManager();
// 1. Inject DOM elements
function injectUI() {
    // Drop Zone
    if (!document.getElementById('ics-drop-zone')) {
        const dropZone = document.createElement('div');
        dropZone.id = 'ics-drop-zone';
        dropZone.innerHTML = `
            <div id="ics-drop-zone-content">
                <div id="ics-drop-zone-icon">📅</div>
                <h1>Drop .ics files here</h1>
                <p>Support for multiple files and event batches</p>
            </div>
        `;
        document.body.appendChild(dropZone);
    }
    // Queue Panel
    if (!document.getElementById('ics-queue-panel')) {
        const queuePanel = document.createElement('div');
        queuePanel.id = 'ics-queue-panel';
        queuePanel.innerHTML = `
            <div class="queue-header">
                <h3>Upload Queue</h3>
                <button id="ics-queue-close">×</button>
            </div>
            <div id="ics-queue-list"></div>
        `;
        document.body.appendChild(queuePanel);
        document
            .getElementById('ics-queue-close')
            ?.addEventListener('click', () => {
            queuePanel.classList.remove('visible');
        });
    }
    // Toast
    if (!document.getElementById('ics-toast')) {
        const toast = document.createElement('div');
        toast.id = 'ics-toast';
        document.body.appendChild(toast);
    }
}
function showToast(message, type = 'info') {
    const toast = document.getElementById('ics-toast');
    if (!toast)
        return;
    toast.textContent = message;
    toast.className = `show ${type}`;
    setTimeout(() => {
        toast.className = '';
    }, 4000);
}
// 2. Setup Drag and Drop Listeners
function setupDragAndDrop() {
    const dropZone = document.getElementById('ics-drop-zone');
    if (!dropZone)
        return;
    let dragCounter = 0;
    window.addEventListener('dragenter', (e) => {
        e.preventDefault();
        dragCounter++;
        dropZone.classList.add('active');
    });
    window.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dragCounter--;
        if (dragCounter === 0) {
            dropZone.classList.remove('active');
            dropZone.classList.remove('drag-over');
        }
    });
    window.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    window.addEventListener('drop', async (e) => {
        e.preventDefault();
        dragCounter = 0;
        dropZone.classList.remove('active');
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            queueManager.addFiles(files);
        }
    });
}
// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        injectUI();
        setupDragAndDrop();
    });
}
else {
    injectUI();
    setupDragAndDrop();
}
