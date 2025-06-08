import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private readonly socket: Socket;
  private readonly connectionStatus = new BehaviorSubject<boolean>(false);
  public readonly connectionStatus$ = this.connectionStatus.asObservable();

  constructor() {
    this.socket = io(environment.socketUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });

    this.setupConnectionListeners();

    // Expose socket service for debugging in development
    if (!environment.production) {
      (window as any).socketService = this;
      console.log('Socket service exposed as window.socketService for debugging');
    }
  }

  private setupConnectionListeners(): void {
    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.connectionStatus.next(true);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connectionStatus.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectionStatus.next(false);
    });

    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.connectionStatus.next(true);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error);
    });

    // Debug: Log all socket events (only in development)
    if (!environment.production) {
      this.setupDebugEventLogger();
    }
  }

  private setupDebugEventLogger(): void {
    // Listen for all events and log them (safer approach)
    const originalOn = this.socket.on.bind(this.socket);
    this.socket.on = function(event: string, listener: (...args: any[]) => void) {
      const wrappedListener = (...args: any[]) => {
        console.log('🔌 Socket Event Received:', event, 'Data:', args);
        return listener(...args);
      };
      return originalOn(event, wrappedListener);
    };
  }

  // Listen to specific events
  on<T = any>(eventName: string): Observable<T> {
    return new Observable<T>(observer => {
      this.socket.on(eventName, (data: T) => {
        observer.next(data);
      });

      // Cleanup function
      return () => {
        this.socket.off(eventName);
      };
    });
  }

  // Emit events
  emit(eventName: string, data?: any): void {
    this.socket.emit(eventName, data);
  }

  // Check if socket is connected
  isConnected(): boolean {
    return this.socket.connected;
  }

  // Manually connect
  connect(): void {
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  // Manually disconnect
  disconnect(): void {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  // Debug method to test socket events (can be called from browser console)
  testSocketEvents(): void {
    console.log('Testing socket events...');
    console.log('Socket connected:', this.isConnected());
    console.log('Socket ID:', this.socket.id);

    // Test emitting an event
    this.emit('test', { message: 'Hello from frontend' });

    // Listen for test response
    this.on('testResponse').subscribe(data => {
      console.log('Received test response:', data);
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.connectionStatus.complete();
  }
}
