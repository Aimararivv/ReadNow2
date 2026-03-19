import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BooksService {

  private API_URL = environment.apiUrl + '/books';

  constructor(private http: HttpClient) {}

  getBooks() {
    return this.http.get<any[]>(this.API_URL);
  }

  searchBooks(query: string) {
    return this.http.get<any[]>(`${this.API_URL}/search?query=${query}`);
  }

  getBookById(id: string) {
    const url = `${this.API_URL}/public/${id}`;
    console.log('🔍 Obteniendo libro desde:', url);
    return this.http.get<any>(url);
  }

  getReadLink(bookId: number) {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
      console.log('🔑 Enviando token en headers:', token.substring(0, 20) + '...');
    } else {
      console.log('❌ No hay token en localStorage');
    }
    
    return this.http.get<any>(`${this.API_URL}/read/${bookId}`, { headers });
  }

  getCategories() {
    return this.http.get<string[]>(`${this.API_URL}/categories`);
  }

  getBooksByCategory(category: string) {
    return this.http.get<any[]>(`${this.API_URL}/category/${category}`);
  }
}