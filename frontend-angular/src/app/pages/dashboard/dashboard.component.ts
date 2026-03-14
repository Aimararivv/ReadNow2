import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BooksService } from '../../core/services/books.service';
import { AuthService } from '../../core/services/auth.service';

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
    public auth: AuthService
  ) { }

  goToHome() {
    this.router.navigate(['/home']);
  }

  ngOnInit() {
    this.bookService.getBooks().subscribe(data => {
      this.books = data;

      // Carrusel: primeros 5 libros
      this.carouselBooks = this.books.slice(0, this.visibleBooks);

      // Recomendados: primeros 5
      this.recommendedBooks = data.slice(0, 5);

      // Populares: siguientes 5
      this.popularBooks = data.slice(5, 10);
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
    }
  }

  prevBooks() {
    if (this.startIndex > 0) {
      this.startIndex--;
      this.carouselBooks = this.books.slice(
        this.startIndex,
        this.startIndex + this.visibleBooks
      );
    }
  }

  // Ir a detalle del libro
  goToBook(book: any) {
    if (!book || !book.id) return;

    if (book.premium && !this.auth.isPremium()) {
      this.router.navigate(['/premium']);
    } else {
      this.router.navigate(['/book', book.id]);
    }
  }
}