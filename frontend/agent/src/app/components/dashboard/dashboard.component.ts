import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  template: `
    <!-- Same template as before -->
    <div class="space-y-6">
      <div class="sm:flex sm:items-center">
        <div class="sm:flex-auto">
          <h1 class="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p class="mt-2 text-sm text-gray-700">
            Overview of your tickets and team performance
          </p>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
        <div class="bg-white overflow-hidden shadow rounded-lg">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg class="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-gray-500 truncate">Total Tickets</dt>
                  <dd class="text-lg font-medium text-gray-900">{{ stats.totalTickets }}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <!-- Add other stat cards as needed -->
      </div>

      <!-- Recent Tickets -->
      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Tickets</h3>
        <div class="text-gray-500">Recent tickets will be displayed here...</div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit { // Make sure this is exported properly
  stats = {
    totalTickets: 0,
    myOpenTickets: 0,
    unassignedTickets: 0,
    breachingSoon: 0,
    resolvedToday: 0
  };

  ngOnInit() {
    // Mock stats for now
    this.stats = {
      totalTickets: 150,
      myOpenTickets: 15,
      unassignedTickets: 7,
      breachingSoon: 3,
      resolvedToday: 12
    };
  }
}