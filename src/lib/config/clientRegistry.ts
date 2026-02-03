'use client';

// Safe localStorage access for browsers that block storage (e.g., Comet)
export const safeGetItem = (key: string): string | null => {
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

export const safeSetItem = (key: string, value: string): boolean => {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const getClientConfig = (key: string, defaultVal?: any) => {
  return safeGetItem(key) ?? defaultVal ?? undefined;
};

export const getTheme = () => getClientConfig('theme', 'dark');

export const getAutoMediaSearch = () =>
  getClientConfig('autoMediaSearch', 'true') === 'true';

export const getSystemInstructions = () =>
  getClientConfig('systemInstructions', '');

export const getShowWeatherWidget = () =>
  getClientConfig('showWeatherWidget', 'true') === 'true';

export const getShowNewsWidget = () =>
  getClientConfig('showNewsWidget', 'true') === 'true';

export const getMeasurementUnit = () => {
  const value =
    getClientConfig('measureUnit') ??
    getClientConfig('measurementUnit', 'metric');

  if (typeof value !== 'string') return 'metric';

  return value.toLowerCase();
};
