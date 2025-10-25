import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { TicketListComponent } from './components/ticket-list/ticket-list.component';
import { TicketDetailComponent } from './components/ticket-detail/ticket-detail.component';
import { CreateTicketComponent } from './components/create-ticket/create-ticket.component';
import { AdminComponent } from './components/admin/admin.component';
import { ReportsComponent } from './components/reports/reports.component';
import { LayoutComponent } from './components/layout/layout.component';
import { AuthGuard } from './guards/auth.guard';
import { SidebarComponent } from './components/sidebar/sidebar.component'; // standalone

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'auth/magic-link/consume', component: LoginComponent }, // Magic link consumption
  {
    path: '',
    component: LayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'tickets', component: TicketListComponent },
      { path: 'tickets/new', component: CreateTicketComponent },
      { path: 'tickets/my', component: TicketListComponent, data: { filterType: 'my' } },
      { path: 'tickets/unassigned', component: TicketListComponent, data: { filterType: 'unassigned' } },
      { path: 'tickets/overdue', component: TicketListComponent, data: { filterType: 'overdue' } },
      { path: 'admin', component: AdminComponent },
      { path: 'reports', component: ReportsComponent },
      { path: 'tickets/:key', component: TicketDetailComponent }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes), SidebarComponent ],
  exports: [RouterModule]
})
export class AppRoutingModule { }