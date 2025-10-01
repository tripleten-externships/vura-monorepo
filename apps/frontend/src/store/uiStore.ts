import { makeAutoObservable } from 'mobx';
import type { RootStore } from './rootStore';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 means permanent
  timestamp: number;
}

export interface LoadingState {
  [key: string]: boolean;
}

/**
 * UI Store manages client-side application state that doesn't belong to server data
 * This includes loading states, notifications, modal states, form states, etc.
 * Works in conjunction with Apollo Client for server state management
 */
export class UIStore {
  // Loading states for different operations
  loadingStates: LoadingState = {};

  // Global loading state
  isGlobalLoading = false;

  // Notifications system
  notifications: Notification[] = [];

  // Modal and overlay states
  isModalOpen = false;
  modalContent: string | null = null;

  // Navigation and routing state
  currentPage: string = '';
  navigationHistory: string[] = [];

  // Form states
  isDirty = false;
  formErrors: Record<string, string> = {};

  // Theme and UI preferences
  theme: 'light' | 'dark' | 'system' = 'system';
  sidebarCollapsed = false;

  // Network and connectivity
  isOnline = navigator.onLine;
  lastSyncTime: number | null = null;

  protected rootStore: RootStore;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);

    // Set up online/offline listeners
    this.setupConnectivityListeners();
  }

  /**
   * Get Apollo Client instance
   */
  protected get apolloClient() {
    return this.rootStore.apolloClient;
  }

  // Loading States Management
  setLoading(key: string, isLoading: boolean) {
    this.loadingStates[key] = isLoading;
  }

  isLoading(key: string): boolean {
    return this.loadingStates[key] || false;
  }

  setGlobalLoading(isLoading: boolean) {
    this.isGlobalLoading = isLoading;
  }

  // Notifications Management
  addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const newNotification: Notification = {
      ...notification,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      duration: notification.duration ?? 5000, // Default 5 seconds
    };

    this.notifications.push(newNotification);

    // Auto-remove notification after duration (if not permanent)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, newNotification.duration);
    }
  }

  removeNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
  }

  clearAllNotifications() {
    this.notifications = [];
  }

  // Convenience methods for different notification types
  showSuccess(title: string, message?: string, duration?: number) {
    this.addNotification({ type: 'success', title, message, duration });
  }

  showError(title: string, message?: string, duration?: number) {
    this.addNotification({ type: 'error', title, message, duration: duration ?? 0 }); // Errors are permanent by default
  }

  showWarning(title: string, message?: string, duration?: number) {
    this.addNotification({ type: 'warning', title, message, duration });
  }

  showInfo(title: string, message?: string, duration?: number) {
    this.addNotification({ type: 'info', title, message, duration });
  }

  // Modal Management
  openModal(content?: string) {
    this.isModalOpen = true;
    this.modalContent = content || null;
  }

  closeModal() {
    this.isModalOpen = false;
    this.modalContent = null;
  }

  // Navigation Management
  setCurrentPage(page: string) {
    if (this.currentPage !== page) {
      this.navigationHistory.push(this.currentPage);
      this.currentPage = page;
    }
  }

  goBack() {
    if (this.navigationHistory.length > 0) {
      this.currentPage = this.navigationHistory.pop() || '';
    }
  }

  // Form State Management
  setFormDirty(isDirty: boolean) {
    this.isDirty = isDirty;
  }

  setFormError(field: string, error: string) {
    this.formErrors[field] = error;
  }

  clearFormError(field: string) {
    delete this.formErrors[field];
  }

  clearAllFormErrors() {
    this.formErrors = {};
  }

  hasFormErrors(): boolean {
    return Object.keys(this.formErrors).length > 0;
  }

  // Theme Management
  setTheme(theme: 'light' | 'dark' | 'system') {
    this.theme = theme;
    // Persist to localStorage
    localStorage.setItem('theme', theme);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
    // Persist to localStorage
    localStorage.setItem('sidebarCollapsed', String(this.sidebarCollapsed));
  }

  // Network Status
  setOnlineStatus(isOnline: boolean) {
    this.isOnline = isOnline;
    if (isOnline) {
      this.lastSyncTime = Date.now();
    }
  }

  // Helper method to combine with Apollo Client loading states
  isAnyLoading(): boolean {
    return this.isGlobalLoading || Object.values(this.loadingStates).some((loading) => loading);
  }

  // Private Methods
  private setupConnectivityListeners() {
    const handleOnline = () => this.setOnlineStatus(true);
    const handleOffline = () => this.setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup will be handled by the component using this store
  }

  // Initialize store with persisted data
  initializeFromStorage() {
    // Load theme preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    if (savedTheme) {
      this.theme = savedTheme;
    }

    // Load sidebar state
    const savedSidebarState = localStorage.getItem('sidebarCollapsed');
    if (savedSidebarState !== null) {
      this.sidebarCollapsed = savedSidebarState === 'true';
    }
  }

  // Reset store to initial state
  reset() {
    this.loadingStates = {};
    this.isGlobalLoading = false;
    this.notifications = [];
    this.isModalOpen = false;
    this.modalContent = null;
    this.currentPage = '';
    this.navigationHistory = [];
    this.isDirty = false;
    this.formErrors = {};
    this.lastSyncTime = null;
    // Note: We don't reset theme and sidebar preferences as they are user preferences
  }
}

// UIStore will be initialized directly in RootStore constructor
