import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'FREE' | 'PREMIUM' | 'ADMIN';
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:3000/api/auth';

  private user: User | null = null;
  private token: string | null = null;

  constructor(private http: HttpClient) {
    // Limpiar sesión solo al iniciar el sistema (no al refrescar)
    this.clearSessionOnFirstLoad();
  }

  // Limpiar sesión solo la primera vez que se carga la aplicación
  private clearSessionOnFirstLoad(): void {
    // Verificar si es la primera carga usando sessionStorage
    const isFirstLoad = !sessionStorage.getItem('appInitialized');
    
    if (isFirstLoad) {
      // Limpiar localStorage y sessionStorage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      sessionStorage.removeItem('lastActiveTime');
      
      // Resetear variables internas
      this.user = null;
      this.token = null;
      
      // Marcar que la aplicación ya fue inicializada
      sessionStorage.setItem('appInitialized', 'true');
      
      console.log('Sesión limpiada al iniciar el sistema por primera vez');
    } else {
      // Si no es la primera carga, recuperar sesión si existe
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('token');
      if (storedUser) this.user = JSON.parse(storedUser);
      if (storedToken) this.token = storedToken;
      
      console.log('Refrescando página - manteniendo sesión existente');
    }
  }

  /* ================= BACKEND ================= */
  loginBackend(data: any) {
    return this.http.post<any>(`${this.apiUrl}/login`, data);
  }
  register(data: any) {
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }
  updateProfile(data: any) {
    return this.http.put<any>(`${this.apiUrl}/update`, data);
  }
  deleteAccount() {
    return this.http.delete<any>(`${this.apiUrl}/delete`);
  }
  saveSession(user: any, token: string) {

    const mappedUser: User = {
      id: Number(user.id_usuario),
      name: user.nombre,
      email: user.correo || 'usuario@readnow.com',
      role: user.role ?? 'FREE',
      createdAt: user.fecha_creacion || null
    };
    this.user = mappedUser;
    this.token = token;
    localStorage.setItem('user', JSON.stringify(mappedUser));
    localStorage.setItem('token', token);
  }

  /* ================= LOGIN LOCAL ================= */

  login(user: User) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  /* ================= LOGOUT ================= */
  logout() {
    this.user = null;
    this.token = null;
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    sessionStorage.removeItem('lastActiveTime');
    sessionStorage.removeItem('appInitialized');
  }

  /* ================= GETTERS ================= */
  getUser(): User | null {
    return this.user;
  }
  getToken(): string | null {
    return this.token;
  }
  isLogged(): boolean {
    return !!this.user;
  }
  isAdmin(): boolean {
    return this.user?.role === 'ADMIN';
  }
  isPremium(): boolean {
    return this.user?.role === 'PREMIUM';
  }
}