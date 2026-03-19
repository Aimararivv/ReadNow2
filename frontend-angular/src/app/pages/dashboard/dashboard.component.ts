import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BooksService } from '../../core/services/books.service';
import { AuthService, SubscriptionInfo } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';

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
    private ngZone: NgZone
  ) { }

  ngOnInit() {
    console.log('🚀 Dashboard inicializando...');
    this.bookService.getBooks().subscribe(data => {
      console.log('📚 Libros recibidos:', data);
      this.books = data;

      // Carrusel: Primeros 5 libros
      this.carouselBooks = this.books.slice(0, this.visibleBooks);
      
      // Recomendados: Libros 6-9 (diferentes al carrusel)
      this.recommendedBooks = data.slice(5, 9);
      
      // Populares: Top 4 libros con más descargas (ordenados por downloadCount)
      this.popularBooks = [...data]
        .sort((a, b) => (b.downloadCount || 0) - (a.downloadCount || 0))
        .slice(0, 4);
      
      console.log('🎠 Carousel books:', this.carouselBooks);
      console.log('⭐ Recommended books:', this.recommendedBooks);
      console.log('🔥 Popular books (by downloads):', this.popularBooks);
    });

    // Cargar información del plan del usuario
    this.loadSubscriptionInfo();
  }

  /* CARGAR INFORMACIÓN DEL PLAN */
  loadSubscriptionInfo() {
    this.auth.getSubscription().subscribe({
      next: (info) => {
        this.subscriptionInfo = info;
        this.forceUpdate();
      },
      error: (error) => {
        console.error('Error cargando información del plan:', error);
        this.subscriptionInfo = null;
        this.forceUpdate();
      }
    });
  }

  /* BUSCAR LIBROS */
  searchBooks() {
    console.log('Iniciando búsqueda con query:', this.searchQuery);
    
    if (!this.searchQuery.trim()) {
      console.log('Query vacío, limpiando resultados');
      this.searchResults = [];
      this.forceUpdate();
      return;
    }

    console.log('Llamando a bookService.searchBooks con:', this.searchQuery);
    
    this.bookService.searchBooks(this.searchQuery)
      .subscribe({
        next: (data) => {
          console.log('Respuesta recibida:', data);
          this.searchResults = data || [];
          console.log('Datos asignados. Length:', this.searchResults.length);
          console.log('Resultados completos:', this.searchResults);
          // Forzar actualización con NgZone
          this.forceUpdate();
        },
        error: (error) => {
          console.error('Error en búsqueda:', error);
          this.searchResults = [];
          this.forceUpdate();
        }
      });
  }

  /* FORZAR ACTUALIZACIÓN CON NGZONE */
  forceUpdate() {
    this.ngZone.run(() => {
      this.cdr.detectChanges();
      setTimeout(() => this.cdr.detectChanges(), 0);
    });
  }

  /* LIMPIAR BÚSQUEDA */
  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.forceUpdate();
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

    console.log('📚 Navegando a libro:', book.id, book.title);
    
    // Todos los libros son accesibles, el control de límites se maneja en el backend
    this.router.navigate(['/book', book.id]);
  }
}