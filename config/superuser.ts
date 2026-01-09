const SUPERUSER_SECRET = 'cash_vitruviano_2026';

export const isSuperuser = (): boolean => {
  const flag = localStorage.getItem('vitruviano_superuser');
  if (flag === 'true') {
    return true;
  }
  
  const urlParams = new URLSearchParams(window.location.search);
  const urlFlag = urlParams.get('superuser');
  const urlKey = urlParams.get('key');
  
  if (urlFlag === 'true' && urlKey === SUPERUSER_SECRET) {
    localStorage.setItem('vitruviano_superuser', 'true');
    return true;
  }
  
  return false;
};

export const clearSuperuser = (): void => {
  localStorage.removeItem('vitruviano_superuser');
};

export const setSuperuser = (enabled: boolean): void => {
  if (enabled) {
    localStorage.setItem('vitruviano_superuser', 'true');
  } else {
    clearSuperuser();
  }
};

if (typeof window !== 'undefined') {
  (window as any).vitruviano = {
    setSuperuser,
    clearSuperuser,
    isSuperuser,
  };
}