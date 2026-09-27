export interface LocationInfo {
    ip: string;
    country: string;
    region: string;
    city: string;
    timezone: string;
    isp: string;
}

export const useLocationInfo = () => {
    const locationInfo: LocationInfo = {
        ip: 'Not collected in demo',
        country: 'Nigeria',
        region: 'FCT',
        city: 'Abuja',
        timezone: 'Africa/Lagos',
        isp: 'Not collected in demo'
    };

    return { locationInfo, loading: false, error: null };
};