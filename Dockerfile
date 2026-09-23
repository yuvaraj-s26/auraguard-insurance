# Root Dockerfile for .NET 9 Backend
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy backend project and restore
COPY backend/InsuranceApi.csproj backend/
RUN dotnet restore backend/InsuranceApi.csproj

# Copy source code and publish
COPY backend/ backend/
WORKDIR /src/backend
RUN dotnet publish InsuranceApi.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

RUN mkdir -p /app/uploads

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "InsuranceApi.dll"]
