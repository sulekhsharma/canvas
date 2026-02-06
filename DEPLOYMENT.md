# Deployment Guide for canvas.auto-m8.pro

This guide lists the steps to deploy the **GMB QR Generator** application to a production server (Ubuntu/Debian recommended).

## 1. Prerequisites (Server Side)

Ensure your server has the following installed:

*   **Node.js** (v18 or higher)
*   **npm** (usually comes with Node.js)
*   **Git**
*   **PM2** (Process Manager - optional but recommended)
    ```bash
    npm install -g pm2
    ```
*   **Nginx** (Web Server/Reverse Proxy - optional but recommended)

## 2. Clone and Setup

SSH into your server and clone the repository:

```bash
cd /var/www  # Or your preferred directory
git clone https://github.com/sulekhsharma/canvas.git
cd online-gmb-qr
```

## 3. Install Dependencies

Install dependencies for the root, server, and client workspaces:

```bash
npm run install:all
```
*(This runs `npm install` in root, client, and server workspaces)*

## 4. Build the Frontend

Compile the React frontend for production. This will output files to `client/dist`.

```bash
npm run build
```

## 5. Environment Configuration

Create a `.env` file in the root directory (or ensure the server workspace sees it).

```bash
nano .env
```

Add your production secrets:

```env
PORT=5000
JWT_SECRET=your_secure_random_secret_string_here
```

**Note:** The Frontend `VITE_API_BASE` defaults to `/api` which works perfectly if the frontend is served by the same backend server (which is the default setup in this guide). If you are hosting frontend and backend separately, you would need to set `VITE_API_BASE` variable when building the frontend.

## 6. Start the Application

### Using npm (Test Run)
```bash
npm start
```
This runs `node src/index.js` in the server workspace. The server will launch on port 5000 and serve:
*   The API at `/api`
*   The uploaded/generated files at `/public`
*   The frontend app (SPA) for all other routes.

### Using PM2 (Production)

To keep the app running in the background and auto-restart on crashes/reboots:

```bash
pm2 start server/src/index.js --name "gmb-qr-app"
pm2 save
pm2 startup
```

## 7. Nginx Configuration (Reverse Proxy)

If you are pointing `canvas.auto-m8.pro` to this server, use Nginx to proxy traffic to port 5000.

1.  Create Nginx config:
    ```bash
    sudo nano /etc/nginx/sites-available/canvas.auto-m8.pro
    ```

2.  Add the following configuration:

    ```nginx
    server {
        listen 80;
        server_name canvas.auto-m8.pro;

        # Max upload size for logos
        client_max_body_size 50M;

        location / {
            proxy_pass http://localhost:5000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  Enable site and restart Nginx:
    ```bash
    sudo ln -s /etc/nginx/sites-available/canvas.auto-m8.pro /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

4.  **SSL (Certbot)**:
    Secure your site with HTTPS:
    ```bash
    sudo certbot --nginx -d canvas.auto-m8.pro
    ```

## 8. Verification

Visit `https://canvas.auto-m8.pro` in your browser. You should see the login page or dashboard.
API endpoints like `https://canvas.auto-m8.pro/api/generate-qr` will handle the QR generation.
