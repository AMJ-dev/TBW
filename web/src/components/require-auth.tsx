import { useContext } from 'react';
import UserContext from "@/lib/userContext";
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import Preloader from '@/components/preloader';

export default function RequireAuth() {
	const { auth, hydrated } = useContext(UserContext);
	const location = useLocation();

	if (!hydrated) {
		return <Preloader />;
	}

	if (!auth) {
		return <Navigate to="/login" replace state={{ from: location }} />;
	}

	return <Outlet />;
};