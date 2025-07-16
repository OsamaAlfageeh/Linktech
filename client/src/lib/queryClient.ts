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
  console.log(`API Request: ${method} ${url}`, data ? data : '(no data)');
  
  try {
    const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
    
    // أضافة JWT token إذا كان متوفراً
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });
    
    if (!res.ok) {
      console.error(`API Error: ${method} ${url} returned ${res.status} ${res.statusText}`);
      try {
        const errorText = await res.text();
        console.error('Error response:', errorText);
        throw new Error(`${res.status}: ${errorText || res.statusText}`);
      } catch (e) {
        // Re-throw the error
        throw e;
      }
    } else {
      console.log(`API Success: ${method} ${url} - Status: ${res.status}`);
    }
    
    return res;
  } catch (error) {
    console.error(`API Request failed: ${method} ${url}`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: HeadersInit = {};
    
    // أضافة JWT token إذا كان متوفراً
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    const res = await fetch(queryKey[0] as string, {
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
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on 401 Unauthorized or 403 Forbidden
        if (error instanceof Error) {
          if (error.message.startsWith('401:') || error.message.startsWith('403:')) {
            return false;
          }
        }
        return failureCount < 2; // retry twice on other errors
      },
    },
    mutations: {
      retry: false,
    },
  },
});
