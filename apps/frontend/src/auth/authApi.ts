type TokenGetter = () => Promise<string | null>

let tokenGetter: TokenGetter | null = null

export function setAccessTokenGetter(getter: TokenGetter | null): void {
  tokenGetter = getter
}

export async function getAccessToken(): Promise<string | null> {
  if (!tokenGetter) {
    return null
  }
  return tokenGetter()
}

export async function buildAuthHeaders(
  headers: Record<string, string> = {},
): Promise<Record<string, string>> {
  const token = await getAccessToken()
  if (!token) {
    return headers
  }
  return {
    ...headers,
    Authorization: `Bearer ${token}`,
  }
}
