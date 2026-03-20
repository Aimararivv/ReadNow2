import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { BooksService } from '../core/services/books.service';
import { AuthService } from '../core/services/auth.service';
import { LoggerService } from '../core/services/logger.service';

@Component({
  selector: 'app-resultados',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './Resultados.component.html',
  styleUrls: ['./Resultados.component.scss']
})
export class ResultadosComponent implements OnInit {

  query = '';
  books: any[] = [];
  loading = false;
  error = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private booksService: BooksService,
    public auth: AuthService,
    private logger: LoggerService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.query = params['q'] || '';
      if (this.query) {
        this.search();
      }
    });
  }

  search() {
    if (!this.query.trim()) return;

    this.loading = true;
    this.error = false;
    this.books = [];

    this.logger.info('Buscando libros', { query: this.query });

    this.booksService.searchBooks(this.query).subscribe({
      next: (data) => {
        this.books = data;
        this.loading = false;
        this.logger.log('Resultados obtenidos', { total: data.length });
      },
      error: (err) => {
        this.error = true;
        this.loading = false;
        this.logger.error('Error en búsqueda', err);
      }
    });
  }

  goToHome() {
    this.router.navigate(['/home']);
  }

  openBook(book: any) {    if (!book?.id) return;

    if (book.premium && !this.auth.isPremium()) {
      this.router.navigate(['/premium']);
    } else {
      this.router.navigate(['/book', book.id]);
    }
  }
}