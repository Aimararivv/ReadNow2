import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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

export interface LogEntry {
  id?: number;
  level: string;
  message: string;
  component: string;
  user_id?: number;
  user_name?: string;
  data?: string;
  created_at: string;
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

  // Obtener logs del sistema con filtros opcionales
  getSystemLogs(filters?: { level?: string; days?: number; limit?: number }): Observable<{ logs: LogEntry[]; count: number }> {
    let params = new HttpParams();
    if (filters?.level && filters.level !== 'ALL') {
      params = params.set('level', filters.level);
    }
    if (filters?.days) {
      params = params.set('days', filters.days.toString());
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    
    return this.http.get<{ logs: LogEntry[]; count: number }>(
      `${this.apiUrl}/logs`, 
      { headers: this.getHeaders(), params }
    );
  }

  // Descargar logs como CSV
  downloadLogsCSV(filters?: { level?: string; days?: number }): void {
    let params = new HttpParams();
    if (filters?.level && filters.level !== 'ALL') {
      params = params.set('level', filters.level);
    }
    if (filters?.days) {
      params = params.set('days', filters.days.toString());
    }
    
    const token = this.authService.getToken();
    const url = `${this.apiUrl}/logs/download?${params.toString()}`;
    
    // Crear link temporal para descarga
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `logs_readnow_${new Date().toISOString().split('T')[0]}.csv`);
    
    // Agregar token en header usando fetch
    fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(response => response.blob())
    .then(blob => {
      const urlBlob = window.URL.createObjectURL(blob);
      link.href = urlBlob;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(urlBlob);
    })
    .catch(error => console.error('Error descargando CSV:', error));
  }
}
