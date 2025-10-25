import { Component, Input, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'lib-sla-timer',
  template: `
    <div class="flex items-center space-x-2">
      <div [ngClass]="getTimerClass()" class="flex items-center space-x-1">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span class="text-xs font-medium">{{ timeRemaining }}</span>
      </div>
      
      <div *ngIf="isBreached" class="text-red-600">
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </div>
    </div>
  `
})
export class SlaTimerComponent implements OnInit, OnDestroy {
  @Input() dueAt?: Date;
  @Input() isBreached: boolean = false;
  @Input() isPaused: boolean = false;

  timeRemaining: string = '';
  private interval?: any;

  ngOnInit() {
    this.updateTimer();
    this.interval = setInterval(() => this.updateTimer(), 60000); // Update every minute
  }

  ngOnDestroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  private updateTimer() {
    if (!this.dueAt || this.isPaused) {
      this.timeRemaining = this.isPaused ? 'Paused' : 'No SLA';
      return;
    }

    const now = new Date();
    const due = new Date(this.dueAt);
    const diff = due.getTime() - now.getTime();

    if (diff <= 0) {
      this.timeRemaining = 'Overdue';
      return;
    }

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      this.timeRemaining = `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      this.timeRemaining = `${hours}h ${minutes}m`;
    } else {
      this.timeRemaining = `${minutes}m`;
    }
  }

  getTimerClass(): string {
    if (this.isBreached) {
      return 'text-red-600';
    }
    
    if (!this.dueAt || this.isPaused) {
      return 'text-gray-500';
    }

    const now = new Date();
    const due = new Date(this.dueAt);
    const diff = due.getTime() - now.getTime();
    const hoursRemaining = diff / (1000 * 60 * 60);

    if (hoursRemaining <= 1) {
      return 'text-red-600';
    } else if (hoursRemaining <= 4) {
      return 'text-orange-600';
    } else {
      return 'text-green-600';
    }
  }
}