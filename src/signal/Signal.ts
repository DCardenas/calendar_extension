export class Signal<T = void> {
  private listeners: ((value: T) => void)[] = [];

  attach(listener: (value: T) => void) {
    this.listeners.push(listener);
  }

  detach(listener: (value: T) => void) {
    this.listeners = this.listeners.filter((l) => l !== listener);
  }

  emit(value: T) {
    this.listeners.forEach((listener) => listener(value));
  }
}
