import React from 'react'
import { Seo } from "@/components/seo";
import {Outlet} from "react-router-dom";

export default function RootLayout() {
	return (
		<>
			<Seo />
			<Outlet />
		</>
	);
};
