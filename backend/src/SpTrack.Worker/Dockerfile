# Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files (corrected paths)
COPY src/SpTrack.Worker/SpTrack.Worker.csproj src/SpTrack.Worker/
COPY src/SpTrack.Application/SpTrack.Application.csproj src/SpTrack.Application/
COPY src/SpTrack.Domain/SpTrack.Domain.csproj src/SpTrack.Domain/
COPY src/SpTrack.Infrastructure/SpTrack.Infrastructure.csproj src/SpTrack.Infrastructure/

# Restore dependencies
RUN dotnet restore src/SpTrack.Worker/SpTrack.Worker.csproj

# Copy the full backend folder
COPY . .

# Go to worker project folder
WORKDIR /src/src/SpTrack.Worker

# Publish worker project
RUN dotnet publish "SpTrack.Worker.csproj" -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SpTrack.Worker.dll"]
