"use client";

import { useEffect, useRef } from "react";
import { getOrders } from "@/features/orders/services/orderService";
import { useRouter } from "next/navigation";

const ORDER_NOTIFICATION_INTERVAL = 30000;
const MAX_TRACKED_ORDER_IDS = 100;

export default function useOrderNotifications(enabled) {
    const knownOrderIdsRef = useRef(new Set());
    const isInitializedRef = useRef(false);
    const audioContextRef = useRef(null);
    const router = useRouter();

    useEffect(() => {
        if (!enabled) {
            return;
        }
        let intervalId = null;
        let isMounted = true;

        function unlockAudio() {
            if (!audioContextRef.current) {
                const AudioContext =
                    window.AudioContext || window.webkitAudioContext;

                if (!AudioContext) {
                    return;
                }

                audioContextRef.current = new AudioContext();
            }

            if (audioContextRef.current.state === "suspended") {
                audioContextRef.current.resume().catch(() => { });
            }
        }

        function handleUserInteraction() {
            unlockAudio();
        }

        async function playNotificationSound() {
            try {
                if (!audioContextRef.current) {
                    const AudioContext =
                        window.AudioContext || window.webkitAudioContext;

                    if (!AudioContext) {
                        return;
                    }

                    audioContextRef.current = new AudioContext();
                }

                const audioContext = audioContextRef.current;

                if (audioContext.state === "suspended") {
                    await audioContext.resume();
                }

                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();

                oscillator.type = "sine";

                oscillator.frequency.setValueAtTime(
                    880,
                    audioContext.currentTime,
                );

                oscillator.frequency.setValueAtTime(
                    660,
                    audioContext.currentTime + 0.15,
                );

                gainNode.gain.setValueAtTime(
                    0.0001,
                    audioContext.currentTime,
                );

                gainNode.gain.exponentialRampToValueAtTime(
                    0.25,
                    audioContext.currentTime + 0.02,
                );

                gainNode.gain.exponentialRampToValueAtTime(
                    0.0001,
                    audioContext.currentTime + 0.5,
                );

                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);

                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.5);
            } catch (error) {
                console.error(
                    "Sipariş bildirim sesi çalınamadı:",
                    error,
                );
            }
        }

        async function showNotification(order) {
            if (!("Notification" in window)) {
                return;
            }

            if (Notification.permission === "default") {
                try {
                    await Notification.requestPermission();
                } catch {
                    return;
                }
            }

            if (Notification.permission !== "granted") {
                return;
            }

            const notification = new Notification(
                "Yeni Sipariş Geldi",
                {
                    body: `${order.orderNumber} numaralı yeni sipariş oluşturuldu.`,
                    tag: `order-${order.orderId}`,
                    requireInteraction: true,
                },
            );

            notification.onclick = () => {
                window.focus();
                router.push(`/siparisler/${order.orderId}`);
                notification.close();
            };
        }

        async function notifyNewOrder(order) {
            await playNotificationSound();
            await showNotification(order);

            window.dispatchEvent(
                new CustomEvent("nalburjet:new-order", {
                    detail: order,
                }),
            );
        }

        async function checkForNewOrders() {
            try {
                const response = await getOrders({
                    params: {
                        "PageRequest.PageIndex": 0,
                        "PageRequest.PageSize": 10,
                        Status: "All",
                        SortBy: "CreatedDate",
                        SortDirection: "Descending",
                    },
                });

                const orders = response?.items ?? [];

                if (!isMounted || !Array.isArray(orders)) {
                    return;
                }

                if (!isInitializedRef.current) {
                    orders.forEach((order) => {
                        if (order?.orderId) {
                            knownOrderIdsRef.current.add(
                                order.orderId,
                            );
                        }
                    });

                    isInitializedRef.current = true;
                    return;
                }

                const newOrders = orders.filter(
                    (order) =>
                        order?.orderId &&
                        !knownOrderIdsRef.current.has(order.orderId),
                );
                
                console.log("Sipariş bildirimi kontrolü:", {
                    totalOrders: orders.length,
                    knownOrderCount: knownOrderIdsRef.current.size,
                    newOrders,
                });

                orders.forEach((order) => {
                    if (order?.orderId) {
                        knownOrderIdsRef.current.add(
                            order.orderId,
                        );
                    }
                });

                if (
                    knownOrderIdsRef.current.size >
                    MAX_TRACKED_ORDER_IDS
                ) {
                    const orderIds = Array.from(
                        knownOrderIdsRef.current,
                    );

                    knownOrderIdsRef.current = new Set(
                        orderIds.slice(-MAX_TRACKED_ORDER_IDS),
                    );
                }

                for (const order of newOrders) {
                    await notifyNewOrder(order);
                }
            } catch (error) {
                console.error(
                    "Yeni siparişler kontrol edilemedi:",
                    error,
                );
            }
        }

        window.addEventListener(
            "pointerdown",
            handleUserInteraction,
        );

        window.addEventListener(
            "keydown",
            handleUserInteraction,
        );

        checkForNewOrders();

        intervalId = window.setInterval(
            checkForNewOrders,
            ORDER_NOTIFICATION_INTERVAL,
        );

        return () => {
            isMounted = false;

            if (intervalId) {
                window.clearInterval(intervalId);
            }

            window.removeEventListener(
                "pointerdown",
                handleUserInteraction,
            );

            window.removeEventListener(
                "keydown",
                handleUserInteraction,
            );
        };
    }, [enabled]);
}