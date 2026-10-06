"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import NotificationDropdown from "@/features/notifications/components/NotificationDropdown";
import { useNotifications } from "@/features/notifications/context/NotificationContext";

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const { unreadCount } = useNotifications();

    useEffect(() => {
        function handleOutsideClick(event) {
            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target,
                )
            ) {
                setIsOpen(false);
            }
        }

        if (isOpen) {
            document.addEventListener(
                "mousedown",
                handleOutsideClick,
            );
        }

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick,
            );
        };
    }, [isOpen]);

    return (
        <div
            ref={containerRef}
            className="relative"
        >
            <button
                type="button"
                onClick={() =>
                    setIsOpen(
                        (currentValue) =>
                            !currentValue,
                    )
                }
                className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-background-soft hover:text-primary"
                aria-label="Bildirimler"
                aria-expanded={isOpen}
            >
                <Bell size={20} />

                {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
                        {unreadCount > 99
                            ? "99+"
                            : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <NotificationDropdown
                    onClose={() =>
                        setIsOpen(false)
                    }
                />
            )}
        </div>
    );
}