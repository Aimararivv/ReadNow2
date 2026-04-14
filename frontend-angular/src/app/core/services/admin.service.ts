import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

export interface User {
  id_usuario: number;
  nombre: string;
  correo: string;
  role: string;
  foto_perfil?: string;
  fecha_creacion?: string;
}

export interface Stats {
  totalUsuarios: number;
  usuariosPorRol: { role: string; count: number }[];
  totalFavoritos: number;
  totalLecturas: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = environment.apiUrl + '/admin';

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  // Obtener todos los usuarios
  getAllUsers(): Observable<{ users: User[] }> {
    return this.http.get<{ users: User[] }>(`${this.apiUrl}/users`, { headers: this.getHeaders() });
  }

  // Crear nuevo usuario
  createUser(userData: { nombre: string; correo: string; password: string; role: string }): Observable<{ user: User }> {
    return this.http.post<{ user: User }>(`${this.apiUrl}/users`, userData, { headers: this.getHeaders() });
  }

  // Eliminar usuario
  deleteUser(id_usuario: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/users/${id_usuario}`, { headers: this.getHeaders() });
  }

  // Cambiar rol de usuario
  updateUserRole(id_usuario: number, role: string): Observable<{ user: User }> {
    return this.http.put<{ user: User }>(`${this.apiUrl}/users/${id_usuario}/role`, { role }, { headers: this.getHeaders() });
  }

  // Obtener estadísticas
  getStats(): Observable<{ stats: Stats }> {
    return this.http.get<{ stats: Stats }>(`${this.apiUrl}/stats`, { headers: this.getHeaders() });
  }

  // Obtener logs del sistema
  getSystemLogs(): Observable<{ logs: any[] }> {
    return this.http.get<{ logs: any[] }>(`${this.apiUrl}/logs`, { headers: this.getHeaders() });
  }
}
