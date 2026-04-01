type Listener = (isLoading: boolean) => void;

class LoadingState {
  private listeners: Listener[] = [];
  private loadingCount = 0;

  subscribe(listener: Listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  setIsLoading(isLoading: boolean) {
    if (isLoading) this.loadingCount++;
    else this.loadingCount = Math.max(0, this.loadingCount - 1);
    
    const isGlobalLoading = this.loadingCount > 0;
    this.listeners.forEach(l => l(isGlobalLoading));
  }
}

export const loadingState = new LoadingState();
