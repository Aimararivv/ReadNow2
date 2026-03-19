import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './categories.component.html',
  styleUrls: ['./categories.component.scss']
})
export class CategoriesComponent {

categories = [

{
  name: "Children's Literature",
  icon: "🧸",
  description: "Libros dirigidos a niños, con historias educativas y divertidas."
},

{
  name: "Fiction",
  icon: "📖",
  description: "Historias imaginarias llenas de creatividad, aventuras y personajes fascinantes."
},

{
  name: "Detective and Mystery Stories",
  icon: "🕵️",
  color: "mystery",
  description: "Historias de investigación, suspenso y casos por resolver."
},

{
  name: "Short Stories",
  icon: "✍️",
  color: "stories",
  description: "Relatos breves llenos de creatividad y enseñanza."
},

{
  name: "History",
  icon: "🏛️",
  color: "history",
  description: "Libros sobre acontecimientos históricos y culturas del mundo."
},

{
  name: "Composers",
  icon: "🎼",
  color: "music",
  description: "Biografías y obras de grandes compositores musicales."
},

{
  name: "Music Appreciation",
  icon: "🎵",
  color: "music2",
  description: "Libros para entender y disfrutar la música."
},

{
  name: "Philosophy",
  icon: "🧠",
  color: "philosophy",
  description: "Reflexiones sobre la vida, el pensamiento y el conocimiento."
}

];

constructor(private router:Router){}

goToCategory(category:any){

this.router.navigate(['/catalog'],{
queryParams:{category:category.name}
});

}

}