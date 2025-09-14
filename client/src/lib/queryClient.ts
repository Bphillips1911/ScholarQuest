import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  // Allow 304 Not Modified responses to pass through
  if (res.status === 304) {
    return;
  }
  
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
      // Clear expired tokens on 401 errors - be specific about which token to clear
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
      return null;
    }

    await throwIfResNotOk(res);
    
    // Handle 304 Not Modified responses - return cached data
    if (res.status === 304) {
      console.debug(`304 response for ${url}, returning cached data`);
      const cachedData = queryClient.getQueryData(queryKey as any);
      console.debug(`Cached data for ${url}:`, cachedData);
      if (cachedData) {
        return cachedData;
      }
      
      // CRITICAL FIX: If no cached data for 304, perform fresh fetch immediately
      console.warn(`304 response but no cached data for ${url}, performing fresh fetch`);
      const freshRes = await fetch(url, {
        headers: {
          ...headers,
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        cache: 'reload',
      });
      
      if (!freshRes.ok) {
        const text = (await freshRes.text()) || freshRes.statusText;
        throw new Error(`${freshRes.status}: ${text}`);
      }
      
      return await freshRes.json();
    }
    
    // Handle 204 No Content responses
    if (res.status === 204) {
      return null;
    }
    
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false, // Disabled global polling - set per-query where real-time needed
      refetchOnWindowFocus: false, // Disabled to prevent excessive requests in preview mode
      staleTime: 60000, // Data stays fresh for 60s to reduce request volume
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
