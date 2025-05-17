import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface AuthResponse {
  token: string;
  user: {
    email: string;
    role: string;
  };
}

interface DecodedToken {
  email: string;
  role: string;
  userId: string;
  exp: number;
  iat: number;
}

export const authService = {
  async login(email: string, password: string): Promise<void> {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/api/auth/login`, {
        email,
        password
      });

      const { token, user } = response.data;
      
      // Validate token before storing
      if (!this.isValidToken(token)) {
        throw new Error('Invalid token received from server');
      }
      
      // Store token and user info
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set default Authorization header for all future requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
  },

  getToken(): string | null {
    const token = localStorage.getItem('token');
    if (token && !this.isValidToken(token)) {
      // Token is invalid or expired, clear it
      this.logout();
      return null;
    }
    return token;
  },

  getUser(): { email: string; role: string } | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && this.isValidToken(token);
  },

  initializeAuth(): void {
    const token = this.getToken();
    if (token && this.isValidToken(token)) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      this.logout();
    }
  },

  private isValidToken(token: string): boolean {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const decoded = JSON.parse(jsonPayload) as DecodedToken;
      
      // Check if token is expired
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp && decoded.exp < currentTime) {
        return false;
      }

      // Validate required fields
      if (!decoded.email || !decoded.userId || !decoded.role) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }
}; 