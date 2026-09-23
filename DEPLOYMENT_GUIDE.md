# 🚀 AuraGuard Enterprise Deployment Guide

This guide provides step-by-step instructions for deploying the **AuraGuard Insurance Platform** across various production environments (Docker, Cloud PaaS, Windows Server/IIS, and Linux VPS).

---

## 📋 Architecture & Tech Stack

- **Frontend**: React (Vite SPA) served via Nginx or static CDN
- **Backend API**: ASP.NET Core 9 Web API (`.NET 9.0`)
- **Database**: MySQL 8.0+
- **Authentication**: JWT Bearer Tokens + 2FA OTP

---

## 🐳 Option 1: One-Click Docker Compose Deployment (Recommended)

Docker Compose containerizes the MySQL database, .NET 9 Web API, and Nginx-powered React SPA into an isolated network.

### Prerequisites:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Windows/Mac) or Docker Engine + Compose (Linux).

### Quick Start:
1. Navigate to the project root directory:
   ```bash
   cd insurance-system
   ```
2. (Optional) Customize environment variables by copying `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Build and launch all containers in detached mode:
   ```bash
   docker-compose up --build -d
   ```
4. **Access the Application**:
   - **Frontend Web App**: `http://localhost` (Port 80)
   - **Backend Web API**: `http://localhost:5000`
   - **Swagger API Docs**: `http://localhost:5000/swagger`
   - **MySQL Database**: `localhost:3306`

5. **Stop Containers**:
   ```bash
   docker-compose down
   ```

---

## ☁️ Option 2: Cloud PaaS Deployment (Render / Railway)

### 1. Database (e.g. Aiven, Railway MySQL, or PlanetScale):
- Create a MySQL instance.
- Obtain your Connection String:
  ```
  Server=YOUR_HOST;Port=YOUR_PORT;Database=insurance_db;Uid=YOUR_USER;Pwd=YOUR_PASSWORD;
  ```

### 2. Backend Deployment (Render / Railway):
- **Build Command**: `dotnet publish -c Release -o out`
- **Start Command**: `dotnet out/InsuranceApi.dll`
- **Environment Variables**:
  - `ASPNETCORE_ENVIRONMENT`: `Production`
  - `ConnectionStrings__DefaultConnection`: *Your MySQL Connection String*
  - `Jwt__Key`: *Your 32+ character secret key*
  - `AllowedOrigins`: `https://your-frontend.onrender.com`

### 3. Frontend Deployment (Vercel / Netlify / Render Static):
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_API_URL`: `https://your-backend.onrender.com`

---

## 🖥️ Option 3: Local Windows Server / Self-Hosted IIS

1. **Run the 1-Click Publisher**:
   - Double-click `publish.bat` in the project root.
   - This creates production-ready bundles in the `.\publish` folder.
2. **Backend**:
   - Install the [.NET 9 Hosting Bundle](https://dotnet.microsoft.com/download/dotnet/9.0).
   - In IIS Manager, create a new site pointing to `.\publish\backend`.
   - Set Application Pool .NET CLR version to **"No Managed Code"**.
3. **Frontend**:
   - Create an IIS site pointing to `.\publish\frontend`.
   - Install the IIS URL Rewrite module and configure rewrite to `index.html`.

---

## 🐧 Option 4: Linux Server (Ubuntu 22.04 / 24.04 + Nginx)

1. **Install Dependencies**:
   ```bash
   sudo apt update
   sudo apt install -y dotnet-sdk-9.0 mysql-server nginx
   ```
2. **Setup Systemd Service for Backend** (`/etc/systemd/system/auraguard.service`):
   ```ini
   [Unit]
   Description=AuraGuard Insurance API
   After=network.target

   [Service]
   WorkingDirectory=/var/www/auraguard/backend
   ExecStart=/usr/bin/dotnet /var/www/auraguard/backend/InsuranceApi.dll
   Restart=always
   RestartSec=10
   SyslogIdentifier=auraguard-api
   User=www-data
   Environment=ASPNETCORE_ENVIRONMENT=Production
   Environment=ASPNETCORE_URLS=http://localhost:5000

   [Install]
   WantedBy=multi-user.target
   ```
3. **Enable and Start Service**:
   ```bash
   sudo systemctl enable --now auraguard.service
   ```

---

## 🔑 Production Environment Variables Reference

| Variable | Description | Default |
| :--- | :--- | :--- |
| `ASPNETCORE_ENVIRONMENT` | Application mode | `Production` |
| `ConnectionStrings__DefaultConnection` | MySQL Connection String | `Server=localhost;Database=insurance_db;...` |
| `Jwt__Key` | JWT Signature Secret | Min 32 characters |
| `AllowedOrigins` | Allowed CORS URLs (comma-separated or `*`) | `*` |
| `VITE_API_URL` | Frontend API Target Base URL | `http://localhost:5000` |

---

## 🛡️ Default Production Credentials
- **Admin Email**: `yuvaraj@insurance.com`
- **Admin Password**: `Yuva@123`
- **2FA OTP**: `824915` (or authenticator code)
