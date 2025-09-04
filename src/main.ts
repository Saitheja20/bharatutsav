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

//  import 'zone.js';
// import { enableProdMode,} from '@angular/core';
// import { bootstrapApplication } from '@angular/platform-browser';
// import { AppComponent } from './app/app';
// import { environment } from './environments/environment';

// if (environment.production) {
//   enableProdMode();
// }

// // Disable Zone.js by providing NgZone as null
// bootstrapApplication(AppComponent, {
//   providers: [
//     { provide: NgZone, useValue: null }
//   ]
// })
// .catch(err => console.error(err));


// import { bootstrapApplication } from '@angular/platform-browser';
// import { AppComponent } from './app/app';
// import { importProvidersFrom } from '@angular/core';
// import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
// import { getAuth, provideAuth, setPersistence, browserLocalPersistence } from '@angular/fire/auth';
// import { getFirestore, provideFirestore } from '@angular/fire/firestore';

// const firebaseConfig = {
//   // your config
// };

// // Initialize Firebase with persistence
// const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);

// // Set persistence to survive browser refresh
// setPersistence(auth, browserLocalPersistence).catch((error) => {
//   console.error('Failed to set auth persistence:', error);
// });

// bootstrapApplication(AppComponent, {
//   providers: [
//     provideFirebaseApp(() => app),
//     provideAuth(() => auth),
//     provideFirestore(() => getFirestore(app)),
//     // ... other providers
//   ]
// });

// ✅ CRITICAL: Import Zone.js FIRST (uncomment this line)
// ✅ FIXED main.ts
import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app';
import { provideRouter } from '@angular/router';
import { routes } from './app/app.routes';

// ✅ Correct Firebase imports
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

import { environment } from './environments/environment';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),

    // ✅ Simplified Firebase setup (no manual persistence)
    provideFirebaseApp(() => {
      const app = initializeApp(environment.firebaseConfig);
      console.log('🔥 Firebase app initialized');
      return app;
    }),

    provideAuth(() => {
      const auth = getAuth();
      console.log('🔐 Firebase Auth initialized');
      return auth; // Remove manual setPersistence - it's automatic
    }),

    provideFirestore(() => {
      const firestore = getFirestore();
      console.log('🗄️ Firebase Firestore initialized');
      return firestore;
    }),
  ]
}).catch(err => console.error('❌ Error starting app:', err));



 // This line is crucial and must be at the top
// import 'zone.js';

// import { bootstrapApplication } from '@angular/platform-browser';
// import { appConfig } from './app/app.config';
// import { AppComponent } from './app/app';

// bootstrapApplication(AppComponent, appConfig)
//   .catch((err) => console.error(err));
