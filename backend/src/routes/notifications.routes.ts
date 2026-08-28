import { Router, Request, Response } from "express";
import { notificationService } from "../services/notification.service";
import { requireAuth } from "../middlewares/auth.middleware";

const router = Router();

// Get user notifications
router.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const notifications = await notificationService.getUserNotifications(userId);
    res.json(notifications);
  } catch (error) {
    console.error("[v0] Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread notifications
router.get("/unread", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const notifications = await notificationService.getUnreadNotifications(userId);
    res.json(notifications);
  } catch (error) {
    console.error("[v0] Error fetching unread notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Mark notification as read
router.patch("/:notificationId/read", requireAuth, async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    await notificationService.markAsRead(notificationId, (req as any).user.userId);
    res.json({ success: true });
  } catch (error) {
    console.error("[v0] Error marking as read:", error);
    res.status(500).json({ error: "Failed to update notification" });
  }
});

// Mark all as read
router.patch("/read-all", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    console.error("[v0] Error marking all as read:", error);
    res.status(500).json({ error: "Failed to update notifications" });
  }
});

// Delete notification
router.delete("/:notificationId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    await notificationService.deleteNotification(notificationId, (req as any).user.userId);
    res.json({ success: true });
  } catch (error) {
    console.error("[v0] Error deleting notification:", error);
    res.status(500).json({ error: "Failed to delete notification" });
  }
});

// Get notification settings
router.get("/settings", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const settings = await notificationService.getOrCreateSettings(userId);
    res.json(settings);
  } catch (error) {
    console.error("[v0] Error fetching settings:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

// Update notification settings
router.patch("/settings", requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { candidateNominationEmails, reminderEmails } = req.body;

    await notificationService.updateSettings(userId, {
      candidateNominationEmails,
      reminderEmails,
    });

    res.json({ success: true });
  } catch (error) {
    console.error("[v0] Error updating settings:", error);
    res.status(500).json({ error: "Failed to update settings" });
  }
});

export default router;
