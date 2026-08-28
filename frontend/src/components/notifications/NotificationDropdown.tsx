import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { Card } from "../shared/Card";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose?: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  onDelete?: (notificationId: string) => void;
  onMarkAllAsRead?: () => void;
}

export function NotificationDropdown({
  notifications,
  onClose,
  onMarkAsRead,
  onDelete,
  onMarkAllAsRead,
}: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen((v) => !v);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const getIcon = (type: string) => {
    if (type.includes("candidateNomination")) return <AlertCircle className="h-4 w-4 text-gold-400" />;
    if (type.includes("Accepted")) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <Bell className="h-4 w-4 text-navy-400" />;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="focus-ring relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-navy-200 hover:bg-white/5 hover:text-white"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-80 max-h-96 overflow-y-auto">
          <Card className="rounded-lg border border-navy-700 bg-navy-900 p-0 shadow-2xl dark:bg-navy-950">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between border-b border-navy-700 bg-navy-900 px-4 py-3 dark:bg-navy-950">
              <h3 className="font-semibold text-navy-100">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={() => onMarkAllAsRead?.()}
                    className="text-xs text-navy-400 hover:text-navy-200 font-medium"
                    type="button"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="text-navy-400 hover:text-navy-200"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-navy-400" />
                <p className="text-sm text-navy-400">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-navy-700">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={() => {
                      if (!notif.isRead && onMarkAsRead) {
                        onMarkAsRead(notif.id);
                      }
                    }}
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-navy-800 transition-colors cursor-pointer ${
                      !notif.isRead ? "bg-navy-800/50" : ""
                    }`}
                  >
                    {getIcon(notif.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-navy-100 text-sm">{notif.title}</p>
                      <p className="text-xs text-navy-400 mt-1">{notif.message}</p>
                      <p className="text-[11px] text-navy-500 mt-1">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notif.isRead && (
                        <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete?.(notif.id);
                        }}
                        className="text-navy-500 hover:text-red-400 transition-colors"
                        type="button"
                        title="Delete notification"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
