import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'FREE' | 'PREMIUM' | 'ADMIN';
}

export interface SubscriptionInfo {
  tieneSuscripcion: boolean;
  tipoPlan: string;
  precio?: number;
  fechaInicio?: string;
  fechaFin?: string;
  limiteDiario: number;
  leidosHoy: number;
  restantesHoy: number;
  esPremium: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = 'http://localhost:5036/api/auth';

  private user: User | null = null;
  private token: string | null = null;

  constructor(private http: HttpClient) {

  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');

  try {
    if (storedUser && storedUser !== 'undefined') {
      this.user = JSON.parse(storedUser);
    }
  } catch (e) {
    console.warn('Usuario en localStorage inválido');
    localStorage.removeItem('user');
  }

  if (storedToken && storedToken !== 'undefined') {
    this.token = storedToken;
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
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });
    return this.http.put<any>(`${this.apiUrl}/update`, data, { headers });
  }
  saveSession(user: any, token: string) {
    // Validar que el usuario y token existan
    if (!user || !token) {
      console.error('Datos de sesión inválidos:', { user, token });
      return;
    }

    const mappedUser: User = {
      id: Number(user.id_usuario),
      name: user.nombre || 'Usuario',
      email: user.correo || 'usuario@readnow.com',
      role: user.role ?? 'FREE'
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

  /* ================= SUSCRIPCIÓN ================= */
  getSubscription() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.token}`
    });
    return this.http.get<SubscriptionInfo>(`http://localhost:5036/api/books/subscription`, { headers });
  }
}