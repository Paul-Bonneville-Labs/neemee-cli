import { getApiKey, getBaseUrl } from './config.js';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
      ...options.headers,
    },
  });

  const body = await res.json() as { success: boolean; data?: T; error?: string };

  if (!res.ok || !body.success) {
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }

  return body.data as T;
}

export interface Note {
  id: string;
  noteTitle: string;
  content: string;
  pageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  notebook?: { id: string; name: string } | null;
}

export interface Notebook {
  id: string;
  name: string;
  description: string | null;
  _count?: { notes: number };
}

export interface PaginatedNotes {
  notes: Note[];
  pagination: { page: number; limit: number; total: number };
}

export interface PaginatedNotebooks {
  notebooks: Notebook[];
  pagination: { page: number; limit: number; total: number };
}

export interface NoteUpdate {
  content: string;                 // Required by the API even on partial updates
  noteTitle?: string;
  pageUrl?: string;
  notebookId?: string | null;
  frontmatter?: Record<string, unknown>;
}

export interface NotebookUpdate {
  name?: string;
  description?: string;
}

export const api = {
  notes: {
    list: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request<PaginatedNotes>(`/api/notes/list${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<Note>(`/api/notes/${id}`),
    create: (body: { content: string; noteTitle?: string; pageUrl?: string; notebookId?: string }) =>
      request<Note>('/api/notes', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: NoteUpdate) =>
      request<Note>(`/api/notes/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/api/notes/${id}`, { method: 'DELETE' }),
  },
  notebooks: {
    list: (params: Record<string, string> = {}) => {
      const qs = new URLSearchParams(params).toString();
      return request<PaginatedNotebooks>(`/api/notebooks${qs ? `?${qs}` : ''}`);
    },
    get: (id: string) => request<Notebook>(`/api/notebooks/${id}`),
    create: (body: { name: string; description?: string }) =>
      request<Notebook>('/api/notebooks', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: NotebookUpdate) =>
      request<Notebook>(`/api/notebooks/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/api/notebooks/${id}`, { method: 'DELETE' }),
  },
  user: {
    me: () => request<{ id: string; email: string; name: string }>('/api/user/me'),
  },
};
