import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FavoritesService } from '../core/services/favorites.service';
import { AuthService } from '../core/services/auth.service';
import { LoggerService } from '../core/services/logger.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss']
})
export class FavoritesComponent implements OnInit {

  favorites: any[] = [];
  loading = true;
  error = false;

  constructor(
    private favoritesService: FavoritesService,
    private auth: AuthService,
    private logger: LoggerService,
    private router: Router
  ) {}

  goToHome() { this.router.navigate(['/home']); }

  openBook(book: any) {
    this.logger.info('Usuario abrió libro desde favoritos', { bookId: book.bookid, titulo: book.titulo });
    this.router.navigate(['/book', book.bookid]);
  }

  removeFavorite(event: Event, book: any) {
    event.stopPropagation();

    const token = this.auth.getToken();
    if (!token) return;

    let userId: number;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.id_usuario;
    } catch {
      this.logger.error('Error al decodificar token en removeFavorite', {});
      return;
    }

    this.favoritesService.removeFavorite(userId, book.bookid).subscribe({
      next: () => {
        this.favorites = this.favorites.filter(f => f.bookid !== book.bookid);
        this.logger.info('Libro eliminado de favoritos', { bookId: book.bookid, titulo: book.titulo });
      },
      error: (err: any) => {
        this.logger.error('Error al quitar favorito', err);
      }
    });
  }

  ngOnInit() {
    this.logger.info('Cargando página de favoritos', {});

    if (!this.auth.isLogged()) {
      this.logger.warn('Acceso a favoritos sin sesión iniciada', {});
      this.router.navigate(['/login']);
      return;
    }

    const token = this.auth.getToken();
    if (!token) {
      this.logger.error('No hay token al cargar favoritos', {});
      this.error = true;
      this.loading = false;
      return;
    }

    let userId: number;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      userId = payload.id_usuario;
    } catch {
      this.logger.error('Error al decodificar token en ngOnInit', {});
      this.error = true;
      this.loading = false;
      return;
    }

    this.favoritesService.getFavoritesByUser(userId).subscribe({
      next: (data: any[]) => {
        this.favorites = data;
        this.loading = false;
        this.logger.info('Favoritos cargados correctamente', { total: data.length, userId });
      },
      error: (err: any) => {
        this.logger.error('Error al cargar favoritos', err);
        this.error = true;
        this.loading = false;
      }
    });
  }
}