# Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files for layer caching
COPY backend/src/SpTrack.Worker/SpTrack.Worker.csproj backend/src/SpTrack.Worker/
COPY backend/src/SpTrack.Application/SpTrack.Application.csproj backend/src/SpTrack.Application/
COPY backend/src/SpTrack.Domain/SpTrack.Domain.csproj backend/src/SpTrack.Domain/
COPY backend/src/SpTrack.Infrastructure/SpTrack.Infrastructure.csproj backend/src/SpTrack.Infrastructure/

# Restore dependencies
RUN dotnet restore backend/src/SpTrack.Worker/SpTrack.Worker.csproj

# Copy the entire repo
COPY . .

# Move to worker project directory
WORKDIR /src/backend/src/SpTrack.Worker

# Publish worker project
RUN dotnet publish "SpTrack.Worker.csproj" -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SpTrack.Worker.dll"]




