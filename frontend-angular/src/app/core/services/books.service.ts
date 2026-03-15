import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BooksService {

  private API_URL = 'http://localhost:5036/api/books';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  /* LISTA DE LIBROS */
  getBooks() {
    return this.http.get<any[]>(this.API_URL);
  }

  /* BUSCAR LIBROS */
  searchBooks(query: string) {
    const url = `${this.API_URL}/search?query=${query}`;
    console.log('📚 BooksService.searchBooks - URL:', url);
    
    return this.http.get<any[]>(url);
  }

  /* LIBRO POR ID */
  getBookById(id: string) {
    const token = this.auth.getToken();
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<any>(`${this.API_URL}/${id}`, { headers });
  }

  /* OBTENER ENLACE DE LECTURA */
  getReadLink(bookId: number, token: string) {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
    return this.http.get<any>(`${this.API_URL}/read/${bookId}`, { headers });
  }
}