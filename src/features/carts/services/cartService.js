import { adminApi } from "@/lib/api/client";
import { getUserById } from "@/features/users/services/userService";

function hasValue(value) {
    return typeof value === "string" && value.trim().length > 0;
}

async function completeCartCustomers(carts, options) {
    // Older Admin API responses may contain UserId without the customer fields.
    // Resolve only missing information, once per user for this request.
    const users = new Map();

    return Promise.all(carts.map(async (cart) => {
        if (!cart.userId || [cart.customerName, cart.customerEmail, cart.customerPhoneNumber].every(hasValue)) {
            return cart;
        }

        if (!users.has(cart.userId)) {
            users.set(cart.userId, getUserById(cart.userId, options)
                .then((response) => response?.data)
                .catch(() => null));
        }

        const user = await users.get(cart.userId);

        if (!user || user.userId !== cart.userId) {
            return { ...cart, customerInfoUnavailable: true };
        }

        const fullName = [user.firstName, user.lastName].filter(hasValue).join(" ").trim();

        return {
            ...cart,
            customerName: hasValue(cart.customerName) ? cart.customerName : fullName,
            customerEmail: hasValue(cart.customerEmail) ? cart.customerEmail : user.email,
            customerPhoneNumber: hasValue(cart.customerPhoneNumber) ? cart.customerPhoneNumber : user.phoneNumber,
        };
    }));
}

export async function getCarts(options = {}) {
    const response = await adminApi.get("/Carts", options);
    const userOptions = { ...options };
    delete userOptions.params;

    return {
        ...response,
        items: await completeCartCustomers(response.items ?? [], userOptions),
    };
}

export async function getCartById(id, options = {}) {
    const response = await adminApi.get(`/Carts/${id}`, options);

    return {
        ...response,
        data: response.data ? (await completeCartCustomers([response.data], options))[0] : null,
    };
}

export function deleteCartItems(data, options = {}) {
    return adminApi.delWithBody("/Carts/items", data, options);
}
