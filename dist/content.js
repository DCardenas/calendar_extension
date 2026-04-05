"use strict";
(() => {
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __esm = (fn, res) => function __init() {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  };
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };

  // src/DropZone.ts
  var DropZone, ID, INITIAL_HTML;
  var init_DropZone = __esm({
    "src/DropZone.ts"() {
      "use strict";
      DropZone = class {
        el;
        constructor() {
          const existing = document.getElementById(ID);
          if (existing) {
            this.el = existing;
            return;
          }
          this.el = this.createDropZone();
        }
        createDropZone() {
          const dropZone = document.createElement("div");
          dropZone.id = ID;
          dropZone.innerHTML = INITIAL_HTML;
          document.body.appendChild(dropZone);
          return dropZone;
        }
      };
      ID = "ics-drop-zone";
      INITIAL_HTML = `
            <div id="${ID}-content">
                <div id="${ID}-icon">\u{1F4C5}</div>
                <h1>Drop .ics files here</h1>
                <p>Support for multiple files and event batches</p>
            </div>
        `;
    }
  });

  // src/events.ts
  var UploadActionEvent;
  var init_events = __esm({
    "src/events.ts"() {
      "use strict";
      UploadActionEvent = class {
        constructor(events) {
          this.events = events;
        }
        events;
        static action = "UPLOAD_EVENTS";
      };
    }
  });

  // src/QueueManager.ts
  var QueueManager;
  var init_QueueManager = __esm({
    "src/QueueManager.ts"() {
      "use strict";
      init_events();
      QueueManager = class {
        tasks = [];
        isProcessing = false;
        needsSync = false;
        addFiles(files) {
          const newTasks = [];
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!file.name.endsWith(".ics")) continue;
            const task = {
              id: Math.random().toString(36).substr(2, 9),
              file,
              status: "pending" /* PENDING */,
              message: "Waiting..."
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
        clearCompletedTasks() {
          this.tasks = this.tasks.filter((task) => {
            if (task.status === "success" || task.status === "error") {
              if (task.element) {
                task.element.remove();
              }
              return false;
            }
            return true;
          });
          this.updateHeaderVisibility();
        }
        removeTask(taskId) {
          const index = this.tasks.findIndex((t) => t.id === taskId);
          if (index !== -1) {
            const task = this.tasks[index];
            if (task.status === "success" || task.status === "error") {
              if (task.element) {
                task.element.remove();
              }
              this.tasks.splice(index, 1);
              this.updateHeaderVisibility();
            }
          }
        }
        showRefreshButton() {
          this.needsSync = true;
          const btn = document.getElementById("ics-refresh-calendar");
          if (btn) {
            btn.classList.add("visible");
          }
        }
        updateHeaderVisibility() {
          const clearBtn = document.getElementById("ics-clear-completed");
          if (clearBtn) {
            const hasCompleted = this.tasks.some(
              (t) => t.status === "success" || t.status === "error"
            );
            clearBtn.style.display = hasCompleted ? "inline-block" : "none";
          }
        }
        async processNext() {
          if (this.isProcessing) return;
          const nextTask = this.tasks.find((t) => t.status === "pending");
          if (!nextTask) {
            return;
          }
          this.isProcessing = true;
          await this.runTask(nextTask);
          this.isProcessing = false;
          this.processNext();
        }
        async runTask(task) {
          this.updateTask(task, "processing" /* PROCESSING */, "Reading file...");
          try {
            const text = await this.readFile(task.file);
            const events = this.parseICS(text);
            if (events.length === 0) {
              throw new Error("No events found");
            }
            this.updateTask(
              task,
              "processing" /* PROCESSING */,
              `Uploading ${events.length} events...`
            );
            return new Promise((resolve) => {
              chrome.runtime.sendMessage(
                new UploadActionEvent(events),
                (response) => {
                  if (response?.options.success) {
                    this.updateTask(
                      task,
                      "success" /* SUCCESS */,
                      `Added ${events.length} events`
                    );
                    this.showRefreshButton();
                  } else {
                    this.updateTask(
                      task,
                      "error" /* ERROR */,
                      response?.options.error || "Upload failed"
                    );
                  }
                  resolve();
                }
              );
            });
          } catch (err) {
            this.updateTask(task, "error" /* ERROR */, err.message || "Failed");
          }
        }
        updateTask(task, status, message) {
          task.status = status;
          task.message = message;
          if (task.element) {
            const messageEl = task.element.querySelector(".task-message");
            const statusBtn = task.element.querySelector(
              ".task-status-btn"
            );
            if (messageEl) messageEl.textContent = message;
            if (statusBtn) {
              statusBtn.className = `task-status-btn ${status}`;
              statusBtn.disabled = status === "pending" || status === "processing";
            } else {
              const actionEl = task.element.querySelector(".task-action");
              if (actionEl) {
                const newBtn = document.createElement("button");
                newBtn.className = `task-status-btn ${status}`;
                newBtn.disabled = status === "pending" || status === "processing";
                newBtn.addEventListener("click", (e) => {
                  e.stopPropagation();
                  this.removeTask(task.id);
                });
                actionEl.innerHTML = "";
                actionEl.appendChild(newBtn);
              }
            }
            if (status === "success" || status === "error") {
              task.element.classList.add("completed");
            } else {
              task.element.classList.remove("completed");
            }
            this.updateHeaderVisibility();
          }
        }
        renderTask(task) {
          const container = document.getElementById("ics-queue-list");
          if (!container) return;
          const taskEl = document.createElement("div");
          taskEl.className = "ics-task-item";
          taskEl.innerHTML = `
            <div class="task-icon">\u{1F4C5}</div>
            <div class="task-details">
                <div class="task-name">${task.file.name}</div>
                <div class="task-message">${task.message}</div>
            </div>
            <div class="task-action">
                <button class="task-status-btn pending" title="Clear task" disabled></button>
            </div>
        `;
          task.element = taskEl;
          const statusBtn = taskEl.querySelector(".task-status-btn");
          statusBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            this.removeTask(task.id);
          });
          container.appendChild(taskEl);
        }
        showPanel() {
          const panel = document.getElementById("ics-queue-panel");
          if (panel) panel.classList.add("visible");
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
          const vevents = comp.getAllSubcomponents("vevent");
          const events = [];
          for (const vevent of vevents) {
            const event = new ICAL.Event(vevent);
            const calendarEvent = {
              summary: event.summary || "Untitled Event"
            };
            if (event.description) calendarEvent.description = event.description;
            if (event.location) calendarEvent.location = event.location;
            if (event.startDate.isDate) {
              const startStr = String(event.startDate).split("T")[0];
              const endStr = String(event.endDate).split("T")[0];
              calendarEvent.start = { date: startStr };
              calendarEvent.end = { date: endStr };
            } else {
              calendarEvent.start = {
                dateTime: event.startDate.toJSDate().toISOString()
              };
              calendarEvent.end = {
                dateTime: event.endDate.toJSDate().toISOString()
              };
            }
            events.push(calendarEvent);
          }
          return events;
        }
      };
    }
  });

  // src/drag_and_drop.ts
  function setupDragAndDrop(dropZone, queueManager) {
    let dragCounter = 0;
    window.addEventListener("dragenter", (e) => {
      e.preventDefault();
      dragCounter++;
      dropZone.el.classList.add("active");
    });
    window.addEventListener("dragleave", (e) => {
      e.preventDefault();
      dragCounter--;
      if (dragCounter === 0) {
        dropZone.el.classList.remove("active");
        dropZone.el.classList.remove("drag-over");
      }
    });
    window.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropZone.el.classList.add("drag-over");
    });
    window.addEventListener("drop", async (e) => {
      e.preventDefault();
      dragCounter = 0;
      dropZone.el.classList.remove("active");
      dropZone.el.classList.remove("drag-over");
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        queueManager.addFiles(files);
      }
    });
  }
  var init_drag_and_drop = __esm({
    "src/drag_and_drop.ts"() {
      "use strict";
    }
  });

  // src/queue_panel/HeaderMain.ts
  var HeaderMain, ClearButton, RefreshButton;
  var init_HeaderMain = __esm({
    "src/queue_panel/HeaderMain.ts"() {
      "use strict";
      HeaderMain = class {
        el;
        constructor({ queuePanel, toast }) {
          this.el = document.createElement("div");
          this.el.id = "header-main";
          this.el.classList.add("header-main");
          this.el.innerHTML = `<h3>Upload Queue</h3>`;
          this.addClearButton(queuePanel, toast);
          this.addRefreshButton();
        }
        addClearButton(queuePanel, toast) {
          const clearButton = new ClearButton({
            onclick: () => {
              this.el.classList.remove("visible");
              if (queuePanel.needsSync) {
                toast.show();
              }
            }
          });
          this.el.appendChild(clearButton.el);
        }
        addRefreshButton() {
          const refreshButton = new RefreshButton();
          refreshButton.el.addEventListener("click", () => {
            window.location.reload();
          });
          this.el.appendChild(refreshButton.el);
        }
      };
      ClearButton = class {
        el;
        constructor({ onclick }) {
          this.el = document.createElement("button");
          this.el.id = "ics-clear-completed";
          this.el.textContent = "Clear";
          this.el.title = "Clear completed tasks";
          this.el.style.display = "none";
          this.el.addEventListener("click", onclick);
        }
      };
      RefreshButton = class {
        el;
        constructor() {
          this.el = document.createElement("button");
          this.el.id = "ics-refresh-calendar";
          this.el.textContent = "Sync";
          this.el.title = "Refresh page to see new events";
        }
      };
    }
  });

  // src/queue_panel/Header.ts
  var Header, CloseButton;
  var init_Header = __esm({
    "src/queue_panel/Header.ts"() {
      "use strict";
      init_HeaderMain();
      Header = class {
        el;
        constructor({ queuePanel, toast }) {
          this.el = document.createElement("div");
          this.el.id = "ics-queue-header";
          this.el.classList.add("queue-header");
          const headerMain = new HeaderMain({ queuePanel, toast });
          this.el.appendChild(headerMain.el);
          const closeButton = new CloseButton();
          this.el.appendChild(closeButton.el);
          closeButton.el.addEventListener("click", () => {
            this.el.classList.remove("visible");
          });
        }
      };
      CloseButton = class {
        el;
        constructor() {
          this.el = document.createElement("button");
          this.el.id = "ics-queue-close";
          this.el.textContent = "\xD7";
        }
      };
    }
  });

  // src/queue_panel/QueuePanel.ts
  var QueuePanel, ID2;
  var init_QueuePanel = __esm({
    "src/queue_panel/QueuePanel.ts"() {
      "use strict";
      init_Header();
      QueuePanel = class {
        el;
        _needsSync = false;
        constructor({ toast }) {
          const existing = document.getElementById(ID2);
          if (existing) {
            this.el = existing;
            return;
          }
          this.el = this.createQueuePanel({ toast });
        }
        get needsSync() {
          return this.needsSync;
        }
        createQueuePanel({ toast }) {
          const queuePanel = document.createElement("div");
          queuePanel.id = ID2;
          document.body.appendChild(queuePanel);
          const header = new Header({ queuePanel: this, toast });
          queuePanel.appendChild(header.el);
          const queueList = document.createElement("div");
          queueList.id = "ics-queue-list";
          queuePanel.appendChild(queueList);
          return queuePanel;
        }
      };
      ID2 = "ics-queue-panel";
    }
  });

  // src/toast/Toast.ts
  var Toast, SyncActions, SyncNowButton, SyncDismissButton, ID3, INITIAL_HTML2;
  var init_Toast = __esm({
    "src/toast/Toast.ts"() {
      "use strict";
      Toast = class {
        el;
        constructor() {
          const existing = document.getElementById(ID3);
          if (existing) {
            this.el = existing;
            return;
          }
          this.el = this.createToast();
        }
        createToast() {
          const toast = document.createElement("div");
          toast.id = ID3;
          toast.innerHTML = INITIAL_HTML2;
          toast.classList.add("sync-content");
          document.body.appendChild(toast);
          const syncActions = new SyncActions({ toast: this });
          toast.appendChild(syncActions.el);
          return toast;
        }
        show() {
          this.el.classList.add("visible");
          setTimeout(() => {
            this.el.classList.remove("visible");
          }, 3e3);
        }
        hide() {
          this.el.classList.remove("visible");
        }
      };
      SyncActions = class {
        el;
        constructor({ toast }) {
          this.el = document.createElement("div");
          this.el.id = "sync-actions";
          this.el.appendChild(new SyncNowButton().el);
          this.el.appendChild(new SyncDismissButton({ toast }).el);
        }
      };
      SyncNowButton = class {
        el;
        constructor() {
          this.el = document.createElement("button");
          this.el.id = "ics-sync-now";
          this.el.textContent = "Sync Now";
          this.el.addEventListener("click", () => {
            window.location.reload();
          });
        }
      };
      SyncDismissButton = class {
        el;
        constructor({ toast }) {
          this.el = document.createElement("button");
          this.el.id = "ics-sync-dismiss";
          this.el.textContent = "Dismiss";
          this.el.addEventListener("click", () => {
            toast.hide();
          });
        }
      };
      ID3 = "ics-sync-toast";
      INITIAL_HTML2 = `
  <span class="sync-icon">\u{1F514}</span>
  <span class="sync-message">Sync required to see your new events.</span>
`;
    }
  });

  // content.ts
  var require_content = __commonJS({
    "content.ts"() {
      init_DropZone();
      init_QueueManager();
      init_drag_and_drop();
      init_QueuePanel();
      init_Toast();
      function injectUi() {
        const queueManager = new QueueManager();
        const dropZone = new DropZone();
        const toast = new Toast();
        new QueuePanel({ toast });
        setupDragAndDrop(dropZone, queueManager);
      }
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
          injectUi();
        });
      } else {
        injectUi();
      }
    }
  });
  require_content();
})();
