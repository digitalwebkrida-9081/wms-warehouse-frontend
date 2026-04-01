type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  type: ToastType;
  message: string;
  title?: string;
  id: number;
}

type Listener = (notification: Notification) => void;

class NotificationState {
  private listeners: Listener[] = [];

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  showToast(type: ToastType, message: string, title?: string) {
    const notification: Notification = {
      type,
      message,
      title,
      id: Date.now()
    };
    this.listeners.forEach(l => l(notification));
  }
}

export const notificationState = new NotificationState();
