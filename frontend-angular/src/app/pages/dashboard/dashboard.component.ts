import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BooksService } from '../../core/services/books.service';
import { AuthService, SubscriptionInfo } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {

  books: any[] = [];
  carouselBooks: any[] = [];
  recommendedBooks: any[] = [];
  popularBooks: any[] = [];

  searchQuery = '';
  searchResults: any[] = [];
  subscriptionInfo: SubscriptionInfo | null = null;

  startIndex = 0;
  visibleBooks = 5;

  constructor(
    private bookService: BooksService,
    private router: Router,
    public auth: AuthService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private logger: LoggerService
  ) { }

  ngOnInit() {
    this.bookService.getBooks().subscribe({
      next: (data) => {
        this.books = data;
        this.carouselBooks = this.books.slice(0, this.visibleBooks);
        this.recommendedBooks = data.slice(5, 9);
        this.popularBooks = [...data]
          .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
          .slice(0, 4);
      },
      error: (error) => {
        this.logger.error('Error obteniendo libros del dashboard', error);
      }
    });

    this.loadSubscriptionInfo();
  }

  loadSubscriptionInfo() {
    this.auth.getSubscription().subscribe({
      next: (info) => {
        this.subscriptionInfo = info;
        this.forceUpdate();
      },
      error: (error) => {
        this.logger.error('Error cargando información del plan', error);
        this.subscriptionInfo = null;
        this.forceUpdate();
      }
    });
  }

  forceUpdate() {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
      setTimeout(() => this.cdr.detectChanges(), 0);
    });
  }

  nextBooks() {
    if (this.startIndex + this.visibleBooks < this.books.length) {
      this.startIndex++;
      this.carouselBooks = this.books.slice(this.startIndex, this.startIndex + this.visibleBooks);
    }
  }

  prevBooks() {
    if (this.startIndex > 0) {
      this.startIndex--;
      this.carouselBooks = this.books.slice(this.startIndex, this.startIndex + this.visibleBooks);
    }
  }

  goToBook(book: any) {
    if (!book || !book.id) {
      this.logger.warn('Libro inválido al navegar desde dashboard');
      return;
    }
    this.router.navigate(['/book', book.id]);
  }
}