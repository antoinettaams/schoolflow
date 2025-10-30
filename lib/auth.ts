// lib/auth.ts
'use client';

interface UserData {
  role: string;
  id: string;
  email: string;
  name: string;
  // Ajoutez d'autres propriétés selon vos besoins
}

class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'user_data';

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(this.tokenKey);
  }

  hasRole(requiredRole: string): boolean {
    if (typeof window === 'undefined') return false;
    
    const userData = localStorage.getItem(this.userKey);
    if (!userData) return false;

    try {
      const user: UserData = JSON.parse(userData);
      return user.role === requiredRole;
    } catch {
      return false;
    }
  }

  login(token: string, userData: UserData): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  logout(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getUser(): UserData | null {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem(this.userKey);
    if (!userData) return null;

    try {
      return JSON.parse(userData) as UserData;
    } catch {
      return null;
    }
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }
}

export const auth = new AuthService();