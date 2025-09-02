// import 'zone.js';

// import { enableProdMode, importProvidersFrom } from '@angular/core';
// import { bootstrapApplication } from '@angular/platform-browser';
// // import { AppComponent } from './app/app.ts';  // ✅ Replace this with your root standalone component
// import { environment } from './environments/environment'; // ✅ Adjust path if needed
// import { AppComponent } from './app/app'; // ✅ CORRECT

// import 'zone.js';  // Keep this if you want Zone.js enabled

// import { enableProdMode, NgZone } from '@angular/core';
// import { bootstrapApplication } from '@angular/platform-browser';
// import { AppComponent } from './app/app';
// import { environment } from './environments/environment';

// if (environment.production) {
//   enableProdMode();
// }

// // If you want to disable Zone.js (zone-less mode), use this:
// bootstrapApplication(AppComponent, {
//   providers: [
//     { provide: NgZone, useValue: null }
//   ]
// })
// .catch(err => console.error(err));


import { enableProdMode, NgZone } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Disable Zone.js by providing NgZone as null
bootstrapApplication(AppComponent, {
  providers: [
    { provide: NgZone, useValue: null }
  ]
})
.catch(err => console.error(err));
