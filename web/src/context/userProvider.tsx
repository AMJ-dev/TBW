import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import UserContext, { type User } from "@/lib/userContext";
import { TokenRemember } from "@/lib/constants";

export default function UserProvider({ children }: PropsWithChildren) {
	const [hydrated, setHydrated] = useState<boolean>(false);
	const [detailsReady, setDetailsReady] = useState<boolean>(false);
	const [auth, setAuth] = useState<boolean>(false);
	const [token, setToken] = useState<string | null>(null);
	const [my_id, setMyID] = useState<string | null>(null);
	const [my_details, setMyDetails] = useState<User | null>(null);

	useEffect(() => {
		setHydrated(true);
		setDetailsReady(true);
		setToken(null);
		setAuth(false);
		setMyID(null);
		setMyDetails(null);
		localStorage.removeItem("token");
		localStorage.removeItem("remember");
		sessionStorage.removeItem("token");
	}, []);

	const login = async (_tokenRemember: TokenRemember) => {
		setAuth(true);
		setMyID("demo-user");
		setMyDetails({ id: "demo-user", email: "demo@trinu.local", full_name: "Demo User" });
	};

	const logout = () => {
		setToken(null);
		setAuth(false);
		setMyID(null);
		setMyDetails(null);
	};

	const value = useMemo(
		() => ({ auth, token, my_id, my_details, hydrated, detailsReady, setAuth, setToken, setMyID, setMyDetails, setHydrated, setDetailsReady, login, logout }),
		[auth, token, my_id, my_details, hydrated, detailsReady]
	);
	return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}