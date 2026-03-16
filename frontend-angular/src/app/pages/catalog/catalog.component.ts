import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LoggerService } from '../../core/services/logger.service';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog.component.html',
  styleUrls: ['./catalog.component.scss']
})
export class CatalogComponent implements OnInit {
  
  books = [
    { id: 1, title: 'El Señor de los Anillos', author: 'J.R.R. Tolkien', category: 'ficcion', thumbnail: '', premium: false },
    { id: 2, title: '1984', author: 'George Orwell', category: 'ficcion', thumbnail: '', premium: false },
    { id: 3, title: 'Cien Años de Soledad', author: 'Gabriel García Márquez', category: 'ficcion', thumbnail: '', premium: true },
    { id: 13, title: 'Los Juegos del Hambre', author: 'Suzanne Collins', category: 'ficcion', thumbnail: '', premium: false },
    { id: 14, title: 'El Código Da Vinci', author: 'Dan Brown', category: 'ficcion', thumbnail: '', premium: true },
    { id: 15, title: 'El Hobbit', author: 'J.R.R. Tolkien', category: 'ficcion', thumbnail: '', premium: false },
    
    { id: 10, title: 'Sapiens', author: 'Yuval Noah Harari', category: 'no-ficcion', thumbnail: '', premium: false },
    { id: 16, title: 'Educados', author: 'Tara Westover', category: 'no-ficcion', thumbnail: '', premium: false },
    { id: 17, title: 'El Gen Egoísta', author: 'Richard Dawkins', category: 'no-ficcion', thumbnail: '', premium: true },
    { id: 18, title: 'Pensar Rápido, Pensar Despacio', author: 'Daniel Kahneman', category: 'no-ficcion', thumbnail: '', premium: false },
    
    { id: 7, title: 'Breve Historia del Tiempo', author: 'Stephen Hawking', category: 'ciencia', thumbnail: '', premium: false },
    { id: 8, title: 'El Origen de las Especies', author: 'Charles Darwin', category: 'ciencia', thumbnail: '', premium: false },
    { id: 9, title: 'Cosmos', author: 'Carl Sagan', category: 'ciencia', thumbnail: '', premium: true },
    
    { id: 19, title: 'Los Siete Hábitos de la Gente Efectiva', author: 'Stephen Covey', category: 'historia', thumbnail: '', premium: false },
    { id: 20, title: 'Meditaciones', author: 'Marco Aurelio', category: 'historia', thumbnail: '', premium: false },
    { id: 21, title: 'El Arte de la Guerra', author: 'Sun Tzu', category: 'historia', thumbnail: '', premium: true },
    
    { id: 11, title: 'El Alquimista', author: 'Paulo Coelho', category: 'autoayuda', thumbnail: '', premium: false },
    { id: 12, title: 'El Poder del Ahora', author: 'Eckhart Tolle', category: 'autoayuda', thumbnail: '', premium: true },
    { id: 22, title: 'Piense y Hágase Rico', author: 'Napoleon Hill', category: 'autoayuda', thumbnail: '', premium: false },
    
    { id: 4, title: 'El Principito', author: 'Antoine de Saint-Exupéry', category: 'infantil', thumbnail: '', premium: false },
    { id: 5, title: 'Alicia en el País de las Maravillas', author: 'Lewis Carroll', category: 'infantil', thumbnail: '', premium: false },
    { id: 6, title: 'Harry Potter', author: 'J.K. Rowling', category: 'infantil', thumbnail: '', premium: true },
    { id: 23, title: 'El León, la Bruja y el Armario', author: 'C.S. Lewis', category: 'infantil', thumbnail: '', premium: false }
  ];

  filteredBooks: any[] = [];
  currentCategory: string = '';
  categoryName: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private logger: LoggerService
  ) {}

  goToHome() {

    this.logger.log('Usuario navegó a Home desde Catalog');

    this.router.navigate(['/home']);
  }

  goToCategories() {

    this.logger.log('Usuario navegó a Categorías desde Catalog');

    this.router.navigate(['/categories']);
  }

  ngOnInit() {

    this.logger.info('CatalogComponent cargado');

    this.route.queryParams.subscribe(params => {

      const category = params['category'];

      if (category) {

        this.logger.info('Categoría recibida desde URL', category);

        this.filterByCategory(category);

      } else {

        this.logger.log('Mostrando todos los libros');

        this.filteredBooks = this.books;
        this.currentCategory = 'todos';
        this.categoryName = 'Todos los Libros';
      }
    });
  }

  filterByCategory(category: string) {

    this.logger.info('Filtrando libros por categoría', category);

    this.currentCategory = category;

    // Mapear nombres de categoría a valores en BD
    const categoryMap: { [key: string]: string } = {
      'ficción': 'ficcion',
      'no ficción': 'no-ficcion',
      'ciencia': 'ciencia',
      'historia': 'historia',
      'autoayuda': 'autoayuda',
      'infantil': 'infantil'
    };

    const categoryValue = categoryMap[category.toLowerCase()] || category;

    this.filteredBooks = this.books.filter(book => book.category === categoryValue);

    this.logger.log('Cantidad de libros encontrados', this.filteredBooks.length);

    // Mapear categoría a nombre legible
    const categoryNames: { [key: string]: string } = {
      'ficcion': 'Ficción',
      'no-ficcion': 'No Ficción',
      'ciencia': 'Ciencia',
      'historia': 'Historia',
      'autoayuda': 'Autoayuda',
      'infantil': 'Infantil'
    };

    this.categoryName = categoryNames[categoryValue] || category;
  }

  goToBook(book: any) {

    this.logger.info('Usuario abrió detalle de libro', book);

    this.router.navigate(['/book', book.id]);
  }

  goBack() {

    this.logger.log('Usuario regresó a categorías');

    this.router.navigate(['/categories']);
  }
}