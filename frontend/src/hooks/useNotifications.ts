import { useCallback, useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/notifications");
      const data = Array.isArray(response.data) ? response.data : [];
      setNotifications(data);
      setError(null);
    } catch (err) {

      console.error("[v0] Notifications load failed (non-critical):", err?.message);
      setNotifications([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000);
    return () => {return clearInterval(interval);};
  }, [fetchNotifications]);

  const markAsRead = async (notificationId) => {
    try {
      await apiClient.patch(`/notifications/${notificationId}/read`);
      setNotifications((prev) =>
      {return prev.map((n) =>
        {return n.id === notificationId ? { ...n, isRead: true } : n;}
        );}
      );
    } catch (err) {
      console.error("[v0] Error marking notification as read:", err?.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiClient.patch("/notifications/read-all");
      setNotifications((prev) => {return prev.map((n) => {return { ...n, isRead: true };});});
    } catch (err) {
      console.error("[v0] Error marking all as read:", err?.message);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      setNotifications((prev) => {return prev.filter((n) => {return n.id !== notificationId;});});
    } catch (err) {
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

    refetch: fetchNotifications
  };
}