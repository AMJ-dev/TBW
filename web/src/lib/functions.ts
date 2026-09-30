import { useContext } from "react";
import moment from "moment";
import UserContext from "@/lib/userContext";

export const check_login = ()=>{
	const {login} = useContext(UserContext);
	return new Promise((resolve, reject)=>{
		const remember = localStorage.getItem("remember");
		const storedToken = get_token();
		
		if (storedToken) login({ token: storedToken, remember: remember === "1" });
		resolve(true);
	})
}
export const get_token = ()=>{
    const remember = localStorage.getItem("remember");
    const token = remember === "1" 
        ? localStorage.getItem("token")
        : sessionStorage.getItem("token");
    
    return token;
}
export const resolveSrc = (s: string) => {
	if (!s) return s;
	if (/^(?:https?:|blob:|data:)/i.test(s)) return s;
    return s.startsWith('/') ? s : `/${s}`;
};
export function truncate_string (string:string){   
    const max_length = 70;
    return string.length > max_length ? `${string.substring(0, max_length)}…`: string
}
export function str_to_url(str: string): string {
    return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export const is_numeric = (num:any) => (typeof(num) === 'number' || typeof(num) === "string" && num.trim() !== '');

export const format_currency = (amount: number | string | undefined) => {
	const num = typeof amount === 'string' ? Number(amount) : amount;
	if (num == null || Number.isNaN(num)) return '—';
	return new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(num);
};

export const format_number = (x:number) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

export const readable_date = (date:string) => isEmpty(date) ? "" : moment(Date.parse(date)).format("MMMM Do, YYYY")

export const readable_time = (time: string) => !time ? "" : moment(time, "HH:mm").format("hh:mm a");

export const readable_datetime = (date:string) => {
    const date_time = isEmpty(date) ? "" : moment(Date.parse(date)).format("MMMM Do, YYYY hh:mm a")
    return date_time
}

export const isEmpty = (str:any) => {
    str = String(str)
    return typeof str == undefined || str === "undefined" || !str || str.length === 0 || str === "" || !/[^\s]/.test(str) || /^\s*$/.test(str) || str.replace(/\s/g, "") === "" ? true : false
}

export function short_numbers(num: number): string {
    if (num >= 1_000_000_000) {
        return (num / 1_000_000_000)
            .toFixed(1)
            .replace('.0', '') + 'B';
    }

    if (num >= 1_000_000) {
        return (num / 1_000_000)
            .toFixed(1)
            .replace('.0', '') + 'M';
    }

    if (num >= 1_000) {
        return (num / 1_000)
            .toFixed(1)
            .replace('.0', '') + 'k';
    }

    return num.toString();
}