import { getFirebaseAuth } from './firebase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

async function getAuthHeaders(): Promise<HeadersInit> {
  const user = getFirebaseAuth().currentUser;
  if (!user) return {};
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const authHeaders = await getAuthHeaders();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || data.error || 'Request failed');
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  uploadFile: async <T>(path: string, file: File, fieldName = 'file'): Promise<T> => {
    const authHeaders = await getAuthHeaders();
    const formData = new FormData();
    formData.append(fieldName, file);
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { ...authHeaders },
      body: formData,
    });
    if (res.status === 413) {
      throw new Error('File is too large. Maximum size is 4 MB.');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Upload failed');
    return data as T;
  },

  uploadFiles: async <T>(path: string, files: File[], fieldName = 'images'): Promise<T> => {
    const authHeaders = await getAuthHeaders();
    const formData = new FormData();
    files.forEach((f) => formData.append(fieldName, f));
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { ...authHeaders },
        body: formData,
      });
    } catch {
      throw new Error('Images are too large to upload. Please use smaller images.');
    }
    if (res.status === 413) {
      throw new Error('Images are too large. Maximum size is 4 MB per image.');
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || 'Upload failed');
    return data as T;
  },
};
