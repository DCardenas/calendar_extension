export class DropZone {
  readonly el: HTMLDivElement;

  constructor() {
    const existing = document.getElementById(ID);
    if (existing) {
      this.el = existing as HTMLDivElement;
      return;
    }

    this.el = this.createDropZone();
  }

  private createDropZone(): HTMLDivElement {
    const dropZone = document.createElement('div');
    dropZone.id = ID;
    dropZone.innerHTML = INITIAL_HTML;
    document.body.appendChild(dropZone);

    return dropZone;
  }
}

const ID = 'ics-drop-zone';
const INITIAL_HTML = `
            <div id="${ID}-content">
                <div id="${ID}-icon">📅</div>
                <h1>Drop .ics files here</h1>
                <p>Support for multiple files and event batches</p>
            </div>
        `;
