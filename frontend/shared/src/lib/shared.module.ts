import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StatusChipComponent } from './components/status-chip/status-chip.component';
import { PriorityBadgeComponent } from './components/priority-badge/priority-badge.component';
import { SlaTimerComponent } from './components/sla-timer/sla-timer.component';

@NgModule({
  declarations: [
    StatusChipComponent,
    PriorityBadgeComponent,
    SlaTimerComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    StatusChipComponent,
    PriorityBadgeComponent,
    SlaTimerComponent
  ]
})
export class SharedModule { }