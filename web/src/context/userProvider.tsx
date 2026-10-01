import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type PropsWithChildren
} from "react";
import UserContext, {
    type User,
    type UserRole,
    type LoginData
} from "@/lib/userContext";
import { http, type Resp } from "@/lib/httpClient";

export default function UserProvider({ children }: PropsWithChildren) {
    const [hydrated, setHydrated] = useState(false);
    const [detailsReady, setDetailsReady] = useState(false);
    const [auth, setAuth] = useState(false);
    const [my_id, setMyID] = useState<string | null>(null);
    const [my_details, setMyDetails] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [route, setRoute] = useState("/portal");
    const [privileges, setPrivileges] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);

    const fetchingProfile = useRef(false);

    const getStorage = useCallback(() => {
        const remember = localStorage.getItem("remember") === "1";
        return remember ? localStorage : sessionStorage;
    }, []);

    const clearStorage = useCallback(() => {
        const keys = [
            "remember",
            "user",
            "role",
            "route",
            "privileges",
            "permissions"
        ];

        keys.forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }, []);

    const logout = useCallback(() => {
        setAuth(false);
        setMyID(null);
        setMyDetails(null);
        setRole(null);
        setRoute("/portal");
        setPrivileges([]);
        setPermissions([]);

        clearStorage();
    }, [clearStorage]);

    const updateProfile = useCallback((data: any) => {
        if (!data?.user || !data?.role) {
            return false;
        }

        const user: User = {
            id: data.user.id,
            email: data.user.email,
            pics: data.user.pics,
            phone: data.user.phone,
            full_name: data.user.full_name,
            account_type: data.user.account_type,
            account_status: data.user.account_status
        };

        const userRole: UserRole = {
            id: data.role.id,
            key: data.role.key,
            name: data.role.name,
            scope: data.role.scope
        };

        const userRoute = data.route || "/portal";
        const userPrivileges = Array.isArray(data.privileges)
            ? data.privileges
            : [];
        const userPermissions = Array.isArray(data.permissions)
            ? data.permissions
            : [];

        const storage = getStorage();

        storage.setItem("user", JSON.stringify(user));
        storage.setItem("role", JSON.stringify(userRole));
        storage.setItem("route", userRoute);
        storage.setItem("privileges", JSON.stringify(userPrivileges));
        storage.setItem("permissions", JSON.stringify(userPermissions));

        setMyDetails(user);
        setMyID(user.id);
        setRole(userRole);
        setRoute(userRoute);
        setPrivileges(userPrivileges);
        setPermissions(userPermissions);
        setAuth(true);

        return true;
    }, [getStorage]);

    const fetchUser = useCallback(async () => {
        if (fetchingProfile.current) {
            return;
        }

        const storage = getStorage();
        const storedUser = storage.getItem("user");

        if (!storedUser && !auth) {
            setDetailsReady(true);
            return;
        }

        fetchingProfile.current = true;

        try {
            const res: any = await http.get("get-profile/");
            const resp: Resp = res.data;

            if (resp.error === false && resp.data) {
                updateProfile(resp.data);
                // console.log(resp.data.user)
            }
        } catch (error: any) {
            const status =
                error?.status ||
                error?.response?.status ||
                error?.response?.data?.status;

            if (status === 401) {
                logout();
            }
        } finally {
            fetchingProfile.current = false;
            setDetailsReady(true);
        }
    }, [getStorage, updateProfile, logout, auth]);

    useEffect(() => {
        const remember = localStorage.getItem("remember") === "1";
        const storage = remember ? localStorage : sessionStorage;

        const storedUser = storage.getItem("user");
        const storedRole = storage.getItem("role");
        const storedRoute = storage.getItem("route");
        const storedPrivileges = storage.getItem("privileges");
        const storedPermissions = storage.getItem("permissions");

        if (storedUser && storedRole) {
            try {
                const user = JSON.parse(storedUser);
                const userRole = JSON.parse(storedRole);

                const userPrivileges = storedPrivileges
                    ? JSON.parse(storedPrivileges)
                    : [];

                const userPermissions = storedPermissions
                    ? JSON.parse(storedPermissions)
                    : [];

                setMyDetails(user);
                setMyID(user.id);
                setRole(userRole);
                setRoute(storedRoute || "/portal");
                setPrivileges(userPrivileges);
                setPermissions(userPermissions);
                setAuth(true);
            } catch {
                clearStorage();
            }
        }

        setHydrated(true);
    }, [clearStorage]);

    useEffect(() => {
        if (!hydrated) {
            return;
        }

        fetchUser();
    }, [hydrated, fetchUser]);

    useEffect(() => {
        if (!hydrated) {
            return;
        }

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                fetchUser();
            }
        };

        const handleFocus = () => {
            fetchUser();
        };

        document.addEventListener(
            "visibilitychange",
            handleVisibilityChange
        );

        window.addEventListener("focus", handleFocus);

        return () => {
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange
            );

            window.removeEventListener("focus", handleFocus);
        };
    }, [hydrated, fetchUser]);

    const login = useCallback(async (data: LoginData) => {
        const storage = data.remember
            ? localStorage
            : sessionStorage;

        storage.setItem(
            "remember",
            data.remember ? "1" : "0"
        );

        storage.setItem(
            "user",
            JSON.stringify(data.user)
        );

        storage.setItem(
            "role",
            JSON.stringify(data.role)
        );

        storage.setItem(
            "route",
            data.route
        );

        storage.setItem(
            "privileges",
            JSON.stringify(data.privileges)
        );

        storage.setItem(
            "permissions",
            JSON.stringify(data.permissions)
        );

        if (data.remember) {
            sessionStorage.removeItem("remember");
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("role");
            sessionStorage.removeItem("route");
            sessionStorage.removeItem("privileges");
            sessionStorage.removeItem("permissions");
        } else {
            localStorage.removeItem("remember");
            localStorage.removeItem("user");
            localStorage.removeItem("role");
            localStorage.removeItem("route");
            localStorage.removeItem("privileges");
            localStorage.removeItem("permissions");
        }

        setMyDetails(data.user);
        setMyID(data.user.id);
        setRole(data.role);
        setRoute(data.route || "/portal");
        setPrivileges(data.privileges || []);
        setPermissions(data.permissions || []);
        setAuth(true);

        await fetchUser();
    }, [fetchUser]);

    const hasPermission = useCallback(
        (permission: string) => {
            if (role?.key === "system_admin") {
                return true;
            }

            return permissions.includes(permission);
        },
        [role, permissions]
    );

    const hasAnyPermission = useCallback(
        (required: string[]) => {
            if (role?.key === "system_admin") {
                return true;
            }

            return required.some(permission =>
                permissions.includes(permission)
            );
        },
        [role, permissions]
    );

    const hasAllPermissions = useCallback(
        (required: string[]) => {
            if (role?.key === "system_admin") {
                return true;
            }

            return required.every(permission =>
                permissions.includes(permission)
            );
        },
        [role, permissions]
    );

    const hasPrivilege = useCallback(
        (privilege: string) => {
            if (role?.key === "system_admin") {
                return true;
            }

            return privileges.includes(privilege);
        },
        [role, privileges]
    );

    const value = useMemo(
        () => ({
            auth,
            my_id,
            my_details,
            role,
            route,
            privileges,
            permissions,
            hydrated,
            detailsReady,
            setAuth,
            setMyID,
            setMyDetails,
            setRole,
            setRoute,
            setPrivileges,
            setPermissions,
            setHydrated,
            setDetailsReady,
            login,
            logout,
            hasPermission,
            hasAnyPermission,
            hasAllPermissions,
            hasPrivilege,
            fetchUser
        }),
        [
            auth,
            my_id,
            my_details,
            role,
            route,
            privileges,
            permissions,
            hydrated,
            detailsReady,
            login,
            logout,
            hasPermission,
            hasAnyPermission,
            hasAllPermissions,
            hasPrivilege,
            fetchUser
        ]
    );

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}