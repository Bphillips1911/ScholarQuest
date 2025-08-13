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
  
  // Add authorization header for student requests
  const studentToken = localStorage.getItem("studentToken");
  if (url.startsWith('/api/student/') && studentToken) {
    headers.Authorization = `Bearer ${studentToken}`;
  }
  
  // Add authorization header for teacher requests
  const teacherToken = localStorage.getItem("teacherToken");
  if (url.startsWith('/api/teacher/') && teacherToken) {
    headers.Authorization = `Bearer ${teacherToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

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
    
    // Add authorization header for student requests
    const studentToken = localStorage.getItem("studentToken");
    if (url.includes('/api/student/') && studentToken) {
      headers.Authorization = `Bearer ${studentToken}`;
    }
    
    // Add authorization header for teacher requests
    const teacherToken = localStorage.getItem("teacherToken");
    if (url.includes('/api/teacher/') && teacherToken) {
      headers.Authorization = `Bearer ${teacherToken}`;
    }
    
    const res = await fetch(url, {
      credentials: "include",
      headers,
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
