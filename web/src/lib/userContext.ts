import { createContext } from "react";
import type { TokenRemember } from "./constants";

export interface User {
    id: string;
    email?: string;
    full_name?: string;
}

export interface AuthContextValue {
    auth: boolean;
    token: string | null;
    my_id: string | null;
    my_details: User | null;
    hydrated: boolean;
    detailsReady: boolean;
    setAuth: (next: boolean) => void;
    setToken: (next: string | null) => void;
    setMyID: (next: string | null) => void;
    setMyDetails: (next: User | null) => void;
    setHydrated: (next: boolean) => void;
    setDetailsReady: (next: boolean) => void;
    login: (tokenRemember: TokenRemember) => Promise<void>;
    logout: () => void;
}
export const defaultValue: AuthContextValue = {
    auth: false,
    token: null,
    my_id: null,
    my_details: null,
    hydrated: false,
    detailsReady: false,
    setAuth: () => {},
    setToken: () => {},
    setMyID: () => {},
    setMyDetails: () => {},
    setHydrated: () => {},
    setDetailsReady: () => {},
    login: async () => {},
    logout: () => {},
};
const UserContext = createContext<AuthContextValue>(defaultValue);
export default UserContext;