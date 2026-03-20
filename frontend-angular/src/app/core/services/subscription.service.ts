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

  updateRole(id_usuario: number, role: string, cardYear?: string, cardNumber?: string, cvv?: string): Observable<any> {
    const token = localStorage.getItem('token');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = { role, cardYear, cardNumber, cvv };

    return this.http.put(`${this.API}/users/update-role/${id_usuario}`, body, { headers });
  }

  saveCardData(id_usuario: number, cardNumber: string, cardYear: string): Observable<any> {
    const token = localStorage.getItem('token');
    
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const body = { cardNumber, cardYear };

    return this.http.put(`${this.API}/users/save-card-data/${id_usuario}`, body, { headers });
  }
}