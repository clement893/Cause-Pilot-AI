"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Bell,
  X,
  Check,
  CheckCheck,
  DollarSign,
  Users,
  Target,
  Mail,
  FileText,
  Info,
  Heart,
} from "lucide-react";

interface Notification {
  id: string;
  createdAt: string;
  type: string;
  category: string;
  priority: string;
  title: string;
  message: string;
  actionUrl?: string;
  actionLabel?: string;
  isRead: boolean;
  isDismissed: boolean;
}

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const dismissNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDismissed: true }),
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === id);
        return notification && !notification.isRead ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      console.error("Error dismissing notification:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications/mark-all-read", { method: "POST" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "DONATIONS":
        return <DollarSign className="w-4 h-4" />;
      case "DONORS":
        return <Users className="w-4 h-4" />;
      case "CAMPAIGNS":
        return <Target className="w-4 h-4" />;
      case "EMAILS":
        return <Mail className="w-4 h-4" />;
      case "FORMS":
        return <FileText className="w-4 h-4" />;
      case "P2P":
        return <Heart className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "DONATIONS":
        return "bg-success/20 text-success-light";
      case "DONORS":
        return "bg-brand/20 text-brand-light";
      case "CAMPAIGNS":
        return "bg-info/20 text-info-light";
      case "EMAILS":
        return "bg-amber-500/20 text-warning";
      case "FORMS":
        return "bg-accent/20 text-accent";
      case "P2P":
        return "bg-error/20 text-error-light";
      default:
        return "bg-muted/20 text-muted-foreground";
    }
  };

  const getPriorityIndicator = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "border-l-4 border-red-500";
      case "HIGH":
        return "border-l-4 border-amber-500";
      default:
        return "";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-CA", { day: "numeric", month: "short" });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-surface-secondary border border-border rounded-lg hover:bg-surface-tertiary transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-error rounded-full text-xs text-white flex items-center justify-center px-1">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-surface-primary border border-border rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-white">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs text-brand-light hover:text-purple-300 flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  Tout marquer comme lu
                </button>
              )}
            </div>
          </div>

          {/* Liste des notifications */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Aucune notification</p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative p-4 hover:bg-surface-secondary/50 transition-colors ${
                      !notification.isRead ? "bg-surface-secondary/30" : ""
                    } ${getPriorityIndicator(notification.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icône catégorie */}
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getCategoryColor(
                          notification.category
                        )}`}
                      >
                        {getCategoryIcon(notification.category)}
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm font-medium ${
                              notification.isRead ? "text-foreground" : "text-white"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <span className="text-xs text-text-tertiary flex-shrink-0">
                            {formatTimeAgo(notification.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>

                        {/* Actions */}
                        <div className="flex items-center gap-2 mt-2">
                          {notification.actionUrl && (
                            <Link
                              href={notification.actionUrl}
                              onClick={() => {
                                markAsRead(notification.id);
                                setIsOpen(false);
                              }}
                              className="text-xs text-brand-light hover:text-purple-300"
                            >
                              {notification.actionLabel || "Voir"}
                            </Link>
                          )}
                          {!notification.isRead && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-text-tertiary hover:text-muted-foreground flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Bouton fermer */}
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        className="p-1 hover:bg-surface-tertiary rounded transition-colors flex-shrink-0"
                      >
                        <X className="w-4 h-4 text-text-tertiary" />
                      </button>
                    </div>

                    {/* Indicateur non lu */}
                    {!notification.isRead && (
                      <div className="absolute top-4 left-1 w-2 h-2 bg-brand rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-border">
            <Link
              href="/notifications"
              onClick={() => setIsOpen(false)}
              className="block text-center text-sm text-brand-light hover:text-purple-300"
            >
              Voir toutes les notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
