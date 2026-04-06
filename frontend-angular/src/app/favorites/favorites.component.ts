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

  allFavorites: any[] = [];
  favorites: any[] = [];
  loading = true;
  error = false;

  currentPage: number = 1;
  booksPerPage: number = 20;

  get totalPages(): number {
    return Math.ceil(this.allFavorites.length / this.booksPerPage);
  }

  get totalFavorites(): number {
    return this.allFavorites.length;
  }

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

  updatePage() {
    const start = (this.currentPage - 1) * this.booksPerPage;
    const end = start + this.booksPerPage;
    this.favorites = this.allFavorites.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        this.allFavorites = this.allFavorites.filter(f => f.bookid !== book.bookid);
        this.updatePage();
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
        this.allFavorites = data;
        this.updatePage();
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