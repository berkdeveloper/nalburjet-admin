"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    addUnreadOrderNotification,
    getUnreadOrderNotifications,
    markAllOrderNotificationsAsRead,
    markOrderNotificationAsRead,
} from "@/features/notifications/utils/notificationStorage";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
    const [
        unreadNotifications,
        setUnreadNotifications,
    ] = useState(() =>
        getUnreadOrderNotifications(),
    );

    const [
        latestNotification,
        setLatestNotification,
    ] = useState(null);

    const [isPopupVisible, setIsPopupVisible] =
        useState(false);

    const addOrderNotification = useCallback(
        (order) => {
            if (!order?.orderId) {
                return;
            }

            addUnreadOrderNotification(order);

            const notification = {
                orderId: order.orderId,
                orderNumber: order.orderNumber,
                grandTotal: order.grandTotal,
                createdDate:
                    order.audit?.createdDate,
            };

            setUnreadNotifications(
                (currentNotifications) => {
                    const exists =
                        currentNotifications.some(
                            (item) =>
                                item.orderId ===
                                order.orderId,
                        );

                    if (exists) {
                        return currentNotifications;
                    }

                    return [
                        notification,
                        ...currentNotifications,
                    ];
                },
            );

            setLatestNotification(order);
            setIsPopupVisible(true);
        },
        [],
    );

    const markAsRead = useCallback((orderId) => {
        if (!orderId) {
            return;
        }

        markOrderNotificationAsRead(orderId);

        setUnreadNotifications(
            (currentNotifications) =>
                currentNotifications.filter(
                    (notification) =>
                        notification.orderId !==
                        orderId,
                ),
        );
    }, []);

    const markAllAsRead = useCallback(() => {
        markAllOrderNotificationsAsRead();
        setUnreadNotifications([]);
    }, []);

    const closePopup = useCallback(() => {
        setIsPopupVisible(false);
    }, []);

    const showPopup = useCallback(
        (notification) => {
            setLatestNotification(notification);
            setIsPopupVisible(true);
        },
        [],
    );

    useEffect(() => {
        function handleNewOrder(event) {
            addOrderNotification(event.detail);
        }

        window.addEventListener(
            "nalburjet:new-order",
            handleNewOrder,
        );

        return () => {
            window.removeEventListener(
                "nalburjet:new-order",
                handleNewOrder,
            );
        };
    }, [addOrderNotification]);

    const value = useMemo(
        () => ({
            unreadNotifications,
            unreadCount:
                unreadNotifications.length,
            latestNotification,
            isPopupVisible,
            addOrderNotification,
            markAsRead,
            markAllAsRead,
            closePopup,
            showPopup,
        }),
        [
            unreadNotifications,
            latestNotification,
            isPopupVisible,
            addOrderNotification,
            markAsRead,
            markAllAsRead,
            closePopup,
            showPopup,
        ],
    );

    return (
        <NotificationContext.Provider
            value={value}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(
        NotificationContext,
    );

    if (!context) {
        throw new Error(
            "useNotifications must be used within NotificationProvider.",
        );
    }

    return context;
}