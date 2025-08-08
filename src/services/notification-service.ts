import { KidsSchoolPlan, KidsDailyPlan } from '@/api/generate-kids-meal-plan';

export interface NotificationPreferences {
  enabled: boolean;
  breakfast_reminder: boolean;
  lunch_prep_reminder: boolean;
  snack_reminder: boolean;
  breakfast_time: string; // "07:00"
  lunch_prep_time: string; // "22:00" (night before)
  snack_time: string; // "15:30"
  weekend_notifications: boolean;
}

export interface ScheduledNotification {
  id: string;
  kid_id: string;
  plan_id: string;
  type: 'breakfast' | 'lunch_prep' | 'snack';
  title: string;
  body: string;
  scheduled_time: string;
  meal_data: any;
  is_sent: boolean;
  created_at: string;
}

class NotificationService {
  private static instance: NotificationService;
  private registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (this.registrationPromise) {
      return this.registrationPromise;
    }

    this.registrationPromise = (async () => {
      if (!('serviceWorker' in navigator)) {
        console.warn('Service Worker not supported');
        return null;
      }

      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    })();

    return this.registrationPromise;
  }

  async scheduleKidsSchoolPlanNotifications(
    plan: KidsSchoolPlan,
    kidName: string,
    preferences: NotificationPreferences
  ): Promise<ScheduledNotification[]> {
    if (!preferences.enabled) {
      return [];
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Notification permission denied');
    }

    const registration = await this.registerServiceWorker();
    if (!registration) {
      throw new Error('Service Worker not available');
    }

    const notifications: ScheduledNotification[] = [];
    const today = new Date();

    for (const dailyPlan of plan.daily_plans) {
      const planDate = new Date(dailyPlan.date);
      
      // Skip past dates
      if (planDate < today) continue;

      // Skip weekends if disabled
      const dayOfWeek = planDate.getDay();
      if (!preferences.weekend_notifications && (dayOfWeek === 0 || dayOfWeek === 6)) {
        continue;
      }

      // Breakfast reminder
      if (preferences.breakfast_reminder) {
        const breakfastTime = new Date(planDate);
        const [hours, minutes] = preferences.breakfast_time.split(':');
        breakfastTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const breakfastNotification: ScheduledNotification = {
          id: `breakfast-${plan.id}-${dailyPlan.day}`,
          kid_id: plan.kid_id,
          plan_id: plan.id,
          type: 'breakfast',
          title: `🌅 Breakfast Time for ${kidName}!`,
          body: `Today's breakfast: ${dailyPlan.breakfast.name} ${dailyPlan.breakfast.emoji}`,
          scheduled_time: breakfastTime.toISOString(),
          meal_data: dailyPlan.breakfast,
          is_sent: false,
          created_at: new Date().toISOString()
        };

        notifications.push(breakfastNotification);
        await this.scheduleNotification(breakfastNotification, registration);
      }

      // Lunch prep reminder (night before)
      if (preferences.lunch_prep_reminder) {
        const lunchPrepTime = new Date(planDate);
        lunchPrepTime.setDate(lunchPrepTime.getDate() - 1); // Night before
        const [hours, minutes] = preferences.lunch_prep_time.split(':');
        lunchPrepTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        // Only schedule if it's in the future
        if (lunchPrepTime > new Date()) {
          const lunchPrepNotification: ScheduledNotification = {
            id: `lunch-prep-${plan.id}-${dailyPlan.day}`,
            kid_id: plan.kid_id,
            plan_id: plan.id,
            type: 'lunch_prep',
            title: `🥪 Prepare ${kidName}'s Lunch Tonight!`,
            body: `Tomorrow's lunch: ${dailyPlan.lunch.name} ${dailyPlan.lunch.emoji} (${dailyPlan.lunch.prep_time})`,
            scheduled_time: lunchPrepTime.toISOString(),
            meal_data: dailyPlan.lunch,
            is_sent: false,
            created_at: new Date().toISOString()
          };

          notifications.push(lunchPrepNotification);
          await this.scheduleNotification(lunchPrepNotification, registration);
        }
      }

      // Snack reminder
      if (preferences.snack_reminder) {
        const snackTime = new Date(planDate);
        const [hours, minutes] = preferences.snack_time.split(':');
        snackTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

        const snackNotification: ScheduledNotification = {
          id: `snack-${plan.id}-${dailyPlan.day}`,
          kid_id: plan.kid_id,
          plan_id: plan.id,
          type: 'snack',
          title: `🍎 Snack Time for ${kidName}!`,
          body: `After-school snack: ${dailyPlan.snack.name} ${dailyPlan.snack.emoji}`,
          scheduled_time: snackTime.toISOString(),
          meal_data: dailyPlan.snack,
          is_sent: false,
          created_at: new Date().toISOString()
        };

        notifications.push(snackNotification);
        await this.scheduleNotification(snackNotification, registration);
      }
    }

    // Store notifications in localStorage for tracking
    this.storeNotifications(notifications);

    return notifications;
  }

  private async scheduleNotification(
    notification: ScheduledNotification,
    registration: ServiceWorkerRegistration
  ): Promise<void> {
    const scheduledTime = new Date(notification.scheduled_time);
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      console.warn('Cannot schedule notification in the past:', notification.title);
      return;
    }

    // For immediate testing, you can use setTimeout
    // In production, you'd want to use a more robust scheduling system
    setTimeout(async () => {
      try {
        await registration.showNotification(notification.title, {
          body: notification.body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: notification.id,
          data: {
            notificationId: notification.id,
            mealData: notification.meal_data,
            type: notification.type
          },
          actions: [
            {
              action: 'view',
              title: 'View Recipe',
              icon: '/icons/view.png'
            },
            {
              action: 'dismiss',
              title: 'Dismiss',
              icon: '/icons/dismiss.png'
            }
          ],
          requireInteraction: false,
          silent: false
        });

        // Mark as sent
        this.markNotificationAsSent(notification.id);
      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    }, delay);
  }

  private storeNotifications(notifications: ScheduledNotification[]): void {
    try {
      const existingNotifications = this.getStoredNotifications();
      const allNotifications = [...existingNotifications, ...notifications];
      localStorage.setItem('kids_meal_notifications', JSON.stringify(allNotifications));
    } catch (error) {
      console.error('Failed to store notifications:', error);
    }
  }

  private getStoredNotifications(): ScheduledNotification[] {
    try {
      const stored = localStorage.getItem('kids_meal_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored notifications:', error);
      return [];
    }
  }

  private markNotificationAsSent(notificationId: string): void {
    try {
      const notifications = this.getStoredNotifications();
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, is_sent: true } : n
      );
      localStorage.setItem('kids_meal_notifications', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to mark notification as sent:', error);
    }
  }

  async cancelPlanNotifications(planId: string): Promise<void> {
    try {
      const registration = await this.registerServiceWorker();
      if (!registration) return;

      // Get all notifications and cancel those for this plan
      const notifications = await registration.getNotifications();
      for (const notification of notifications) {
        if (notification.data?.planId === planId) {
          notification.close();
        }
      }

      // Remove from stored notifications
      const storedNotifications = this.getStoredNotifications();
      const filtered = storedNotifications.filter(n => n.plan_id !== planId);
      localStorage.setItem('kids_meal_notifications', JSON.stringify(filtered));
    } catch (error) {
      console.error('Failed to cancel plan notifications:', error);
    }
  }

  getUpcomingNotifications(kidId?: string): ScheduledNotification[] {
    const notifications = this.getStoredNotifications();
    const now = new Date();
    
    return notifications
      .filter(n => {
        const scheduledTime = new Date(n.scheduled_time);
        const isUpcoming = scheduledTime > now && !n.is_sent;
        const matchesKid = !kidId || n.kid_id === kidId;
        return isUpcoming && matchesKid;
      })
      .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());
  }

  async testNotification(kidName: string): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Notification permission denied');
    }

    const registration = await this.registerServiceWorker();
    if (!registration) {
      throw new Error('Service Worker not available');
    }

    await registration.showNotification(`🍎 Test Notification for ${kidName}!`, {
      body: 'This is a test notification for the Kids Meal Planner',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test-notification',
      requireInteraction: false
    });
  }
}

export const notificationService = NotificationService.getInstance();