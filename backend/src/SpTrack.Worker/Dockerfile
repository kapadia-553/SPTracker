# Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# copy project files first for layer caching
COPY src/SpTrack.Worker/SpTrack.Worker.csproj src/SpTrack.Worker/
COPY src/SpTrack.Application/SpTrack.Application.csproj src/SpTrack.Application/
COPY src/SpTrack.Domain/SpTrack.Domain.csproj src/SpTrack.Domain/
COPY src/SpTrack.Infrastructure/SpTrack.Infrastructure.csproj src/SpTrack.Infrastructure/
RUN dotnet restore src/SpTrack.Worker/SpTrack.Worker.csproj

# copy the rest and publish
COPY . .
WORKDIR /src/backend/src/SpTrack.Worker
RUN dotnet publish SpTrack.Worker.csproj -c Release -o /app/publish

# Change this line - use aspnet instead of runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "SpTrack.Worker.dll"]



