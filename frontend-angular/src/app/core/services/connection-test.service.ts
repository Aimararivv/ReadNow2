import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConnectionTestService {
  
  constructor(private http: HttpClient) {}

  testBackendConnection() {
    console.log('Testing connection to:', environment.apiUrl);
    
    this.http.get(`${environment.apiUrl}/books`).subscribe({
      next: (data) => {
        console.log('✅ Backend connection successful:', data);
      },
      error: (error) => {
        console.error('❌ Backend connection failed:', error);
      }
    });

    this.http.get(`${environment.apiUrl}/auth/test`).subscribe({
      next: (data) => {
        console.log('✅ Auth endpoint working:', data);
      },
      error: (error) => {
        console.error('❌ Auth endpoint failed:', error);
      }
    });
  }
}
