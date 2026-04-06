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

  allBooks: any[] = [];
  books: any[] = [];
  category: string = '';

  currentPage: number = 1;
  booksPerPage: number = 20;

  get totalPages(): number {
    return Math.ceil(this.allBooks.length / this.booksPerPage);
  }

  get totalBooks(): number {
    return this.allBooks.length;
  }

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
            this.allBooks = data;
            this.updatePage();
          },
          error: (err) => {
            this.logger.error('Error cargando libros por categoría', err);
          }
        });
      } else {
        this.booksService.getBooks().subscribe({
          next: (data) => {
            this.allBooks = data;
            this.updatePage();
          },
          error: (err) => {
            this.logger.error('Error cargando todos los libros', err);
          }
        });
      }
    });
  }

  updatePage() {
    const start = (this.currentPage - 1) * this.booksPerPage;
    const end = start + this.booksPerPage;
    this.books = this.allBooks.slice(start, end);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.updatePage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  openBook(book: any) {
    if (!book || !book.id) {
      this.logger.warn('Intento de abrir libro inválido desde catálogo', book);
      return;
    }
    this.router.navigate(['/book', book.id], {
      queryParams: { category: this.category }
    });
  }
}