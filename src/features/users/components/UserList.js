"use client";

import {
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleUserRound,
    Eye,
    LoaderCircle,
    Pencil,
    Search,
    Trash2,
    X,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";

import { getRoles } from "@/features/roles/services/roleService";
import {
    changeUserRole,
    deleteUser,
    getUserById,
    getUsers,
} from "@/features/users/services/userService";

const PAGE_SIZE = 10;

const INITIAL_FILTERS = {
    roleId: "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
};

function formatDate(value) {
    if (!value) {
        return "-";
    }

    return new Intl.DateTimeFormat("tr-TR", {
        dateStyle: "short",
        timeStyle: "short",
    }).format(new Date(value));
}

function getFullName(user) {
    return [user?.firstName, user?.lastName]
        .filter(Boolean)
        .join(" ")
        .trim() || "-";
}

function getRoleName(user, roles) {
    const role = roles.find((item) => item.roleId === user.roleId);

    return role?.roleName ?? "-";
}

function getErrorMessage(error) {
    return (
        error?.response?.data?.error?.message ||
        error?.response?.data?.message ||
        error?.message ||
        "Kullanıcılar yüklenirken bir hata oluştu."
    );
}

export default function UserList() {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);

    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState(INITIAL_FILTERS);

    const [pageIndex, setPageIndex] = useState(0);
    const [pages, setPages] = useState(0);
    const [count, setCount] = useState(0);

    const [isLoading, setIsLoading] = useState(true);
    const [isLoadingRoles, setIsLoadingRoles] = useState(true);
    const [error, setError] = useState(null);

    const [selectedUser, setSelectedUser] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    const [isRoleEditing, setIsRoleEditing] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState("");
    const [isChangingRole, setIsChangingRole] = useState(false);

    const [deletingUserId, setDeletingUserId] = useState(null);
    const [actionError, setActionError] = useState(null);

    const [refreshKey, setRefreshKey] = useState(0);

    const [deleteModalUser, setDeleteModalUser] = useState(null);

    useEffect(() => {
        let isMounted = true;

        async function loadRoles() {
            setIsLoadingRoles(true);

            try {
                const response = await getRoles({
                    params: {
                        "PageRequest.PageIndex": 0,
                        "PageRequest.PageSize": 100,
                    },
                });

                if (!isMounted) {
                    return;
                }

                setRoles(response?.items ?? []);
            } catch {
                if (!isMounted) {
                    return;
                }

                setRoles([]);
            } finally {
                if (isMounted) {
                    setIsLoadingRoles(false);
                }
            }
        }

        loadRoles();

        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let isMounted = true;

        async function loadUsers() {
            setIsLoading(true);
            setError(null);

            try {
                const params = {
                    "PageRequest.PageIndex": pageIndex,
                    "PageRequest.PageSize": PAGE_SIZE,
                };

                if (appliedFilters.roleId) {
                    params.RoleId = appliedFilters.roleId;
                }

                if (appliedFilters.firstName) {
                    params.FirstName = appliedFilters.firstName;
                }

                if (appliedFilters.lastName) {
                    params.LastName = appliedFilters.lastName;
                }

                if (appliedFilters.email) {
                    params.Email = appliedFilters.email;
                }

                if (appliedFilters.phoneNumber) {
                    params.PhoneNumber = appliedFilters.phoneNumber;
                }

                const response = await getUsers({ params });

                if (!isMounted) {
                    return;
                }

                setUsers(response?.items ?? []);
                setPages(response?.pages ?? 0);
                setCount(response?.count ?? 0);
            } catch (requestError) {
                if (!isMounted) {
                    return;
                }

                setUsers([]);
                setPages(0);
                setCount(0);
                setError(getErrorMessage(requestError));
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadUsers();

        return () => {
            isMounted = false;
        };
    }, [pageIndex, appliedFilters, refreshKey]);

    function handleFilterChange(event) {
        const { name, value } = event.target;

        setFilters((current) => ({
            ...current,
            [name]: value,
        }));
    }

    function handleSearch(event) {
        event.preventDefault();

        setPageIndex(0);
        setAppliedFilters({
            ...filters,
        });
    }

    function handleClearFilters() {
        setFilters(INITIAL_FILTERS);
        setAppliedFilters(INITIAL_FILTERS);
        setPageIndex(0);
    }

    function handlePreviousPage() {
        if (pageIndex <= 0) {
            return;
        }

        setPageIndex((current) => current - 1);
    }

    function handleNextPage() {
        if (pageIndex >= pages - 1) {
            return;
        }

        setPageIndex((current) => current + 1);
    }

    async function handleOpenUser(userId, editMode = false) {
        setIsDetailModalOpen(true);
        setIsLoadingUser(true);
        setSelectedUser(null);
        setIsRoleEditing(editMode);
        setSelectedRoleId("");
        setActionError(null);

        try {
            const response = await getUserById(userId);

            const user = response?.data ?? null;

            setSelectedUser(user);
            setSelectedRoleId(user?.roleId ?? "");
        } catch (requestError) {
            setActionError(getErrorMessage(requestError));
        } finally {
            setIsLoadingUser(false);
        }
    }

    function handleCloseUserModal() {
        if (isChangingRole || deletingUserId) {
            return;
        }

        setIsDetailModalOpen(false);
        setSelectedUser(null);
        setIsRoleEditing(false);
        setSelectedRoleId("");
        setActionError(null);
    }

    async function handleChangeRole() {
        if (!selectedUser || !selectedRoleId) {
            return;
        }

        if (selectedRoleId === selectedUser.roleId) {
            setIsRoleEditing(false);
            return;
        }

        setIsChangingRole(true);
        setActionError(null);

        try {
            const response = await changeUserRole({
                userId: selectedUser.userId,
                roleId: selectedRoleId,
            });

            const updatedUser = response?.data ?? null;

            if (updatedUser) {
                setSelectedUser(updatedUser);
                setSelectedRoleId(updatedUser.roleId);
            }

            setIsRoleEditing(false);
            setRefreshKey((current) => current + 1);
        } catch (requestError) {
            setActionError(getErrorMessage(requestError));
        } finally {
            setIsChangingRole(false);
        }
    }

    function handleOpenDeleteModal(user) {
        setDeleteModalUser(user);
    }

    async function handleDeleteUser() {
        if (!deleteModalUser) {
            return;
        }

        const user = deleteModalUser;

        setDeletingUserId(user.userId);
        setActionError(null);

        try {
            await deleteUser(user.userId);

            setDeleteModalUser(null);

            if (selectedUser?.userId === user.userId) {
                setIsDetailModalOpen(false);
                setSelectedUser(null);
            }

            if (users.length === 1 && pageIndex > 0) {
                setPageIndex((current) => current - 1);
            } else {
                setRefreshKey((current) => current + 1);
            }
        } catch (requestError) {
            setActionError(getErrorMessage(requestError));
        } finally {
            setDeletingUserId(null);
        }
    }

    return (
        <section className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">
                    Kullanıcılar
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                    Sistemde kayıtlı kullanıcıları görüntüleyin ve yönetin.
                </p>
            </div>

            <form
                onSubmit={handleSearch}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">
                            Filtrele
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Kullanıcı bilgilerine göre arama yapabilirsiniz.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div>
                        <label
                            htmlFor="firstName"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Ad
                        </label>
                        <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            value={filters.firstName}
                            onChange={handleFilterChange}
                            placeholder="Ad"
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="lastName"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Soyad
                        </label>
                        <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            value={filters.lastName}
                            onChange={handleFilterChange}
                            placeholder="Soyad"
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="email"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            E-posta
                        </label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={filters.email}
                            onChange={handleFilterChange}
                            placeholder="E-posta"
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="phoneNumber"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Telefon
                        </label>
                        <input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="text"
                            value={filters.phoneNumber}
                            onChange={handleFilterChange}
                            placeholder="Telefon"
                            className="h-10 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="roleId"
                            className="mb-1.5 block text-sm font-medium text-gray-700"
                        >
                            Rol
                        </label>
                        <select
                            id="roleId"
                            name="roleId"
                            value={filters.roleId}
                            onChange={handleFilterChange}
                            disabled={isLoadingRoles}
                            className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                        >
                            <option value="">Tüm roller</option>

                            {roles.map((role) => (
                                <option key={role.roleId} value={role.roleId}>
                                    {role.roleName}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="inline-flex h-10 items-center gap-2 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        <XCircle className="h-4 w-4" />
                        Temizle
                    </button>

                    <button
                        type="submit"
                        className="inline-flex h-10 items-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-medium text-white transition hover:bg-orange-600"
                    >
                        <Search className="h-4 w-4" />
                        Ara
                    </button>
                </div>
            </form>

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Kullanıcı Listesi
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {count} kullanıcı bulundu.
                        </p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Kullanıcı
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    E-posta
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Telefon
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Rol
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    E-posta
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Durum
                                </th>
                                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Kayıt Tarihi
                                </th>
                                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    İşlemler
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {isLoading ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-12 text-center"
                                    >
                                        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                                            <LoaderCircle className="h-5 w-5 animate-spin" />
                                            Kullanıcılar yükleniyor...
                                        </div>
                                    </td>
                                </tr>
                            ) : users.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={8}
                                        className="px-5 py-12 text-center"
                                    >
                                        <div className="flex flex-col items-center">
                                            <CircleUserRound className="h-10 w-10 text-gray-300" />
                                            <p className="mt-3 text-sm font-medium text-gray-700">
                                                Kullanıcı bulunamadı.
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Filtrelerinizi değiştirerek tekrar deneyebilirsiniz.
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                users.map((user) => (
                                    <tr
                                        key={user.userId}
                                        className="transition hover:bg-gray-50"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                                                    <CircleUserRound className="h-5 w-5" />
                                                </div>

                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {getFullName(user)}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-gray-400">
                                                        {user.userId}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {user.email || "-"}
                                        </td>

                                        <td className="px-5 py-4 text-sm text-gray-700">
                                            {user.phoneNumber || "-"}
                                        </td>

                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${getRoleName(user, roles) === "Admin"
                                                    ? "bg-blue-100 text-blue-700"
                                                    : "bg-orange-100 text-orange-700"
                                                    }`}
                                            >
                                                {getRoleName(user, roles)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            {user.emailConfirmed ? (
                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                                                    <CheckCircle2 className="h-4 w-4" />
                                                    Doğrulandı
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500">
                                                    <XCircle className="h-4 w-4" />
                                                    Doğrulanmadı
                                                </span>
                                            )}
                                        </td>

                                        <td className="px-5 py-4">
                                            {user.isActive ? (
                                                <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                                                    Pasif
                                                </span>
                                            )}
                                        </td>

                                        <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                                            {formatDate(user.audit?.createdDate)}
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenUser(user.userId, false)}
                                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Görüntüle
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenUser(user.userId, true)}
                                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Düzenle
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenDeleteModal(user)}
                                                    disabled={deletingUserId === user.userId}
                                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {deletingUserId === user.userId ? (
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                    Sil
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {!isLoading && users.length > 0 && (
                    <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
                        <p className="text-sm text-gray-500">
                            Sayfa {pages === 0 ? 0 : pageIndex + 1} / {pages}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handlePreviousPage}
                                disabled={pageIndex === 0}
                                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Önceki
                            </button>

                            <button
                                type="button"
                                onClick={handleNextPage}
                                disabled={
                                    pages === 0 || pageIndex >= pages - 1
                                }
                                className="inline-flex h-9 items-center gap-1 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Sonraki
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {isDetailModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Kullanıcı Detayı
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">
                                    Kullanıcı bilgilerini görüntüleyin ve rolünü yönetin.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCloseUserModal}
                                disabled={isChangingRole}
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {isLoadingUser ? (
                                <div className="flex min-h-60 items-center justify-center">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <LoaderCircle className="h-5 w-5 animate-spin" />
                                        Kullanıcı bilgileri yükleniyor...
                                    </div>
                                </div>
                            ) : selectedUser ? (
                                <div className="space-y-6">
                                    {actionError && (
                                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                            {actionError}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-4">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-orange-600">
                                            <CircleUserRound className="h-7 w-7" />
                                        </div>

                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {getFullName(selectedUser)}
                                            </h3>

                                            <p className="text-sm text-gray-500">
                                                {selectedUser.email || "-"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <div className="rounded-lg border border-gray-200 p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                                Telefon
                                            </p>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {selectedUser.phoneNumber || "-"}
                                            </p>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                                E-posta
                                            </p>
                                            <div className="mt-1">
                                                {selectedUser.emailConfirmed ? (
                                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        Doğrulandı
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500">
                                                        <XCircle className="h-4 w-4" />
                                                        Doğrulanmadı
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                                Durum
                                            </p>
                                            <div className="mt-1">
                                                {selectedUser.isActive ? (
                                                    <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                                                        Pasif
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="rounded-lg border border-gray-200 p-4">
                                            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                                Kayıt Tarihi
                                            </p>
                                            <p className="mt-1 text-sm text-gray-900">
                                                {formatDate(
                                                    selectedUser.audit?.createdDate,
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="rounded-lg border border-gray-200 p-4">
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    Kullanıcı Rolü
                                                </p>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    Kullanıcının sistemdeki yetki rolünü
                                                    değiştirin.
                                                </p>
                                            </div>

                                            {!isRoleEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => setIsRoleEditing(true)}
                                                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-300 px-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                    Değiştir
                                                </button>
                                            )}
                                        </div>

                                        {isRoleEditing ? (
                                            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                                                <select
                                                    value={selectedRoleId}
                                                    onChange={(event) =>
                                                        setSelectedRoleId(
                                                            event.target.value,
                                                        )
                                                    }
                                                    disabled={isChangingRole}
                                                    className="h-10 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50"
                                                >
                                                    <option value="">
                                                        Rol seçin
                                                    </option>

                                                    {roles.map((role) => (
                                                        <option
                                                            key={role.roleId}
                                                            value={role.roleId}
                                                        >
                                                            {role.roleName}
                                                        </option>
                                                    ))}
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={handleChangeRole}
                                                    disabled={
                                                        isChangingRole ||
                                                        !selectedRoleId
                                                    }
                                                    className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 text-sm font-medium text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    {isChangingRole && (
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                    )}
                                                    Kaydet
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedRoleId(
                                                            selectedUser.roleId,
                                                        );
                                                        setIsRoleEditing(false);
                                                    }}
                                                    disabled={isChangingRole}
                                                    className="inline-flex h-10 items-center justify-center rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                                                >
                                                    Vazgeç
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="mt-4">
                                                <span className="inline-flex rounded-full bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700">
                                                    {getRoleName(selectedUser, roles)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                                            Kullanıcı ID
                                        </p>
                                        <p className="mt-1 break-all font-mono text-xs text-gray-600">
                                            {selectedUser.userId}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex min-h-60 items-center justify-center text-sm text-gray-500">
                                    Kullanıcı bilgileri alınamadı.
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
                            <button
                                type="button"
                                onClick={handleCloseUserModal}
                                disabled={isChangingRole}
                                className="h-10 rounded-lg border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                            >
                                Kapat
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteModalUser && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
                        <div className="border-b border-gray-100 px-6 py-5">
                            <h2 className="text-lg font-semibold text-gray-900">Kullanıcıyı Sil</h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Bu işlem geri alınamaz.
                            </p>
                        </div>

                        <div className="px-6 py-5">
                            <p className="text-sm leading-6 text-gray-700">
                                <span className="font-semibold text-gray-900">
                                    {getFullName(deleteModalUser)}
                                </span>{" "}
                                kullanıcısını silmek istediğinize emin misiniz?
                            </p>
                        </div>

                        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setDeleteModalUser(null)}
                                disabled={deletingUserId === deleteModalUser.userId}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Vazgeç
                            </button>

                            <button
                                type="button"
                                onClick={handleDeleteUser}
                                disabled={deletingUserId === deleteModalUser.userId}
                                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {deletingUserId === deleteModalUser.userId && (
                                    <LoaderCircle className="h-4 w-4 animate-spin" />
                                )}
                                Sil
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}