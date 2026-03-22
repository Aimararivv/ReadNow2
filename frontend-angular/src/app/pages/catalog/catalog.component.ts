import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BooksService } from '../../core/services/books.service';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {

  books: any[] = [];
  category: string = '';

  constructor(
    private route: ActivatedRoute,
    private booksService: BooksService,
    private router: Router,
    private logger: LoggerService
  ) {}

  goToHome() { this.router.navigate(['/home']); }
  goToCategories() { this.router.navigate(['/categories']); }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.category = params['category'];

      if (this.category) {
        this.booksService.getBooksByCategory(this.category).subscribe({
          next: (data) => {
            this.books = data;
          },
          error: (err) => {
            this.logger.error('Error cargando libros por categoría', err);
          }
        });
      } else {
        this.booksService.getBooks().subscribe({
          next: (data) => {
            this.books = data;
          },
          error: (err) => {
            this.logger.error('Error cargando todos los libros', err);
          }
        });
      }
    });
  }

  openBook(book: any) {
    if (!book || !book.id) {
      this.logger.warn('Intento de abrir libro inválido desde catálogo', book);
      return;
    }
    this.router.navigate(['/book', book.id]);
  }
}