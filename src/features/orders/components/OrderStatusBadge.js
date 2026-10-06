import {
    DELIVERY_STATUS,
    DELIVERY_STATUS_LABELS,
    ORDER_STATUS,
    ORDER_STATUS_LABELS,
    PAYMENT_STATUS,
    PAYMENT_STATUS_LABELS,
} from "@/features/orders/constants/orderConstants";

function getOrderStatusClass(status) {
    switch (status) {
        case ORDER_STATUS.COMPLETED:
            return "bg-green-50 text-green-700";
        case ORDER_STATUS.CANCELLED:
            return "bg-red-50 text-red-700";
        case ORDER_STATUS.PREPARING:
        case ORDER_STATUS.CONFIRMED:
            return "bg-orange-50 text-orange-700";
        default:
            return "bg-blue-50 text-blue-700";
    }
}

function getPaymentStatusClass(status) {
    switch (status) {
        case PAYMENT_STATUS.PAID:
            return "bg-green-50 text-green-700";
        case PAYMENT_STATUS.FAILED:
            return "bg-red-50 text-red-700";
        default:
            return "bg-blue-50 text-blue-700";
    }
}

function getDeliveryStatusClass(status) {
    switch (status) {
        case DELIVERY_STATUS.DELIVERED:
            return "bg-green-50 text-green-700";
        case DELIVERY_STATUS.SHIPPED:
            return "bg-orange-50 text-orange-700";
        default:
            return "bg-blue-50 text-blue-700";
    }
}

export function OrderStatusBadge({ status }) {
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getOrderStatusClass(status)}`}>
            {ORDER_STATUS_LABELS[status] || status}
        </span>
    );
}

export function PaymentStatusBadge({ status }) {
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentStatusClass(status)}`}>
            {PAYMENT_STATUS_LABELS[status] || status}
        </span>
    );
}

export function DeliveryStatusBadge({ status }) {
    return (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getDeliveryStatusClass(status)}`}>
            {DELIVERY_STATUS_LABELS[status] || status}
        </span>
    );
}