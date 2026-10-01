import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useContext } from "react";
import UserContext from "@/lib/userContext";

interface PermissionRouteProps {
    permission?: string;
    permissions?: string[];
    requireAll?: boolean;
}

export default function PermissionRoute({
    permission,
    permissions = [],
    requireAll = false
}: PermissionRouteProps) {
    const {
        auth,
        hydrated,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions
    } = useContext(UserContext);

    const location = useLocation();

    if (!hydrated) {
        return null;
    }

    if (!auth) {
        return (
            <Navigate
                to="/login"
                replace
                state={{ from: location.pathname }}
            />
        );
    }

    if (permission && !hasPermission(permission)) {
        return <Navigate to="/unauthorized" replace />;
    }

    if (permissions.length > 0) {
        const allowed = requireAll
            ? hasAllPermissions(permissions)
            : hasAnyPermission(permissions);

        if (!allowed) {
            return <Navigate to="/unauthorized" replace />;
        }
    }

    return <Outlet />;
}