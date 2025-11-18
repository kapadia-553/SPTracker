# ---------- build stage ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy only csproj files first (layer caching)
COPY src/SpTrack.Api/SpTrack.Api.csproj src/SpTrack.Api/
COPY src/SpTrack.Application/SpTrack.Application.csproj src/SpTrack.Application/
COPY src/SpTrack.Domain/SpTrack.Domain.csproj src/SpTrack.Domain/
COPY src/SpTrack.Infrastructure/SpTrack.Infrastructure.csproj src/SpTrack.Infrastructure/

RUN dotnet restore src/SpTrack.Api/SpTrack.Api.csproj

# Copy the full backend source
COPY src/ ./

# Publish
WORKDIR /src/SpTrack.Api
RUN dotnet publish "SpTrack.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# ---------- final stage ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SpTrack.Api.dll"]
