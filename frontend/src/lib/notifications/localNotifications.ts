export type LocalNotificationKind = "device_login" | "related_user_login";

export type LocalNotification = {
  id: string;
  kind: LocalNotificationKind;
  createdAt: string;
  readAt: string | null;
  targetPath: string;
  payload?: Record<string, string>;
};

const STORAGE_PREFIX = "leasemate.localNotifications";
const NOTIFICATION_EVENT = "leasemate:local-notifications";

type NotificationEventDetail = {
  userKey: string;
};

export function listLocalNotifications(userKey: string) {
  return readNotifications(userKey);
}

export function getUnreadLocalNotificationCount(userKey: string) {
  return readNotifications(userKey).filter((notification) => !notification.readAt)
    .length;
}

export function addLocalNotification(
  userKey: string,
  notification: Omit<LocalNotification, "id" | "createdAt" | "readAt">,
) {
  const notifications = readNotifications(userKey);
  const nextNotification: LocalNotification = {
    ...notification,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    readAt: null,
  };

  writeNotifications(userKey, [nextNotification, ...notifications].slice(0, 50));
  emitNotificationChange(userKey);
}

export function markAllLocalNotificationsRead(userKey: string) {
  const now = new Date().toISOString();
  const notifications = readNotifications(userKey).map((notification) =>
    notification.readAt ? notification : { ...notification, readAt: now },
  );

  writeNotifications(userKey, notifications);
  emitNotificationChange(userKey);
}

export function removeLocalNotification(userKey: string, notificationId: string) {
  const notifications = readNotifications(userKey).filter(
    (notification) => notification.id !== notificationId,
  );

  writeNotifications(userKey, notifications);
  emitNotificationChange(userKey);
}

export function subscribeLocalNotifications(
  userKey: string,
  callback: () => void,
) {
  const handleNotificationChange = (event: Event) => {
    const customEvent = event as CustomEvent<NotificationEventDetail>;
    if (customEvent.detail?.userKey === userKey) {
      callback();
    }
  };
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key === getStorageKey(userKey)) {
      callback();
    }
  };

  window.addEventListener(NOTIFICATION_EVENT, handleNotificationChange);
  window.addEventListener("storage", handleStorageChange);

  return () => {
    window.removeEventListener(NOTIFICATION_EVENT, handleNotificationChange);
    window.removeEventListener("storage", handleStorageChange);
  };
}

function readNotifications(userKey: string): LocalNotification[] {
  const rawValue = localStorage.getItem(getStorageKey(userKey));
  if (!rawValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(rawValue) as LocalNotification[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeNotifications(
  userKey: string,
  notifications: LocalNotification[],
) {
  localStorage.setItem(getStorageKey(userKey), JSON.stringify(notifications));
}

function getStorageKey(userKey: string) {
  return `${STORAGE_PREFIX}.${encodeURIComponent(userKey)}`;
}

function emitNotificationChange(userKey: string) {
  window.dispatchEvent(
    new CustomEvent<NotificationEventDetail>(NOTIFICATION_EVENT, {
      detail: { userKey },
    }),
  );
}
