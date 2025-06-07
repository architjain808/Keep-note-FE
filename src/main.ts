import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { enableProdMode } from '@angular/core';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

// Add a timeout to prevent hanging during bootstrap
const bootstrapTimeout = setTimeout(() => {
  console.error('Bootstrap timeout - application failed to start within 30 seconds');
  showBootstrapError('Application startup timeout');
}, 30000);

platformBrowserDynamic().bootstrapModule(AppModule)
  .then(() => {
    clearTimeout(bootstrapTimeout);
    console.log('Application started successfully');
  })
  .catch(err => {
    clearTimeout(bootstrapTimeout);
    console.error('Error starting app:', err);

    // More detailed error logging for production debugging
    if (err.message) {
      console.error('Error message:', err.message);
    }
    if (err.stack) {
      console.error('Error stack:', err.stack);
    }
    if (err.ngOriginalError) {
      console.error('Original error:', err.ngOriginalError);
    }

    // Check for specific NG0908 error
    if (err.message?.includes('NG0908')) {
      console.error('NG0908 Error detected - this is typically a provider or dependency injection issue');
    }

    showBootstrapError('Application failed to start');
  });

function showBootstrapError(message: string): void {
  // Try to show user-friendly error message
  const errorDiv = document.createElement('div');
  errorDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      text-align: center;
      font-family: Arial, sans-serif;
      z-index: 9999;
      max-width: 400px;
    ">
      <h3 style="color: #d32f2f; margin-bottom: 10px;">Application Error</h3>
      <p style="margin-bottom: 15px;">${message}. Please try refreshing the page.</p>
      <button onclick="window.location.reload()" style="
        background: #1976d2;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        margin-right: 10px;
      ">Refresh Page</button>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: #666;
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
      ">Close</button>
    </div>
  `;
  document.body.appendChild(errorDiv);
}
