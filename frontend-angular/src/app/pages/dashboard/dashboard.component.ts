import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BooksService } from '../../core/services/books.service';
import { AuthService } from '../../core/services/auth.service';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  books: any[] = [];
  carouselBooks: any[] = [];

  recommendedBooks: any[] = [];
  popularBooks: any[] = [];

  startIndex = 0;
  visibleBooks = 5;

  constructor(
    private bookService: BooksService,
    private router: Router,
    public auth: AuthService,
    private logger: LoggerService
  ) { }

  goToHome() {

    this.logger.log('Usuario navegó a Home desde Dashboard');

    this.router.navigate(['/home']);
  }

  ngOnInit() {

    this.logger.info('DashboardComponent cargado');

    this.bookService.getBooks().subscribe({

      next: (data) => {

        this.logger.log('Libros cargados correctamente', data);

        this.books = data;

      // Carrusel: primeros 5 libros
        this.carouselBooks = this.books.slice(0, this.visibleBooks);

      // Recomendados: primeros 5
        this.recommendedBooks = data.slice(0, 5);

      // Populares: siguientes 5
        this.popularBooks = data.slice(5, 10);

        this.logger.info('Secciones de libros inicializadas');

      },

      error: (error) => {

        this.logger.error('Error al obtener libros del servicio', error);

      }

    });
  }

  // Carrusel
  nextBooks() {

    if (this.startIndex + this.visibleBooks < this.books.length) {

      this.startIndex++;

      this.carouselBooks = this.books.slice(
        this.startIndex,
        this.startIndex + this.visibleBooks
      );

      this.logger.log('Carrusel avanzado', { startIndex: this.startIndex });

    } else {

      this.logger.warn('Intento de avanzar carrusel sin más libros');

    }
  }

  prevBooks() {

    if (this.startIndex > 0) {

      this.startIndex--;

      this.carouselBooks = this.books.slice(
        this.startIndex,
        this.startIndex + this.visibleBooks
      );

      this.logger.log('Carrusel retrocedido', { startIndex: this.startIndex });

    } else {

      this.logger.warn('Intento de retroceder carrusel en inicio');

    }
  }

  // Ir a detalle del libro
  goToBook(book: any) {

    if (!book || !book.id) {

      this.logger.warn('Intento de abrir libro inválido', book);

      return;
    }

    this.logger.info('Usuario intentó abrir libro', book);

    if (book.premium && !this.auth.isPremium()) {

      this.logger.warn('Acceso a libro premium sin suscripción');

      this.router.navigate(['/premium']);

    } else {

      this.logger.log('Navegando al detalle del libro', book.id);

      this.router.navigate(['/book', book.id]);

    }
  }
}