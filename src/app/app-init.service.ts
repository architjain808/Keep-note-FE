import { Injectable } from '@angular/core';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {
  
  constructor() {
    this.initializeApp();
  }

  private initializeApp(): void {
    if (environment.enableDebugMode) {
      console.log('App initialization started');
      console.log('Environment:', environment);
    }

    // Check for required browser features
    this.checkBrowserCompatibility();
    
    // Initialize any global configurations
    this.initializeGlobalConfigs();
  }

  private checkBrowserCompatibility(): void {
    const requiredFeatures = [
      'Promise',
      'fetch',
      'Map',
      'Set',
      'Symbol'
    ];

    const missingFeatures = requiredFeatures.filter(feature => 
      !(feature in window) && !(feature in globalThis)
    );

    if (missingFeatures.length > 0) {
      console.warn('Missing browser features:', missingFeatures);
      
      // You could show a browser compatibility warning here
      if (!environment.production) {
        console.warn('Some features may not work properly in this browser');
      }
    }
  }

  private initializeGlobalConfigs(): void {
    // Set up any global configurations
    if (environment.enableDebugMode) {
      // Enable additional debugging in development
      (window as any).debugMode = true;
    }
  }
}
