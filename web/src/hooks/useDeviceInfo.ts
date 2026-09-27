import { useMemo } from 'react';

export interface DeviceInfo {
    deviceType: string;
    browser: string;
    os: string;
    userAgent: string;
}

export const useDeviceInfo = (): DeviceInfo => {
    return useMemo(() => {
        const userAgent = navigator.userAgent;
        let browser = 'Unknown Browser';
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
        else if (userAgent.includes('Edg')) browser = 'Edge';
        
        let os = 'Unknown OS';
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'Mac OS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS')) os = 'iOS';
        
        let deviceType = 'Desktop';
        if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) deviceType = 'Mobile';
        else if (/Tablet|iPad/i.test(userAgent)) deviceType = 'Tablet';
        
        return { deviceType, browser, os, userAgent};
    }, []);
};