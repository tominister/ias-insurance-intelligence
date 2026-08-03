import { LogLevel } from '@azure/msal-browser'
import type { Configuration } from '@azure/msal-browser'

const clientId = (import.meta.env.VITE_AZURE_CLIENT_ID ?? '').trim()
const tenantId = (import.meta.env.VITE_AZURE_TENANT_ID ?? '').trim()

export function isAuthEnabled(): boolean {
  return Boolean(clientId && tenantId)
}

function resolveRedirectUri(): string {
  const configured = (import.meta.env.VITE_AZURE_REDIRECT_URI ?? '').trim()
  return configured || window.location.origin
}

function resolveApiScope(): string {
  const configured = (import.meta.env.VITE_AZURE_API_SCOPE ?? '').trim()
  if (configured) {
    return configured
  }
  if (!clientId) {
    return ''
  }
  return `api://${clientId}/access_as_user`
}

export const msalConfig: Configuration = {
  auth: {
    clientId,
    authority: tenantId
      ? `https://login.microsoftonline.com/${tenantId}`
      : 'https://login.microsoftonline.com/common',
    redirectUri: resolveRedirectUri(),
    postLogoutRedirectUri: resolveRedirectUri(),
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: 'sessionStorage',
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      logLevel: LogLevel.Warning,
    },
  },
}

export const loginRequest = {
  scopes: ['openid', 'profile', 'email', resolveApiScope()].filter(Boolean),
}

export const tokenRequest = {
  scopes: [resolveApiScope()].filter(Boolean),
}
