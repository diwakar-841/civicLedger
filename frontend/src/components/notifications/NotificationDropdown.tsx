import { useState, useRef, useEffect } from "react";
import { Bell, X, CheckCircle, AlertCircle, Trash2 } from "lucide-react";
import { Card } from "../shared/Card";import { jsxDEV as _jsxDEV } from "react/jsx-dev-runtime";

export function NotificationDropdown({
  notifications,
  onClose,
  onMarkAsRead,
  onDelete,
  onMarkAllAsRead
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const unreadCount = notifications.filter((n) => {return !n.isRead;}).length;

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {return document.removeEventListener("mousedown", handleClickOutside);};
  }, []);

  const handleToggle = () => {
    setIsOpen((v) => {return !v;});
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const getIcon = (type) => {
    if (type.includes("candidateNomination")) {return _jsxDEV(AlertCircle, { className: "h-4 w-4 text-gold-400" }, void 0, false);}
    if (type.includes("Accepted")) {return _jsxDEV(CheckCircle, { className: "h-4 w-4 text-green-500" }, void 0, false);}
    return _jsxDEV(Bell, { className: "h-4 w-4 text-navy-400" }, void 0, false);
  };

  return (
    _jsxDEV("div", {
 className: "relative", ref: dropdownRef, children: [
      _jsxDEV("button", {
        onClick: handleToggle,
        className: "focus-ring relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-navy-200 hover:bg-white/5 hover:text-white",
        title: "Notifications", children: [

        _jsxDEV(Bell, { className: "h-4 w-4" }, void 0, false),
        unreadCount > 0 &&
        _jsxDEV("span", {
 className: "absolute top-1 right-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white", children:
          unreadCount > 9 ? "9+" : unreadCount 
}, void 0, false
        )] 
}, void 0, true

      ),

      isOpen &&
      _jsxDEV("div", {
 className: "absolute right-0 top-12 z-50 w-80 max-h-96 overflow-y-auto", children:
        _jsxDEV(Card, {
 className: "rounded-lg border border-navy-700 bg-navy-900 p-0 shadow-2xl dark:bg-navy-950", children: [

          _jsxDEV("div", {
 className: "sticky top-0 flex items-center justify-between border-b border-navy-700 bg-navy-900 px-4 py-3 dark:bg-navy-950", children: [
            _jsxDEV("h3", { className: "font-semibold text-navy-100", children: "Notifications" }, void 0, false),
            _jsxDEV("div", {
 className: "flex items-center gap-2", children: [
              unreadCount > 0 &&
              _jsxDEV("button", {
                onClick: () => {return onMarkAllAsRead?.();},
                className: "text-xs text-navy-400 hover:text-navy-200 font-medium",
                type: "button", children:
                "Mark all read" 
}, void 0, false

              ),

              _jsxDEV("button", {
                onClick: handleClose,
                className: "text-navy-400 hover:text-navy-200",
                type: "button", children:

                _jsxDEV(X, { className: "h-4 w-4" }, void 0, false) 
}, void 0, false
              )] 
}, void 0, true
            )] 
}, void 0, true
          ),

          notifications.length === 0 ?
          _jsxDEV("div", {
 className: "flex flex-col items-center justify-center gap-2 px-4 py-8 text-center", children: [
            _jsxDEV(Bell, { className: "h-8 w-8 text-navy-400" }, void 0, false),
            _jsxDEV("p", { className: "text-sm text-navy-400", children: "No notifications yet" }, void 0, false)] 
}, void 0, true
          ) :

          _jsxDEV("div", {
 className: "divide-y divide-navy-700", children:
            notifications.map((notif) => {return (
                _jsxDEV("div", {

                  onClick: () => {
                    if (!notif.isRead && onMarkAsRead) {
                      onMarkAsRead(notif.id);
                    }
                  },
                  className: `flex items-start gap-3 px-4 py-3 hover:bg-navy-800 transition-colors cursor-pointer ${
                  !notif.isRead ? "bg-navy-800/50" : ""}`, children: [

                  getIcon(notif.type),
                  _jsxDEV("div", {
 className: "flex-1 min-w-0", children: [
                    _jsxDEV("p", { className: "font-medium text-navy-100 text-sm", children: notif.title }, void 0, false),
                    _jsxDEV("p", { className: "text-xs text-navy-400 mt-1", children: notif.message }, void 0, false),
                    _jsxDEV("p", {
 className: "text-[11px] text-navy-500 mt-1", children:
                      new Date(notif.createdAt).toLocaleString() 
}, void 0, false
                    )] 
}, void 0, true
                  ),
                  _jsxDEV("div", {
 className: "flex items-center gap-2 flex-shrink-0", children: [
                    !notif.isRead &&
                    _jsxDEV("div", { className: "h-2 w-2 rounded-full bg-blue-500 mt-2" }, void 0, false),

                    _jsxDEV("button", {
                      onClick: (e) => {
                        e.stopPropagation();
                        onDelete?.(notif.id);
                      },
                      className: "text-navy-500 hover:text-red-400 transition-colors",
                      type: "button",
                      title: "Delete notification", children:

                      _jsxDEV(Trash2, { className: "h-3 w-3" }, void 0, false) 
}, void 0, false
                    )] 
}, void 0, true
                  )] 
}, notif.id, true
                ));
            }) 
}, void 0, false
          )] 
}, void 0, true

        ) 
}, void 0, false
      )] 
}, void 0, true

    ));

}