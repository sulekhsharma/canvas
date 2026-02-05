# Cloudflare Tunnel Setup Guide

This guide explains how to use Cloudflare Tunnel to expose your Dockerized GMB QR Generator to the internet (`canvas.auto-m8.pro`) without opening ports on your firewall.

## 1. Prerequisites

*   A Cloudflare account.
*   Your domain (`auto-m8.pro`) added to Cloudflare.
*   Docker and Docker Compose installed on your server (as per previous steps).

## 2. Obtain Tunnel Token

1.  Go to the [Cloudflare Zero Trust Dashboard](https://one.dash.cloudflare.com/).
2.  Navigate to **Networks** > **Tunnels**.
3.  Click **Create a Tunnel**.
4.  Choose **Cloudflared** type.
5.  Name it (e.g., `gmb-qr-prod`).
6.  You will see a command like `cloudflared service install <TOKEN>`.
    *   **Copy ONLY the token string** (the long string of characters).

## 3. Configure Public Hostname

1.  In the Tunnel configuration step, click **Next**.
2.  **Public Hostname**:
    *   **Subdomain**: `canvas`
    *   **Domain**: `auto-m8.pro`
    *   **Path**: (leave empty)
3.  **Service**:
    *   **Type**: `HTTP`
    *   **URL**: `gmb-qr-app:5000`  (Note: We use the Docker container name `gmb-qr-app` instead of localhost)
4.  Save the tunnel.

## 4. Deploy with Docker

1.  On your server, open your `.env` file:
    ```bash
    nano .env
    ```
2.  Add your token:
    ```env
    PORT=5000
    JWT_SECRET=your_secure_random_string
    TUNNEL_TOKEN=eyJhIjoi... (paste your token here)
    ```

3.  Run the application with Docker Compose:
    ```bash
    docker-compose up -d
    ```

## 5. Verification

*   Visit `https://canvas.auto-m8.pro`.
*   Cloudflare will securely route traffic to your docker container.
