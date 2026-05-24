import { NeemeeClient } from '@neemee/shared';
import { getApiKey, getBaseUrl } from './config.js';

export type {
  Note,
  Notebook,
  Frontmatter,
  CreateNoteInput,
  UpdateNoteInput,
  PaginatedNotes,
  PaginatedNotebooks,
} from '@neemee/shared';

export interface ShareResult {
  sent: number;
  failed: number;
  failures?: { email: string; error: string }[];
}

export interface NoteUpdate {
  content: string;
  noteTitle?: string;
  pageUrl?: string;
  notebookId?: string | null;
  frontmatter?: Record<string, unknown>;
}

export interface NotebookUpdate {
  name?: string;
  description?: string;
}

let cachedClient: NeemeeClient | undefined;
function client(): NeemeeClient {
  if (!cachedClient) {
    cachedClient = new NeemeeClient({ apiKey: getApiKey(), baseUrl: getBaseUrl() });
  }
  return cachedClient;
}

async function rawRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${getBaseUrl()}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
      ...options.headers,
    },
  });
  const body = (await res.json()) as { success: boolean; data?: T; error?: string };
  if (!res.ok || !body.success) {
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return body.data as T;
}

export const api = {
  notes: {
    list: (params: Record<string, string> = {}) => {
      const c = client();
      const numericPage = params.page ? Number(params.page) : undefined;
      const numericLimit = params.limit ? Number(params.limit) : undefined;
      return c.notes.list({
        page: numericPage,
        limit: numericLimit,
        notebookId: params.notebookId,
        search: params.search,
      });
    },
    get: (id: string) => client().notes.get(id),
    create: (body: {
      content: string;
      noteTitle?: string;
      pageUrl?: string;
      notebookId?: string;
    }) => client().notes.create(body),
    update: (id: string, body: NoteUpdate) => client().notes.update(id, body),
    delete: (id: string) => client().notes.delete(id),
    share: (id: string, body: { recipients: string[]; message?: string }) =>
      rawRequest<ShareResult>(`/api/notes/${id}/share`, {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  notebooks: {
    list: (params: Record<string, string> = {}) => {
      const c = client();
      const numericPage = params.page ? Number(params.page) : undefined;
      const numericLimit = params.limit ? Number(params.limit) : undefined;
      return c.notebooks.list({ page: numericPage, limit: numericLimit });
    },
    get: (id: string) => client().notebooks.get(id),
    create: (body: { name: string; description?: string }) => client().notebooks.create(body),
    update: (id: string, body: NotebookUpdate) => client().notebooks.update(id, body),
    delete: (id: string) => client().notebooks.delete(id),
  },
  user: {
    me: () => rawRequest<{ id: string; email: string; name: string }>('/api/user/me'),
  },
};
