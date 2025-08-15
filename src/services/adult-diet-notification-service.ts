import { supabase } from "@/integrations/supabase/client";

export interface AdultDietNotificationPreferences {
  enabled: boolean;
  daily_plan_enabled: boolean;
  meal_reminders_enabled: boolean;
  
  // Daily plan notification
  daily_plan_time: string; // "08:00" - when to send daily plan
  include_recipes_in_daily: boolean;
  
  // Meal reminder notifications (2 hours before each meal)
  breakfast_reminder: boolean;
  lunch_reminder: boolean;
  dinner_reminder: boolean;
  snack_reminder: boolean;
  
  // Meal timing (when you typically eat)
  breakfast_time: string; // "08:00"
  lunch_time: string; // "12:00"
  dinner_time: string; // "18:00"
  snack_time: string; // "15:00"
  
  // Notification content preferences
  include_recipes: boolean; // Include short recipe in notifications
  include_calories: boolean;
  include_prep_time: boolean;
  include_ingredients: boolean;
  
  // Advanced settings
  weekend_notifications: boolean;
  quiet_hours_start: string; // "22:00"
  quiet_hours_end: string; // "07:00"
}

export interface AdultDietScheduledNotification {
  id: string;
  user_id: string;
  plan_id: string;
  type: 'daily_plan' | 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  body: string;
  scheduled_time: string;
  meal_data?: any;
  day_data?: any; // For daily plan notifications
  is_sent: boolean;
  created_at: string;
}

class AdultDietNotificationService {
  private static instance: AdultDietNotificationService;
  private registrationPromise: Promise<ServiceWorkerRegistration | null> | null = null;
  private scheduledTimeouts: Map<string, NodeJS.Timeout> = new Map();

  private constructor() {}

  static getInstance(): AdultDietNotificationService {
    if (!AdultDietNotificationService.instance) {
      AdultDietNotificationService.instance = new AdultDietNotificationService();
    }
    return AdultDietNotificationService.instance;
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
      console.warn('Notification permission denied by user');
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
        console.log('✅ Service Worker registered successfully');
        return registration;
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
        return null;
      }
    })();

    return this.registrationPromise;
  }

  async scheduleAdultDietPlanNotifications(
    planData: any,
    userId: string,
    preferences: AdultDietNotificationPreferences
  ): Promise<AdultDietScheduledNotification[]> {
    console.log('📅 Scheduling adult diet plan notifications...');
    
    if (!preferences.enabled) {
      console.log('❌ Notifications disabled in preferences');
      return [];
    }

    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Notification permission denied. Please enable notifications in your browser settings.');
    }

    const registration = await this.registerServiceWorker();
    if (!registration) {
      throw new Error('Service Worker not available');
    }

    // Cancel existing notifications for this user
    await this.cancelUserNotifications(userId);

    const notifications: AdultDietScheduledNotification[] = [];
    const today = new Date();
    const dailyMeals = planData.dailyMeals || [];

    console.log(`📊 Processing ${dailyMeals.length} days of meal data`);

    for (let dayIndex = 0; dayIndex < dailyMeals.length; dayIndex++) {
      const dayPlan = dailyMeals[dayIndex];
      const planDate = new Date(today);
      planDate.setDate(today.getDate() + dayIndex);
      
      // Skip weekends if disabled
      const dayOfWeek = planDate.getDay();
      if (!preferences.weekend_notifications && (dayOfWeek === 0 || dayOfWeek === 6)) {
        console.log(`⏭️ Skipping weekend day: ${planDate.toDateString()}`);
        continue;
      }

      // Check quiet hours
      if (this.isInQuietHours(planDate, preferences)) {
        console.log(`🔇 Skipping day in quiet hours: ${planDate.toDateString()}`);
        continue;
      }

      // Schedule daily plan notification
      if (preferences.daily_plan_enabled) {
        const dailyNotification = await this.createDailyPlanNotification(
          dayPlan, planDate, userId, planData.id, preferences
        );
        if (dailyNotification) {
          notifications.push(dailyNotification);
          await this.scheduleNotification(dailyNotification, registration);
        }
      }

      // Schedule individual meal reminders
      if (preferences.meal_reminders_enabled) {
        const mealNotifications = await this.createMealReminderNotifications(
          dayPlan, planDate, userId, planData.id, preferences
        );
        notifications.push(...mealNotifications);
        
        for (const notification of mealNotifications) {
          await this.scheduleNotification(notification, registration);
        }
      }
    }

    // Store notifications in database and localStorage
    await this.storeNotifications(notifications);

    console.log(`✅ Scheduled ${notifications.length} notifications`);
    return notifications;
  }

  private async createDailyPlanNotification(
    dayPlan: any,
    planDate: Date,
    userId: string,
    planId: string,
    preferences: AdultDietNotificationPreferences
  ): Promise<AdultDietScheduledNotification | null> {
    const [hours, minutes] = preferences.daily_plan_time.split(':');
    const notificationTime = new Date(planDate);
    notificationTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Don't schedule past notifications
    if (notificationTime <= new Date()) {
      return null;
    }

    const meals = dayPlan.meals || [];
    const mealSummary = meals.map((meal: any) => `${meal.mealType}: ${meal.name}`).join('\n');
    
    let body = `📅 Today's meal plan:\n${mealSummary}`;
    
    if (preferences.include_recipes_in_daily && meals.length > 0) {
      const firstMeal = meals[0];
      if (firstMeal.instructions) {
        const shortInstructions = Array.isArray(firstMeal.instructions) 
          ? firstMeal.instructions[0] 
          : firstMeal.instructions;
        body += `\n\n🍳 ${firstMeal.name}: ${shortInstructions}`;
      }
    }

    return {
      id: `daily-${planId}-${dayPlan.day}`,
      user_id: userId,
      plan_id: planId,
      type: 'daily_plan',
      title: `🌟 Your Daily Meal Plan - Day ${dayPlan.day}`,
      body: body,
      scheduled_time: notificationTime.toISOString(),
      day_data: dayPlan,
      is_sent: false,
      created_at: new Date().toISOString()
    };
  }

  private async createMealReminderNotifications(
    dayPlan: any,
    planDate: Date,
    userId: string,
    planId: string,
    preferences: AdultDietNotificationPreferences
  ): Promise<AdultDietScheduledNotification[]> {
    const notifications: AdultDietScheduledNotification[] = [];
    const meals = dayPlan.meals || [];

    const mealTimes = {
      breakfast: preferences.breakfast_time,
      lunch: preferences.lunch_time,
      dinner: preferences.dinner_time,
      snack: preferences.snack_time
    };

    const mealEnabled = {
      breakfast: preferences.breakfast_reminder,
      lunch: preferences.lunch_reminder,
      dinner: preferences.dinner_reminder,
      snack: preferences.snack_reminder
    };

    for (const meal of meals) {
      const mealType = meal.mealType as keyof typeof mealTimes;
      
      if (!mealEnabled[mealType] || !mealTimes[mealType]) {
        continue;
      }

      const [hours, minutes] = mealTimes[mealType].split(':');
      const mealTime = new Date(planDate);
      mealTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      // Schedule notification 2 hours before meal time
      const notificationTime = new Date(mealTime.getTime() - (2 * 60 * 60 * 1000));

      // Don't schedule past notifications
      if (notificationTime <= new Date()) {
        continue;
      }

      const notification = this.createMealNotification(
        meal, mealType, notificationTime, userId, planId, dayPlan.day, preferences
      );

      notifications.push(notification);
    }

    return notifications;
  }

  private createMealNotification(
    meal: any,
    mealType: string,
    notificationTime: Date,
    userId: string,
    planId: string,
    day: number,
    preferences: AdultDietNotificationPreferences
  ): AdultDietScheduledNotification {
    const mealEmojis = {
      breakfast: '🌅',
      lunch: '🥗',
      dinner: '🍽️',
      snack: '🍎'
    };

    const emoji = mealEmojis[mealType as keyof typeof mealEmojis] || '🍽️';
    const title = `${emoji} ${mealType.charAt(0).toUpperCase() + mealType.slice(1)} in 2 hours!`;
    
    let body = `${meal.name}`;
    
    if (preferences.include_calories && meal.calories) {
      body += ` (${meal.calories} cal)`;
    }
    
    if (preferences.include_prep_time && meal.prep_time) {
      body += ` • ${meal.prep_time}`;
    }
    
    if (preferences.include_ingredients && meal.ingredients) {
      const ingredients = Array.isArray(meal.ingredients) 
        ? meal.ingredients.slice(0, 3).join(', ') 
        : meal.ingredients;
      body += `\n\n🛒 Ingredients: ${ingredients}`;
    }
    
    if (preferences.include_recipes && meal.instructions) {
      const instructions = Array.isArray(meal.instructions) 
        ? meal.instructions[0] 
        : meal.instructions;
      body += `\n\n👨‍🍳 Quick recipe: ${instructions}`;
    }

    return {
      id: `${mealType}-${planId}-${day}`,
      user_id: userId,
      plan_id: planId,
      type: mealType as any,
      title: title,
      body: body,
      scheduled_time: notificationTime.toISOString(),
      meal_data: meal,
      is_sent: false,
      created_at: new Date().toISOString()
    };
  }

  private isInQuietHours(date: Date, preferences: AdultDietNotificationPreferences): boolean {
    const [startHour, startMin] = preferences.quiet_hours_start.split(':').map(Number);
    const [endHour, endMin] = preferences.quiet_hours_end.split(':').map(Number);
    
    const hour = date.getHours();
    const minute = date.getMinutes();
    const currentTime = hour * 60 + minute;
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  private async scheduleNotification(
    notification: AdultDietScheduledNotification,
    registration: ServiceWorkerRegistration
  ): Promise<void> {
    const scheduledTime = new Date(notification.scheduled_time);
    const now = new Date();
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay <= 0) {
      console.warn('⚠️ Cannot schedule notification in the past:', notification.title);
      return;
    }

    console.log(`⏰ Scheduling notification "${notification.title}" for ${scheduledTime.toLocaleString()}`);

    // Use setTimeout for scheduling (in production, consider using a more robust system)
    const timeoutId = setTimeout(async () => {
      try {
        await registration.showNotification(notification.title, {
          body: notification.body,
          icon: '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: notification.id,
          data: {
            notificationId: notification.id,
            mealData: notification.meal_data,
            dayData: notification.day_data,
            type: notification.type
          },
          requireInteraction: false,
          silent: false,
          // actions disabled for browser compatibility
        });

        console.log(`✅ Notification sent: ${notification.title}`);
        await this.markNotificationAsSent(notification.id);
        this.scheduledTimeouts.delete(notification.id);
      } catch (error) {
        console.error('❌ Failed to show notification:', error);
      }
    }, delay);

    // Store timeout ID for potential cancellation
    this.scheduledTimeouts.set(notification.id, timeoutId);
  }

  private async storeNotifications(notifications: AdultDietScheduledNotification[]): Promise<void> {
    try {
      // Store in localStorage for immediate access
      const existingNotifications = this.getStoredNotifications();
      const allNotifications = [...existingNotifications, ...notifications];
      localStorage.setItem('adult_diet_notifications', JSON.stringify(allNotifications));

      // Store in database disabled - notifications stored only in localStorage for now
      console.log('📝 Storing notifications in localStorage only (database sync disabled)');
      // Database storage temporarily disabled due to schema sync issues

      console.log(`💾 Stored ${notifications.length} notifications`);
    } catch (error) {
      console.error('❌ Failed to store notifications:', error);
    }
  }

  private getStoredNotifications(): AdultDietScheduledNotification[] {
    try {
      const stored = localStorage.getItem('adult_diet_notifications');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('❌ Failed to get stored notifications:', error);
      return [];
    }
  }

  private async markNotificationAsSent(notificationId: string): Promise<void> {
    try {
      // Update localStorage
      const notifications = this.getStoredNotifications();
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, is_sent: true } : n
      );
      localStorage.setItem('adult_diet_notifications', JSON.stringify(updated));

      // Update database
      try {
        await (supabase as any)
          .from('diet_notifications')
          .update({ is_sent: true })
          .eq('id', notificationId);
      } catch (error) {
        console.error('Failed to update notification in database:', error);
      }

      console.log(`✅ Marked notification as sent: ${notificationId}`);
    } catch (error) {
      console.error('❌ Failed to mark notification as sent:', error);
    }
  }

  async cancelUserNotifications(userId: string): Promise<void> {
    try {
      console.log(`🗑️ Cancelling notifications for user: ${userId}`);

      // Cancel scheduled timeouts
      const notifications = this.getStoredNotifications();
      const userNotifications = notifications.filter(n => n.user_id === userId);
      
      for (const notification of userNotifications) {
        const timeoutId = this.scheduledTimeouts.get(notification.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.scheduledTimeouts.delete(notification.id);
        }
      }

      // Cancel browser notifications
      const registration = await this.registerServiceWorker();
      if (registration) {
        const activeNotifications = await registration.getNotifications();
        for (const notification of activeNotifications) {
          if (notification.data?.userId === userId) {
            notification.close();
          }
        }
      }

      // Remove from localStorage
      const filteredNotifications = notifications.filter(n => n.user_id !== userId);
      localStorage.setItem('adult_diet_notifications', JSON.stringify(filteredNotifications));

      // Remove from database
      try {
        await (supabase as any)
          .from('diet_notifications')
          .delete()
          .eq('user_id', userId);
      } catch (error) {
        console.error('Failed to delete user notifications from database:', error);
      }

      console.log(`✅ Cancelled notifications for user: ${userId}`);
    } catch (error) {
      console.error('❌ Failed to cancel user notifications:', error);
    }
  }

  async cancelPlanNotifications(planId: string): Promise<void> {
    try {
      console.log(`🗑️ Cancelling notifications for plan: ${planId}`);

      // Cancel scheduled timeouts
      const notifications = this.getStoredNotifications();
      const planNotifications = notifications.filter(n => n.plan_id === planId);
      
      for (const notification of planNotifications) {
        const timeoutId = this.scheduledTimeouts.get(notification.id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          this.scheduledTimeouts.delete(notification.id);
        }
      }

      // Cancel browser notifications
      const registration = await this.registerServiceWorker();
      if (registration) {
        const activeNotifications = await registration.getNotifications();
        for (const notification of activeNotifications) {
          if (notification.data?.planId === planId) {
            notification.close();
          }
        }
      }

      // Remove from localStorage
      const filteredNotifications = notifications.filter(n => n.plan_id !== planId);
      localStorage.setItem('adult_diet_notifications', JSON.stringify(filteredNotifications));

      // Remove from database
      try {
        await (supabase as any)
          .from('diet_notifications')
          .delete()
          .eq('plan_id', planId);
      } catch (error) {
        console.error('Failed to delete plan notifications from database:', error);
      }

      console.log(`✅ Cancelled notifications for plan: ${planId}`);
    } catch (error) {
      console.error('❌ Failed to cancel plan notifications:', error);
    }
  }

  getUpcomingNotifications(userId?: string): AdultDietScheduledNotification[] {
    const notifications = this.getStoredNotifications();
    const now = new Date();
    
    return notifications
      .filter(n => {
        const scheduledTime = new Date(n.scheduled_time);
        const isUpcoming = scheduledTime > now && !n.is_sent;
        const matchesUser = !userId || n.user_id === userId;
        return isUpcoming && matchesUser;
      })
      .sort((a, b) => new Date(a.scheduled_time).getTime() - new Date(b.scheduled_time).getTime());
  }

  async testNotification(): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Notification permission denied');
    }

    const registration = await this.registerServiceWorker();
    if (!registration) {
      throw new Error('Service Worker not available');
    }

    await registration.showNotification('🍽️ Diet Plan Test Notification', {
      body: 'This is a test notification for your diet plan reminders. Notifications are working correctly!',
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: 'test-notification',
      requireInteraction: false,
      // actions disabled for browser compatibility
    });

    console.log('✅ Test notification sent');
  }

  // Get default notification preferences
  getDefaultPreferences(): AdultDietNotificationPreferences {
    return {
      enabled: true,
      daily_plan_enabled: true,
      meal_reminders_enabled: true,
      
      daily_plan_time: "08:00",
      include_recipes_in_daily: false,
      
      breakfast_reminder: true,
      lunch_reminder: true,
      dinner_reminder: true,
      snack_reminder: false,
      
      breakfast_time: "08:00",
      lunch_time: "12:00",
      dinner_time: "18:00",
      snack_time: "15:00",
      
      include_recipes: true,
      include_calories: true,
      include_prep_time: true,
      include_ingredients: false,
      
      weekend_notifications: true,
      quiet_hours_start: "22:00",
      quiet_hours_end: "07:00"
    };
  }
}

export const adultDietNotificationService = AdultDietNotificationService.getInstance();