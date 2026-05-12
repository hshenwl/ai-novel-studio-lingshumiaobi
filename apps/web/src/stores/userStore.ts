import { create } from 'zustand';

interface UserState {
  token: string | null;
  username: string | null;
  isLoggedIn: boolean;
  setToken: (token: string | null) => void;
  setUsername: (username: string | null) => void;
  login: (token: string, username: string) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  token: localStorage.getItem('token'),
  username: localStorage.getItem('username'),
  isLoggedIn: !!localStorage.getItem('token'),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token, isLoggedIn: !!token });
  },
  setUsername: (username) => {
    if (username) {
      localStorage.setItem('username', username);
    } else {
      localStorage.removeItem('username');
    }
    set({ username });
  },
  login: (token, username) => {
    localStorage.setItem('token', token);
    localStorage.setItem('username', username);
    set({ token, username, isLoggedIn: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    set({ token: null, username: null, isLoggedIn: false });
  },
}));