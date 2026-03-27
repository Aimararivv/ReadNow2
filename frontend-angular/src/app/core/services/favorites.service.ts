import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  private API_URL = environment.apiUrl + '/favorites';

  constructor(
    private http: HttpClient,
    private auth: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const token = this.auth.getToken();
    return new HttpHeaders(token ? { Authorization: `Bearer ${token}` } : {});
  }

  addFavorite(data: {
    bookid: number;
    titulo: string;
    autor: string;
    imagen: string;
  }) {
    return this.http.post(this.API_URL, data, { headers: this.getHeaders() });
  }

  removeFavorite(usuarioid: number, bookid: number) {
    return this.http.delete(`${this.API_URL}/${usuarioid}/${bookid}`, {
      headers: this.getHeaders()
    });
  }

  getFavoritesByUser(usuarioid: number) {
    return this.http.get<any[]>(`${this.API_URL}/user/${usuarioid}`, {
      headers: this.getHeaders()
    });
  }

  checkFavorite(usuarioid: number, bookid: number) {
    return this.http.get<{ isFavorite: boolean }>(
      `${this.API_URL}/check/${usuarioid}/${bookid}`,
      { headers: this.getHeaders() }
    );
  }
}