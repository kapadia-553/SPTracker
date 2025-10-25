import { Component } from '@angular/core';

@Component({
 selector: 'app-root',
 template: `
   <div class="min-h-screen bg-gray-50">
     <router-outlet></router-outlet>
   </div>
 `
})
export class AppComponent {
 title = 'SP Track - Agent Dashboard';
}