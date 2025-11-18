# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files
COPY backend/src/SpTrack.Worker/SpTrack.Worker.csproj SpTrack.Worker/
COPY backend/src/SpTrack.Application/SpTrack.Application.csproj SpTrack.Application/
COPY backend/src/SpTrack.Domain/SpTrack.Domain.csproj SpTrack.Domain/
COPY backend/src/SpTrack.Infrastructure/SpTrack.Infrastructure.csproj SpTrack.Infrastructure/

# Restore dependencies
RUN dotnet restore SpTrack.Worker/SpTrack.Worker.csproj

# Copy full backend source code
COPY backend/src/ ./  

# Build/publish worker
WORKDIR /src/SpTrack.Worker
RUN dotnet publish SpTrack.Worker.csproj -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SpTrack.Worker.dll"]
