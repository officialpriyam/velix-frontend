const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005/api';

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);
            return true;
        }
    } catch {}
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        return ok;
    } catch { return false; }
}

async function safeJson(res: Response) {
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: text.substring(0, 300) || 'Unknown error' }; }
}

export const aiApi = {
    generate: async (prompt: string, language: string, model?: string, sessionId?: string, platform?: string) => {
        const res = await fetch(`${BASE_URL}/ai/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ prompt, language, model, sessionId, platform })
        });
        return safeJson(res);
    },
    getModels: async () => {
        const res = await fetch(`${BASE_URL}/ai/models`, { credentials: 'include' });
        const text = await res.text();
        try { return JSON.parse(text); } catch { console.error('[api] /models returned non-JSON:', text.substring(0, 200)); return []; }
    },
    getMessages: async (sessionId: string) => {
        const res = await fetch(`${BASE_URL}/ai/messages/${sessionId}`, { credentials: 'include' });
        return safeJson(res);
    },
    deleteProject: async (sessionId: string) => {
        const res = await fetch(`${BASE_URL}/ai/projects/${sessionId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return safeJson(res);
    },
    toggleVisibility: async (sessionId: string, isPublic: boolean) => {
        const res = await fetch(`${BASE_URL}/ai/projects/${sessionId}/visibility`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ isPublic })
        });
        return safeJson(res);
    },
    renameProject: async (sessionId: string, name: string) => {
        const res = await fetch(`${BASE_URL}/ai/projects/${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ name })
        });
        return safeJson(res);
    },
    updateModel: async (sessionId: string, model: string) => {
        const res = await fetch(`${BASE_URL}/ai/projects/${sessionId}/model`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ model })
        });
        return safeJson(res);
    },
    getCommunityProjects: async () => {
        const res = await fetch(`${BASE_URL}/ai/community`, { credentials: 'include' });
        return safeJson(res);
    },
    fork: async (sessionId: string) => {
        const res = await fetch(`${BASE_URL}/ai/fork/${sessionId}`, {
            method: 'POST',
            credentials: 'include'
        });
        return safeJson(res);
    },
    enhancePrompt: async (prompt: string, platform?: string) => {
        const res = await fetch(`${BASE_URL}/ai/enhance-prompt`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ prompt, platform })
        });
        return safeJson(res);
    },
    getProjectSettings: async (sessionId: string) => {
        const res = await fetch(`${BASE_URL}/ai/projects/${sessionId}/settings`, { credentials: 'include' });
        return safeJson(res);
    },
    updateProjectSettings: async (sessionId: string, settings: Record<string, any>) => {
        const res = await fetch(`${BASE_URL}/ai/projects/${sessionId}/settings`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ settings })
        });
        return safeJson(res);
    }
};

export const fileApi = {
    saveFiles: async (sessionId: string, files: { [path: string]: string }) => {
        const res = await fetch(`${BASE_URL}/files/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sessionId, files })
        });
        return safeJson(res);
    },
    getFiles: async (sessionId: string) => {
        const res = await fetch(`${BASE_URL}/files/${sessionId}`, { credentials: 'include' });
        return safeJson(res);
    },
    create: async (sessionId: string, path: string, content: string = '') => {
        const res = await fetch(`${BASE_URL}/files/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sessionId, path, content })
        });
        return safeJson(res);
    },
    createFolder: async (sessionId: string, path: string) => {
        const res = await fetch(`${BASE_URL}/files/folder`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sessionId, path })
        });
        return safeJson(res);
    },
    delete: async (sessionId: string, path: string) => {
        const res = await fetch(`${BASE_URL}/files/delete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sessionId, path })
        });
        return safeJson(res);
    },
    rename: async (sessionId: string, oldPath: string, newPath: string) => {
        const res = await fetch(`${BASE_URL}/files/rename`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sessionId, oldPath, newPath })
        });
        return safeJson(res);
    },
    listSessions: async () => {
        const res = await fetch(`${BASE_URL}/files/list/all`, { credentials: 'include' });
        return safeJson(res);
    },
    upload: async (sessionId: string, files: File[], targetPath: string = '') => {
        const formData = new FormData();
        formData.append('sessionId', sessionId);
        formData.append('targetPath', targetPath);
        files.forEach(file => formData.append('files', file));

        const res = await fetch(`${BASE_URL}/files/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        return safeJson(res);
    },
    unzip: async (sessionId: string, path: string) => {
        const res = await fetch(`${BASE_URL}/files/unzip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sessionId, path })
        });
        return safeJson(res);
    },
    download: (sessionId: string, path: string) => {
        window.location.href = `${BASE_URL}/files/download/file?sessionId=${sessionId}&path=${encodeURIComponent(path)}`;
    },
    downloadAll: (sessionId: string) => {
        window.location.href = `${BASE_URL}/files/download/all?sessionId=${sessionId}`;
    }
};

export const compilerApi = {
    run: async (sessionId: string, language: string) => {
        const res = await fetch(`${BASE_URL}/compiler/run`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sessionId, language })
        });
        return safeJson(res);
    },
    getHistory: async (sessionId: string) => {
        const res = await fetch(`${BASE_URL}/compiler/history/${sessionId}`, { credentials: 'include' });
        return safeJson(res);
    },
    downloadArtifact: (historyId: number) => {
        window.location.href = `${BASE_URL}/compiler/artifact/${historyId}`;
    },
    getJavaVersions: async () => {
        try {
            const res = await fetch(`${BASE_URL}/compiler/java-versions`, { credentials: 'include' });
            if (!res.ok) return null;
            return safeJson(res);
        } catch { return null; }
    }
};

export const authApi = {
    register: async (email: string, name: string, password: string) => {
        const res = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, name, password })
        });
        return safeJson(res);
    },
    login: async (email: string, password: string) => {
        const res = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        return safeJson(res);
    },
    me: async () => {
        const res = await fetch(`${BASE_URL}/auth/me`, { credentials: 'include' });
        return safeJson(res);
    },
    logout: async () => {
        const res = await fetch(`${BASE_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
        return safeJson(res);
    },
    oauth: async (accessToken: string) => {
        const res = await fetch(`${BASE_URL}/auth/oauth`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ access_token: accessToken })
        });
        return safeJson(res);
    },
    updateProfile: async (data: { displayName: string; email: string; discordId?: string }) => {
        const res = await fetch(`${BASE_URL}/auth/profile`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(data)
        });
        return safeJson(res);
    },
    updatePreferences: async (prefs: {
        history_quick_access?: boolean;
        email_notifications?: boolean;
        paste_as_file?: boolean;
        texture_generation?: boolean;
        knowledge_refractor?: boolean;
    }) => {
        const res = await fetch(`${BASE_URL}/auth/preferences`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(prefs)
        });
        return safeJson(res);
    },
    getCredits: async () => {
        const res = await fetch(`${BASE_URL}/auth/credits`, { credentials: 'include' });
        return safeJson(res);
    },
    getPricingConfig: async () => {
        const res = await fetch(`${BASE_URL}/auth/pricing`, { credentials: 'include' });
        return safeJson(res);
    },
    getSiteStatus: async () => {
        const res = await fetch(`${BASE_URL}/auth/site-status`, { credentials: 'include' });
        return safeJson(res);
    },
    buyCredits: async (amount: number, packName: string) => {
        const res = await fetch(`${BASE_URL}/auth/buy-credits`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ amount, packName })
        });
        return safeJson(res);
    },
    getPublicProfile: async (profileId: string) => {
        const res = await fetch(`${BASE_URL}/auth/profile/${profileId}`, { credentials: 'include' });
        return safeJson(res);
    }
};

export const adminApi = {
    login: async (password: string) => {
        const res = await fetch(`${BASE_URL}/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ password })
        });
        return safeJson(res);
    },
    getUsers: async () => {
        const res = await fetch(`${BASE_URL}/admin/users`, { credentials: 'include' });
        return safeJson(res);
    },
    deleteUser: async (id: string) => {
        const res = await fetch(`${BASE_URL}/admin/users/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return safeJson(res);
    },
    getSettings: async () => {
        const res = await fetch(`${BASE_URL}/admin/settings`, { credentials: 'include' });
        return safeJson(res);
    },
    saveSettings: async (settings: any) => {
        const res = await fetch(`${BASE_URL}/admin/settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(settings)
        });
        return safeJson(res);
    }
};

export const versionsApi = {
    getStats: async (sessionId: string) => {
        const res = await fetch(`${BASE_URL}/versions/stats/${sessionId}`, { credentials: 'include' });
        return safeJson(res);
    },
    getVersions: async (sessionId: string, type: string = 'all') => {
        const res = await fetch(`${BASE_URL}/versions/${sessionId}?type=${type}`, { credentials: 'include' });
        return safeJson(res);
    },
    getVersionDetail: async (versionId: number) => {
        const res = await fetch(`${BASE_URL}/versions/detail/${versionId}`, { credentials: 'include' });
        return safeJson(res);
    },
    restore: async (sessionId: string, versionId: number) => {
        const res = await fetch(`${BASE_URL}/versions/${sessionId}/${versionId}/restore`, {
            method: 'POST',
            credentials: 'include'
        });
        return safeJson(res);
    }
};

export const dependenciesApi = {
    getDependencies: async (sessionId: string) => {
        const res = await fetch(`${BASE_URL}/dependencies/${sessionId}`, { credentials: 'include' });
        return safeJson(res);
    },
    upload: async (sessionId: string, file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${BASE_URL}/dependencies/${sessionId}/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        });
        return safeJson(res);
    },
    remove: async (sessionId: string, depId: number) => {
        const res = await fetch(`${BASE_URL}/dependencies/${sessionId}/${depId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return safeJson(res);
    },
    download: (sessionId: string, depId: number) => {
        window.location.href = `${BASE_URL}/dependencies/${sessionId}/${depId}/download`;
    },
    toggleShade: async (sessionId: string, depId: number, isShaded: boolean) => {
        const res = await fetch(`${BASE_URL}/dependencies/${sessionId}/${depId}/shade`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ isShaded })
        });
        return safeJson(res);
    }
};

export interface WikiPage {
    id: string;
    project_id: string;
    title: string;
    slug: string;
    content: string;
    sort_order: number;
    is_public: number;
    created_at: string;
    updated_at: string;
}

export const wikiApi = {
    getPages: async (projectId: string): Promise<WikiPage[]> => {
        const res = await fetch(`${BASE_URL}/wiki/projects/${projectId}/pages`, { credentials: 'include' });
        return safeJson(res);
    },
    getPage: async (pageId: string): Promise<WikiPage> => {
        const res = await fetch(`${BASE_URL}/wiki/pages/${pageId}`, { credentials: 'include' });
        return safeJson(res);
    },
    createPage: async (projectId: string, title: string, slug?: string, content?: string): Promise<WikiPage> => {
        const res = await fetch(`${BASE_URL}/wiki/projects/${projectId}/pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ title, slug, content })
        });
        return safeJson(res);
    },
    updatePage: async (pageId: string, updates: Partial<Pick<WikiPage, 'title' | 'content' | 'slug' | 'sort_order' | 'is_public'>>): Promise<any> => {
        const res = await fetch(`${BASE_URL}/wiki/pages/${pageId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(updates)
        });
        return safeJson(res);
    },
    deletePage: async (pageId: string): Promise<any> => {
        const res = await fetch(`${BASE_URL}/wiki/pages/${pageId}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return safeJson(res);
    },
    generate: async (projectId: string, prompt: string, type?: string): Promise<{ page?: WikiPage; rawResponse?: string; creditsUsed?: number; creditsRemaining?: number; error?: string }> => {
        const res = await fetch(`${BASE_URL}/wiki/projects/${projectId}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ prompt, type })
        });
        return safeJson(res);
    },
    toggleVisibility: async (pageId: string, isPublic: boolean): Promise<any> => {
        const res = await fetch(`${BASE_URL}/wiki/pages/${pageId}/visibility`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ is_public: isPublic })
        });
        return safeJson(res);
    }
};

export const imageApi = {
    generate: async (prompt: string, aspectRatio?: string, provider?: string) => {
        const res = await fetch(`${BASE_URL}/images/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ prompt, aspectRatio, provider })
        });
        return safeJson(res);
    },
    getRatios: async () => {
        const res = await fetch(`${BASE_URL}/images/ratios`, { credentials: 'include' });
        return safeJson(res);
    }
};

export const modelgenApi = {
    generate: async (prompt: string) => {
        const res = await fetch(`${BASE_URL}/modelgen/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ prompt })
        });
        return safeJson(res);
    },
    downloadSchematic: async (filename: string) => {
        const res = await fetch(`${BASE_URL}/modelgen/download/${encodeURIComponent(filename)}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Download failed');
        return res.blob();
    },
    getExamples: async () => {
        const res = await fetch(`${BASE_URL}/modelgen/examples`, { credentials: 'include' });
        return safeJson(res);
    },
    getStatus: async () => {
        const res = await fetch(`${BASE_URL}/modelgen/status`, { credentials: 'include' });
        return safeJson(res);
    },
    getHistory: async () => {
        const res = await fetch(`${BASE_URL}/modelgen/history`, { credentials: 'include' });
        return safeJson(res);
    },
    getGeneration: async (id: number) => {
        const res = await fetch(`${BASE_URL}/modelgen/history/${id}`, { credentials: 'include' });
        return safeJson(res);
    },
    deleteGeneration: async (id: number) => {
        const res = await fetch(`${BASE_URL}/modelgen/history/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return safeJson(res);
    }
};

export const gitbookApi = {
    connect: async (token: string) => {
        const res = await fetch(`${BASE_URL}/gitbook/connect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ token })
        });
        return safeJson(res);
    },
    getStatus: async () => {
        const res = await fetch(`${BASE_URL}/gitbook/status`, { credentials: 'include' });
        return safeJson(res);
    },
    disconnect: async () => {
        const res = await fetch(`${BASE_URL}/gitbook/disconnect`, {
            method: 'DELETE',
            credentials: 'include'
        });
        return safeJson(res);
    },
    getOrganizations: async () => {
        const res = await fetch(`${BASE_URL}/gitbook/organizations`, { credentials: 'include' });
        return safeJson(res);
    },
    createSpace: async (organizationId: string, title: string) => {
        const res = await fetch(`${BASE_URL}/gitbook/create-space`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ organizationId, title })
        });
        return safeJson(res);
    },
    importPages: async (spaceId: string, pages: Array<{ title: string; content: string }>) => {
        const res = await fetch(`${BASE_URL}/gitbook/import-pages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ spaceId, pages })
        });
        return safeJson(res);
    },
    getSpacePages: async (spaceId: string) => {
        const res = await fetch(`${BASE_URL}/gitbook/spaces/${encodeURIComponent(spaceId)}/pages`, { credentials: 'include' });
        return safeJson(res);
    },
    generateWiki: async (projectId: string, spaceId?: string, organizationId?: string) => {
        const res = await fetch(`${BASE_URL}/gitbook/generate-wiki`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ projectId, spaceId, organizationId })
        });
        return safeJson(res);
    }
};
