import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import UserContext, {
    type User,
    type UserRole,
    type LoginData
} from "@/lib/userContext";

export default function UserProvider({ children }: PropsWithChildren) {
    const [hydrated, setHydrated] = useState(false);
    const [detailsReady, setDetailsReady] = useState(false);
    const [auth, setAuth] = useState(false);
    const [token, setToken] = useState<string | null>(null);
    const [my_id, setMyID] = useState<string | null>(null);
    const [my_details, setMyDetails] = useState<User | null>(null);
    const [role, setRole] = useState<UserRole | null>(null);
    const [route, setRoute] = useState("/portal");
    const [privileges, setPrivileges] = useState<string[]>([]);
    const [permissions, setPermissions] = useState<string[]>([]);

    useEffect(() => {
        const remember = localStorage.getItem("remember") === "1";

        const storedToken = remember
            ? localStorage.getItem("token")
            : sessionStorage.getItem("token");

        const storedUser = remember
            ? localStorage.getItem("user")
            : sessionStorage.getItem("user");

        const storedRole = remember
            ? localStorage.getItem("role")
            : sessionStorage.getItem("role");

        const storedRoute = remember
            ? localStorage.getItem("route")
            : sessionStorage.getItem("route");

        const storedPrivileges = remember
            ? localStorage.getItem("privileges")
            : sessionStorage.getItem("privileges");

        const storedPermissions = remember
            ? localStorage.getItem("permissions")
            : sessionStorage.getItem("permissions");

        if (storedToken && storedUser && storedRole) {
            try {
                const user = JSON.parse(storedUser);
                const userRole = JSON.parse(storedRole);
                const userPrivileges = storedPrivileges
                    ? JSON.parse(storedPrivileges)
                    : [];
                const userPermissions = storedPermissions
                    ? JSON.parse(storedPermissions)
                    : [];

                setToken(storedToken);
                setMyDetails(user);
                setMyID(user.id);
                setRole(userRole);
                setRoute(storedRoute || "/portal");
                setPrivileges(userPrivileges);
                setPermissions(userPermissions);
                setAuth(true);
            } catch {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                localStorage.removeItem("role");
                localStorage.removeItem("route");
                localStorage.removeItem("privileges");
                localStorage.removeItem("permissions");

                sessionStorage.removeItem("token");
                sessionStorage.removeItem("user");
                sessionStorage.removeItem("role");
                sessionStorage.removeItem("route");
                sessionStorage.removeItem("privileges");
                sessionStorage.removeItem("permissions");
            }
        }

        setHydrated(true);
        setDetailsReady(true);
    }, []);

    const login = async (data: LoginData) => {
        const storage = data.remember ? localStorage : sessionStorage;

        storage.setItem("token", data.token);
        storage.setItem("remember", data.remember ? "1" : "0");
        storage.setItem("user", JSON.stringify(data.user));
        storage.setItem("role", JSON.stringify(data.role));
        storage.setItem("route", data.route);
        storage.setItem("privileges", JSON.stringify(data.privileges));
        storage.setItem("permissions", JSON.stringify(data.permissions));

        if (data.remember) {
            sessionStorage.removeItem("token");
            sessionStorage.removeItem("user");
            sessionStorage.removeItem("role");
            sessionStorage.removeItem("route");
            sessionStorage.removeItem("privileges");
            sessionStorage.removeItem("permissions");
        } else {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("role");
            localStorage.removeItem("route");
            localStorage.removeItem("privileges");
            localStorage.removeItem("permissions");
        }

        setToken(data.token);
        setMyDetails(data.user);
        setMyID(data.user.id);
        setRole(data.role);
        setRoute(data.route);
        setPrivileges(data.privileges);
        setPermissions(data.permissions);
        setAuth(true);
    };

    const logout = () => {
        setToken(null);
        setAuth(false);
        setMyID(null);
        setMyDetails(null);
        setRole(null);
        setRoute("/portal");
        setPrivileges([]);
        setPermissions([]);

        localStorage.removeItem("token");
        localStorage.removeItem("remember");
        localStorage.removeItem("user");
        localStorage.removeItem("role");
        localStorage.removeItem("route");
        localStorage.removeItem("privileges");
        localStorage.removeItem("permissions");

        sessionStorage.removeItem("token");
        sessionStorage.removeItem("remember");
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("role");
        sessionStorage.removeItem("route");
        sessionStorage.removeItem("privileges");
        sessionStorage.removeItem("permissions");
    };

    const hasPermission = (permission: string) => {
        if (role?.key === "system_admin") return true;
        return permissions.includes(permission);
    };

    const hasAnyPermission = (required: string[]) => {
        if (role?.key === "system_admin") return true;
        return required.some(permission => permissions.includes(permission));
    };

    const hasAllPermissions = (required: string[]) => {
        if (role?.key === "system_admin") return true;
        return required.every(permission => permissions.includes(permission));
    };

    const hasPrivilege = (privilege: string) => {
        if (role?.key === "system_admin") return true;
        return privileges.includes(privilege);
    };

    const value = useMemo(
        () => ({
            auth,
            token,
            my_id,
            my_details,
            role,
            route,
            privileges,
            permissions,
            hydrated,
            detailsReady,
            setAuth,
            setToken,
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
            hasPrivilege
        }),
        [
            auth,
            token,
            my_id,
            my_details,
            role,
            route,
            privileges,
            permissions,
            hydrated,
            detailsReady
        ]
    );

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
}