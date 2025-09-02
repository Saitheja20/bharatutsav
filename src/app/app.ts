import { NavigationComponent } from './components/navigation/navigation';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
// import { AppNavigationComponent } from './navigation/navigation.ts'; // ✅ Adjust path if needed
// import { NavigationComponent } from './components/NavigationComponent/dashboard';

@Component({
  selector: 'app-root',
  standalone: true, // ✅ this is key
  imports: [RouterOutlet, NavigationComponent],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent {
  title = 'festival-ledger-app';
}
