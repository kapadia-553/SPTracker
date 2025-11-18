# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only project files first (paths are relative to the build context = ./backend)
COPY src/SpTrack.Worker/SpTrack.Worker.csproj src/SpTrack.Worker/
COPY src/SpTrack.Application/SpTrack.Application.csproj src/SpTrack.Application/
COPY src/SpTrack.Domain/SpTrack.Domain.csproj src/SpTrack.Domain/
COPY src/SpTrack.Infrastructure/SpTrack.Infrastructure.csproj src/SpTrack.Infrastructure/

# Restore dependencies for worker project
RUN dotnet restore src/SpTrack.Worker/SpTrack.Worker.csproj

# Copy the rest of the backend sources into the image (relative to context)
COPY src/ ./

# Set working directory to the worker project and publish
WORKDIR /src/SpTrack.Worker
RUN dotnet publish "SpTrack.Worker.csproj" -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SpTrack.Worker.dll"]
