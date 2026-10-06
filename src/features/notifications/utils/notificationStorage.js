const STORAGE_KEY =
    "nalburjet_admin_unread_order_notifications";

export function getUnreadOrderNotifications() {
    if (typeof window === "undefined") {
        return [];
    }

    try {
        const storedValue =
            window.localStorage.getItem(STORAGE_KEY);

        if (!storedValue) {
            return [];
        }

        const parsedValue = JSON.parse(storedValue);

        if (!Array.isArray(parsedValue)) {
            return [];
        }

        return parsedValue;
    } catch (error) {
        console.error(
            "Okunmamış bildirimler alınamadı:",
            error,
        );

        return [];
    }
}

export function saveUnreadOrderNotifications(
    notifications,
) {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(notifications),
        );
    } catch (error) {
        console.error(
            "Okunmamış bildirimler kaydedilemedi:",
            error,
        );
    }
}

export function addUnreadOrderNotification(order) {
    if (!order?.orderId) {
        return;
    }

    const notifications =
        getUnreadOrderNotifications();

    const exists = notifications.some(
        (notification) =>
            notification.orderId === order.orderId,
    );

    if (exists) {
        return;
    }

    const notification = {
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        grandTotal: order.grandTotal,
        createdDate: order.audit?.createdDate,
    };

    saveUnreadOrderNotifications([
        notification,
        ...notifications,
    ]);
}

export function markOrderNotificationAsRead(orderId) {
    if (!orderId) {
        return;
    }

    const notifications =
        getUnreadOrderNotifications();

    saveUnreadOrderNotifications(
        notifications.filter(
            (notification) =>
                notification.orderId !== orderId,
        ),
    );
}

export function markAllOrderNotificationsAsRead() {
    saveUnreadOrderNotifications([]);
}