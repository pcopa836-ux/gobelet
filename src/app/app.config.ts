import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// Importaciones de Firebase
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getDatabase, provideDatabase } from '@angular/fire/database';

const firebaseConfig = {
  apiKey: "AIzaSyDWQSBBRniuE4oYkeoN499f7suHT_qlAcU",
  authDomain: "gobelet-reserve.firebaseapp.com",
  databaseURL: "https://gobelet-reserve-default-rtdb.firebaseio.com",
  projectId: "gobelet-reserve",
  storageBucket: "gobelet-reserve.firebasestorage.app",
  messagingSenderId: "582962090450",
  appId: "1:582962090450:web:c36d2f74e708df1befb80b"
};


export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideDatabase(() => getDatabase())
  ]
};
