# ---------- build ----------
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# copy solution + project files first for better caching
COPY *.sln ./
COPY src/SpTrack.Api/SpTrack.Api.csproj src/SpTrack.Api/
COPY src/SpTrack.Infrastructure/SpTrack.Infrastructure.csproj src/SpTrack.Infrastructure/
COPY src/SpTrack.Domain/SpTrack.Domain.csproj src/SpTrack.Domain/

RUN dotnet restore src/SpTrack.Api/SpTrack.Api.csproj

# now copy everything and publish
COPY . .
RUN dotnet publish src/SpTrack.Api/SpTrack.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

# ---------- final (no SDK here) ----------
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080
ENTRYPOINT ["dotnet", "SpTrack.Api.dll"]
