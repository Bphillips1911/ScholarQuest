// Student authentication utilities for permanent token management

interface StudentData {
  id: string;
  name: string;
  username: string;
}

export function getStudentToken(): string | null {
  const token = localStorage.getItem("studentToken");
  const expiry = localStorage.getItem("studentTokenExpiry");
  
  if (!token || !expiry) {
    return null;
  }
  
  // Check if token is expired
  const expiryTime = parseInt(expiry);
  if (Date.now() > expiryTime) {
    clearStudentAuth();
    return null;
  }
  
  return token;
}

export function getStudentData(): StudentData | null {
  const data = localStorage.getItem("studentData");
  if (!data) return null;
  
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function isStudentAuthenticated(): boolean {
  const token = getStudentToken();
  const data = getStudentData();
  return !!(token && data);
}

export function clearStudentAuth(): void {
  localStorage.removeItem("studentToken");
  localStorage.removeItem("studentData");
  localStorage.removeItem("studentTokenExpiry");
}

export function refreshStudentToken(): void {
  // Extend expiry if token exists and is valid
  const token = localStorage.getItem("studentToken");
  if (token) {
    localStorage.setItem("studentTokenExpiry", String(Date.now() + (30 * 24 * 60 * 60 * 1000)));
  }
}

// Auto-refresh mechanism - call this periodically to extend token life
export function maintainStudentSession(): void {
  if (isStudentAuthenticated()) {
    refreshStudentToken();
  }
}