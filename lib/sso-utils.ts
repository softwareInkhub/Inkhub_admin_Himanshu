/**
 * Shared SSO utilities for all *.brmh.in domains
 * This file can be copied to other apps or published as a package
 */

export interface SSOTokens {
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
}

export interface SSOUser {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export class SSOUtils {
  private static readonly AUTH_DOMAIN = 'https://auth.brmh.in';
  private static readonly API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://brmh.in';
  private static readonly COOKIE_DOMAIN = '.brmh.in';

  /**
   * Check if user is authenticated via cookies (primary method for SSO)
   */
  static isAuthenticated(): boolean {
    if (typeof document === 'undefined') return false;
    
    const cookies = this.getCookies();
    return !!(cookies.access_token || cookies.id_token);
  }

  /**
   * Get all auth cookies
   */
  static getCookies(): Record<string, string> {
    if (typeof document === 'undefined') return {};
    
    return document.cookie.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = decodeURIComponent(value);
      }
      return acc;
    }, {} as Record<string, string>);
  }

  /**
   * Get tokens from cookies
   */
  static getTokens(): SSOTokens {
    const cookies = this.getCookies();
    return {
      accessToken: cookies.access_token,
      idToken: cookies.id_token,
      refreshToken: cookies.refresh_token,
    };
  }

  /**
   * Get user info from ID token
   */
  static getUser(): SSOUser | null {
    const tokens = this.getTokens();
    if (!tokens.idToken) return null;

    try {
      const payload = JSON.parse(atob(tokens.idToken.split('.')[1]));
      return {
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified,
        name: payload.name || `${payload.given_name || ''} ${payload.family_name || ''}`.trim(),
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
      };
    } catch (error) {
      console.error('[SSO] Failed to parse ID token:', error);
      return null;
    }
  }

  /**
   * Validate token with backend
   */
  static async validateToken(token?: string): Promise<boolean> {
    const tokenToValidate = token || this.getTokens().accessToken;
    if (!tokenToValidate) return false;

    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokenToValidate}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      return response.ok;
    } catch (error) {
      console.error('[SSO] Token validation failed:', error);
      return false;
    }
  }

  /**
   * Redirect to auth.brmh.in for login
   */
  static redirectToLogin(returnUrl?: string): void {
    const currentUrl = returnUrl || (typeof window !== 'undefined' ? window.location.href : '');
    const loginUrl = new URL('/login', this.AUTH_DOMAIN);
    if (currentUrl) {
      loginUrl.searchParams.set('next', currentUrl);
    }
    
    if (typeof window !== 'undefined') {
      window.location.href = loginUrl.toString();
    }
  }

  /**
   * Logout and redirect to auth.brmh.in
   */
  static async logout(returnUrl?: string): Promise<void> {
    const tokens = this.getTokens();
    
    // Call backend logout endpoint
    try {
      await fetch(`${this.API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
      });
    } catch (error) {
      console.error('[SSO] Logout API call failed:', error);
    }

    // Clear cookies
    this.clearCookies();

    // Clear localStorage (for backward compatibility)
    if (typeof window !== 'undefined') {
      const keysToRemove = [
        'access_token', 'id_token', 'refresh_token',
        'accessToken', 'idToken', 'refreshToken',
        'user', 'user_id', 'user_email', 'user_name'
      ];
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          // Ignore errors
        }
      });
    }

    // Redirect to auth domain
    const logoutUrl = new URL('/login', this.AUTH_DOMAIN);
    if (returnUrl) {
      logoutUrl.searchParams.set('next', returnUrl);
    }
    
    if (typeof window !== 'undefined') {
      window.location.href = logoutUrl.toString();
    }
  }

  /**
   * Clear all auth cookies
   */
  static clearCookies(): void {
    if (typeof document === 'undefined') return;

    const cookiesToClear = ['access_token', 'id_token', 'refresh_token'];
    cookiesToClear.forEach(cookieName => {
      // Clear for current domain
      document.cookie = `${cookieName}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      // Clear for .brmh.in domain
      document.cookie = `${cookieName}=; domain=${this.COOKIE_DOMAIN}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    });
  }

  /**
   * Sync tokens from cookies to localStorage (for apps that expect localStorage)
   */
  static syncTokensFromCookies(): void {
    return this.syncTokensToLocalStorage();
  }

  /**
   * Sync tokens from cookies to localStorage (for apps that expect localStorage)
   */
  static syncTokensToLocalStorage(): void {
    if (typeof window === 'undefined') return;

    const tokens = this.getTokens();
    const user = this.getUser();

    try {
      // Store tokens in both formats for compatibility
      if (tokens.accessToken) {
        localStorage.setItem('access_token', tokens.accessToken);
        localStorage.setItem('accessToken', tokens.accessToken);
      }
      if (tokens.idToken) {
        localStorage.setItem('id_token', tokens.idToken);
        localStorage.setItem('idToken', tokens.idToken);
      }
      if (tokens.refreshToken) {
        localStorage.setItem('refresh_token', tokens.refreshToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
      }

      // Store user info
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('user_id', user.sub);
        if (user.email) localStorage.setItem('user_email', user.email);
        if (user.name) localStorage.setItem('user_name', user.name);
      }
    } catch (error) {
      console.error('[SSO] Failed to sync tokens to localStorage:', error);
    }
  }

  /**
   * Refresh tokens
   */
  static async refreshTokens(): Promise<boolean> {
    const tokens = this.getTokens();
    if (!tokens.refreshToken) return false;

    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refresh_token: tokens.refreshToken }),
      });

      if (response.ok) {
        // Tokens should be updated via cookies by the backend
        return true;
      }
      return false;
    } catch (error) {
      console.error('[SSO] Token refresh failed:', error);
      return false;
    }
  }

  /**
   * Fetch user profile from backend
   */
  static async fetchUserProfile(backendUrl?: string): Promise<any> {
    const baseUrl = backendUrl || this.API_BASE_URL;
    const tokens = this.getTokens();
    const accessToken = tokens.accessToken || (typeof localStorage !== 'undefined' ? localStorage.getItem('access_token') : null);
    
    if (!accessToken) {
      throw new Error('No access token available');
    }

    try {
      const response = await fetch(`${baseUrl}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          const refreshed = await this.refreshTokens();
          if (!refreshed) {
            throw new Error('Authentication expired');
          }
          // Retry with new token
          return this.fetchUserProfile(backendUrl);
        }
        throw new Error(`Failed to fetch user profile: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[SSO] Failed to fetch user profile:', error);
      throw error;
    }
  }

  /**
   * Initialize SSO for an app (call this on app startup)
   */
  static async initialize(): Promise<{ isAuthenticated: boolean; user: SSOUser | null }> {
    // Check if authenticated via cookies
    const isAuthenticated = this.isAuthenticated();
    
    if (isAuthenticated) {
      // Sync tokens to localStorage for backward compatibility
      this.syncTokensToLocalStorage();
      
      // Validate token
      const isValid = await this.validateToken();
      if (!isValid) {
        // Try to refresh
        const refreshed = await this.refreshTokens();
        if (!refreshed) {
          this.clearCookies();
          return { isAuthenticated: false, user: null };
        }
      }
      
      const user = this.getUser();
      return { isAuthenticated: true, user };
    }

    return { isAuthenticated: false, user: null };
  }
}

// Export for backward compatibility
export const AuthService = SSOUtils;
