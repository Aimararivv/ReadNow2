import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoggerService } from '../core/services/logger.service';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent implements OnInit {
  
  constructor(
    private router: Router,
    private logger: LoggerService
  ) {}

  ngOnInit(): void {
    this.logger.info('Cargando categorias');
  }

  goToHome() {

    this.logger.log('Usuario navegando a Home');

    this.router.navigate(['/home']);
  }

  // Aquí puedes agregar lógica de categorías si es necesario
  categories = [
    { name: 'Ficción', description: 'Novelas y relatos imaginativos', icon: '📚' },
    { name: 'No Ficción', description: 'Ensayos, biografías y textos informativos', icon: '📖' },
    { name: 'Ciencia', description: 'Libros de ciencia y tecnología', icon: '🔬' },
    { name: 'Historia', description: 'Libros de historia y sociedad', icon: '📜' },
    { name: 'Autoayuda', description: 'Crecimiento personal y motivación', icon: '💡' },
    { name: 'Infantil', description: 'Libros para niños y jóvenes', icon: '🧸' }
  ];

  viewBooks(category: string) {

    if (!category) {
      this.logger.warn('Intento de abrir una categoría vacía');
      return;
    }

    this.logger.info('Categoría seleccionada', category);

    try {

      this.router.navigate(['/catalog'], { 
        queryParams: { category: category.toLowerCase() } 
      });

      this.logger.log('Navegación al catálogo realizada');

    } catch (error) {

      this.logger.error('Error al navegar al catálogo', error);

    }
  }
}
