import { Component, Input } from '@angular/core';

@Component({
  selector: 'lib-priority-badge',
  template: `
    <span [ngClass]="getPriorityClass()" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
      {{ priority }}
    </span>
  `
})
export class PriorityBadgeComponent {
  @Input() priority!: string;

  getPriorityClass(): string {
    switch (this.priority) {
      case 'P1':
        return 'bg-red-100 text-red-800';
      case 'P2':
        return 'bg-orange-100 text-orange-800';
      case 'P3':
        return 'bg-yellow-100 text-yellow-800';
      case 'P4':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}