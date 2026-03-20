import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  private API = environment.apiUrl;

  constructor(private http: HttpClient) {}

  updateRole(
    id_usuario: number,
    role: string,
    cardYear?: string,
    cardNumber?: string,
    cvv?: string
  ): Observable<any> {
    
    // Obtener token del localStorage
    const token = localStorage.getItem('token');
    
    // Crear headers con autorización
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });

    return this.http.put(`${this.API}/users/update-role/${id_usuario}`, {
      role,
      cardYear,
      cardNumber,
      cvv
    }, { headers });
  }
}