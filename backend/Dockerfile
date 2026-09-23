# Multi-stage Dockerfile for .NET 9 Web API
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY InsuranceApi.csproj ./
RUN dotnet restore InsuranceApi.csproj

# Copy source code and build
COPY . ./
RUN dotnet publish InsuranceApi.csproj -c Release -o /app/publish /p:UseAppHost=false

# Runtime Image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Create uploads directory for persistent compliance documents
RUN mkdir -p /app/uploads

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENV ASPNETCORE_ENVIRONMENT=Production

ENTRYPOINT ["dotnet", "InsuranceApi.dll"]
