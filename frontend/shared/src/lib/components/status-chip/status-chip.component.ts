import { Component, Input } from '@angular/core';

@Component({
  selector: 'lib-status-chip',
  template: `
    <span [ngClass]="getStatusClass()" class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
      {{ getStatusLabel() }}
    </span>
  `
})
export class StatusChipComponent {
  @Input() status!: string;

  getStatusClass(): string {
    switch (this.status) {
      case 'New':
        return 'bg-blue-100 text-blue-800';
      case 'Triaged':
        return 'bg-indigo-100 text-indigo-800';
      case 'InProgress':
        return 'bg-yellow-100 text-yellow-800';
      case 'WaitingCustomer':
        return 'bg-orange-100 text-orange-800';
      case 'Resolved':
        return 'bg-green-100 text-green-800';
      case 'Closed':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

getStatusLabel(): string {
   switch (this.status) {
     case 'New':
       return 'New';
     case 'Triaged':
       return 'Triaged';
     case 'InProgress':
       return 'In Progress';
     case 'WaitingCustomer':
       return 'Waiting on Customer';
     case 'Resolved':
       return 'Resolved';
     case 'Closed':
       return 'Closed';
     case 'Cancelled':
       return 'Cancelled';
     default:
       return 'Unknown';
   }
 }
}