const MCP_API_URL = 'https://mcp-api.deriv.com/mcp';

export function getMCPApiUrl(): string {
    return MCP_API_URL;
}

export function getMCPHeaders(bearerToken?: string): HeadersInit {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (bearerToken) {
        headers['Authorization'] = `Bearer ${bearerToken}`;
    }
    return headers;
}

export async function callMCPApi<T = unknown>(
    method: string,
    params: Record<string, unknown> = {},
    bearerToken?: string
): Promise<T> {
    const token = bearerToken || sessionStorage.getItem('mcp_bearer_token') || '';
    const response = await fetch(MCP_API_URL, {
        method: 'POST',
        headers: getMCPHeaders(token),
        body: JSON.stringify({ method, params }),
    });
    if (!response.ok) {
        throw new Error(`MCP API error: ${response.status} ${response.statusText}`);
    }
    return response.json() as Promise<T>;
}

export function storeMCPToken(token: string): void {
    sessionStorage.setItem('mcp_bearer_token', token);
}

export function getMCPToken(): string | null {
    return sessionStorage.getItem('mcp_bearer_token');
}
