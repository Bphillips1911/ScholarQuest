import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  // Add authorization headers for all user types (30-day tokens for cost reduction)
  const studentToken = localStorage.getItem("studentToken");
  const teacherToken = localStorage.getItem("teacherToken");
  const parentToken = localStorage.getItem("parentToken");
  const adminToken = localStorage.getItem("adminToken");
  
  // Debug logging for student token
  if (url.includes('/api/mood/') || url.includes('/api/progress/') || url.includes('/api/reflection/') || url.includes('/api/student/')) {
    console.log("Student API request:", { url, hasToken: !!studentToken, tokenLength: studentToken?.length });
  }
  
  // Student routes (including mood tracking, progress, and reflection endpoints)
  if ((url.startsWith('/api/student/') || url.startsWith('/api/mood/') || 
       url.startsWith('/api/progress/') || url.startsWith('/api/reflection/')) && (studentToken || adminToken)) {
    headers.Authorization = `Bearer ${studentToken || adminToken}`;
  } else if (url.startsWith('/api/teacher/') && (teacherToken || adminToken)) {
    // Use admin token for teacher routes if admin is logged in
    headers.Authorization = `Bearer ${adminToken || teacherToken}`;
  } else if (url.startsWith('/api/parent/') && parentToken) {
    headers.Authorization = `Bearer ${parentToken}`;
  } else if (url.startsWith('/api/admin/') && adminToken) {
    headers.Authorization = `Bearer ${adminToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  // Handle token expiration by clearing localStorage
  if (res.status === 401) {
    // Only clear tokens for specific routes to avoid clearing valid tokens
    if (url.includes('/api/teacher/')) {
      localStorage.removeItem("teacherToken");
    } else if (url.includes('/api/parent/')) {
      localStorage.removeItem("parentToken");
    } else if (url.includes('/api/student/') || url.includes('/api/mood/') || 
               url.includes('/api/progress/') || url.includes('/api/reflection/')) {
      localStorage.removeItem("studentToken");
      localStorage.removeItem("studentData");
    } else if (url.includes('/api/admin/')) {
      localStorage.removeItem("adminToken");
    }
  }
  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    const headers: HeadersInit = {};
    
    // Add authorization headers for all user types (30-day tokens for cost reduction)
    const studentToken = localStorage.getItem("studentToken");
    const teacherToken = localStorage.getItem("teacherToken");
    const parentToken = localStorage.getItem("parentToken");
    const adminToken = localStorage.getItem("adminToken");
    
    // Debug logging for student token in queries
    if (url.includes('/api/mood/') || url.includes('/api/progress/') || url.includes('/api/reflection/') || url.includes('/api/student/')) {
      console.log("Student query request:", { url, hasToken: !!studentToken, tokenLength: studentToken?.length });
    }
    
    // Student routes (including mood tracking, progress, and reflection endpoints)
    if ((url.includes('/api/student/') || url.includes('/api/mood/') || 
         url.includes('/api/progress/') || url.includes('/api/reflection/')) && (studentToken || adminToken)) {
      headers.Authorization = `Bearer ${studentToken || adminToken}`;
    } else if (url.includes('/api/teacher/') && (teacherToken || adminToken)) {
      headers.Authorization = `Bearer ${teacherToken || adminToken}`;
    } else if (url.includes('/api/parent/') && parentToken) {
      headers.Authorization = `Bearer ${parentToken}`;
    } else if (url.includes('/api/admin/') && adminToken) {
      headers.Authorization = `Bearer ${adminToken}`;
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      // Clear expired tokens on 401 errors
      localStorage.removeItem("teacherToken");
      localStorage.removeItem("parentToken");
      localStorage.removeItem("studentToken");
      localStorage.removeItem("adminToken");
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
      refetchOnWindowFocus: true, // Refetch when user returns to window
      staleTime: 0, // Data is always considered stale for real-time updates
      retry: false,
    },
    mutations: {
      retry: false,
      onSuccess: () => {
        // Invalidate all relevant queries after successful mutations
        queryClient.invalidateQueries();
      },
    },
  },
});
