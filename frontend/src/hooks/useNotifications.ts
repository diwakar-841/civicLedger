import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<Notification[]>("/notifications");
      const data = Array.isArray(response.data) ? response.data : [];
      setNotifications(data);
      setError(null);
    } catch (err: any) {
      // Silently fail - notifications are optional, don't break the app
      console.error("[v0] Notifications load failed (non-critical):", err?.message);
      setNotifications([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = async (notificationId: string) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (err: any) {
      console.error("[v0] Error marking notification as read:", err?.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err: any) {
      console.error("[v0] Error marking all as read:", err?.message);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
    } catch (err: any) {
      console.error("[v0] Error deleting notification:", err?.message);
    }
  };

  return {
    notifications,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    /** Manually re-fetch notifications (e.g. after an admin action). */
    refetch: fetchNotifications,
  };
}
