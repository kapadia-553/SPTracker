using Hangfire.Dashboard;

namespace SpTrack.Api.HangfireAuth;

public sealed class AllowAllDashboardAuthorizationFilter : IDashboardAuthorizationFilter
{
    public bool Authorize(DashboardContext context) => true;
}
