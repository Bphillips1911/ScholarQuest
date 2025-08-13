// Token utility functions for 30-day authentication system

export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch {
    return true;
  }
}

export function getTokenExpiration(token: string): Date | null {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return new Date(payload.exp * 1000);
  } catch {
    return null;
  }
}

export function clearExpiredTokens(): void {
  const tokens = {
    teacherToken: localStorage.getItem("teacherToken"),
    parentToken: localStorage.getItem("parentToken"),
    studentToken: localStorage.getItem("studentToken"),
    adminToken: localStorage.getItem("adminToken")
  };

  Object.entries(tokens).forEach(([key, token]) => {
    if (token && isTokenExpired(token)) {
      localStorage.removeItem(key);
      console.log(`Cleared expired ${key}`);
    }
  });
}

export function getValidToken(userType: 'teacher' | 'parent' | 'student' | 'admin'): string | null {
  const token = localStorage.getItem(`${userType}Token`);
  if (!token || isTokenExpired(token)) {
    localStorage.removeItem(`${userType}Token`);
    return null;
  }
  return token;
}

export function showTokenExpirationWarning(userType: 'teacher' | 'parent' | 'student' | 'admin'): void {
  const token = localStorage.getItem(`${userType}Token`);
  if (!token) return;

  const expiration = getTokenExpiration(token);
  if (!expiration) return;

  const daysUntilExpiry = Math.ceil((expiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  
  // Show warning when 3 days or less remain
  if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
    console.warn(`Your ${userType} session will expire in ${daysUntilExpiry} day(s). Please save your work.`);
  }
}

// Auto-check tokens on page load
export function initTokenMonitoring(): void {
  clearExpiredTokens();
  
  // Check every hour for token expiration warnings
  setInterval(() => {
    ['teacher', 'parent', 'student', 'admin'].forEach(userType => {
      showTokenExpirationWarning(userType as any);
    });
  }, 60 * 60 * 1000); // 1 hour
}