import { createContext } from "react";

export interface UserRole {
    id: string;
    key: string;
    name: string;
    scope: string;
}

export interface User {
    id: string;
    email?: string;
    full_name?: string;
    phone?: string;
    pics?: string;
    account_type?: "system" | "organisation";
    account_status?: "active" | "rejected" | "pending_approval";
    organisation_status?: string
}

export interface LoginData {
    remember: boolean;
    user: User;
    role: UserRole;
    route: string;
    privileges: string[];
    permissions: string[];
}

export interface AuthContextValue {
    auth: boolean;
    my_id: string | null;
    my_details: User | null;
    role: UserRole | null;
    route: string;
    privileges: string[];
    permissions: string[];
    hydrated: boolean;
    detailsReady: boolean;
    setAuth: (next: boolean) => void;
    setMyID: (next: string | null) => void;
    setMyDetails: (next: User | null) => void;
    setRole: (next: UserRole | null) => void;
    setRoute: (next: string) => void;
    setPrivileges: (next: string[]) => void;
    setPermissions: (next: string[]) => void;
    setHydrated: (next: boolean) => void;
    setDetailsReady: (next: boolean) => void;
    login: (data: LoginData) => Promise<void>;
    logout: () => void;
    hasPermission: (permission: string) => boolean;
    hasAnyPermission: (permissions: string[]) => boolean;
    hasAllPermissions: (permissions: string[]) => boolean;
    hasPrivilege: (privilege: string) => boolean;
}

export const defaultValue: AuthContextValue = {
    auth: false,
    my_id: null,
    my_details: null,
    role: null,
    route: "/portal",
    privileges: [],
    permissions: [],
    hydrated: false,
    detailsReady: false,
    setAuth: () => {},
    setMyID: () => {},
    setMyDetails: () => {},
    setRole: () => {},
    setRoute: () => {},
    setPrivileges: () => {},
    setPermissions: () => {},
    setHydrated: () => {},
    setDetailsReady: () => {},
    login: async () => {},
    logout: () => {},
    hasPermission: () => false,
    hasAnyPermission: () => false,
    hasAllPermissions: () => false,
    hasPrivilege: () => false,
};

const UserContext = createContext<AuthContextValue>(defaultValue);

export default UserContext;