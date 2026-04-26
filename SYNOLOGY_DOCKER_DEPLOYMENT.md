# Synology Docker Deployment Guide

Deploy your Travel Web Portal to Synology NAS using Docker for self-hosted private access.

---

## 📋 Prerequisites

- Synology NAS with Docker installed
- Admin access to Synology DSM
- Basic familiarity with Docker
- Travel Web Portal files ready

---

## 🚀 Step 1: Prepare Files on Synology

### 1.1 Connect to Synology via SSH

```bash
# SSH into your Synology NAS
ssh admin@192.168.1.XXX
# Or use your configured hostname
ssh admin@synology.local
```

### 1.2 Create Application Directory

```bash
# Navigate to Docker volume
cd /volume1/docker

# Create app directory
mkdir -p travel-web-portal
cd travel-web-portal

# Create subdirectories
mkdir -p js styles
```

### 1.3 Upload Files to Synology

**Option A: Using File Station (GUI)**
1. Open Synology File Station
2. Navigate to `/docker/travel-web-portal/`
3. Upload all files maintaining structure:
   - index.html (root)
   - js/ folder with all .js files
   - styles/ folder with all .css files

**Option B: Using SCP (Command Line)**
```bash
# From your local machine
scp -r travel-web-portal/* admin@synology.local:/volume1/docker/travel-web-portal/
```

**Option C: Using rsync**
```bash
rsync -avz --delete ./travel-web-portal/ admin@synology.local:/volume1/docker/travel-web-portal/
```

---

## 🐳 Step 2: Create Dockerfile

Create a `Dockerfile` in `/volume1/docker/travel-web-portal/`:

```dockerfile
# Travel Web Portal - Nginx
FROM nginx:alpine

# Copy application files
COPY . /usr/share/nginx/html/

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1
```

---

## ⚙️ Step 3: Create Nginx Configuration

Create `nginx.conf` in `/volume1/docker/travel-web-portal/`:

```nginx
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/javascript;
    gzip_min_length 1024;

    # Cache control
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|webp)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML files - no cache
    location ~* \.html$ {
        expires 0;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA routing - fallback to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ ~$ {
        deny all;
    }
}
```

---

## 🐳 Step 4: Build Docker Image

### 4.1 Build from Synology DSM

**Method A: Using Docker GUI**

1. Open Synology DSM
2. Go to Docker application
3. Click "Image" → "Build"
4. Select folder: `/docker/travel-web-portal/`
5. Image name: `travel-web-portal:latest`
6. Click "Build"
7. Wait for completion (~2-3 minutes)

**Method B: Using SSH**

```bash
# SSH into Synology
ssh admin@synology.local

# Navigate to folder
cd /volume1/docker/travel-web-portal

# Build image
docker build -t travel-web-portal:latest .

# Verify build
docker images | grep travel-web-portal
```

---

## 🚀 Step 5: Create and Run Container

### 5.1 Using Docker GUI

1. Go to Docker → Image
2. Select `travel-web-portal:latest`
3. Click "Run"
4. Configure:
   - **Container name:** `travel-web-portal`
   - **Memory limit:** 256MB
   - **CPU priority:** Normal
   - **Auto-restart:** Enable
5. Network:
   - **Port settings:**
     - Container port: 80
     - Local port: 8080 (or your preference)
     - Protocol: HTTP
6. Volume settings (optional):
   - **Mount path:** `/data` → `/volume1/docker/travel-web-portal/data`
7. Click "Next" → "Apply"

### 5.2 Using Command Line

```bash
# SSH into Synology
ssh admin@synology.local

# Run container
docker run -d \
  --name travel-web-portal \
  --restart unless-stopped \
  -p 8080:80 \
  -v /volume1/docker/travel-web-portal:/usr/share/nginx/html \
  travel-web-portal:latest

# Verify container is running
docker ps | grep travel-web-portal
```

---

## 🌐 Step 6: Configure Reverse Proxy (Optional)

For better integration with Synology:

### 6.1 Create Reverse Proxy Entry

1. Open Synology DSM
2. Go to Control Panel → Login Portal → Advanced
3. Click "Reverse Proxy (HTTP)" or "Reverse Proxy (HTTPS)"
4. Click "Create":
   - **Reverse Proxy Name:** `Travel Portal`
   - **Protocol:** HTTP (or HTTPS if you have cert)
   - **Hostname:** Your domain or NAS hostname
   - **Port:** 80 (or 443 for HTTPS)
5. Backend:
   - **Protocol:** HTTP
   - **Hostname:** localhost
   - **Port:** 8080
6. Click "Create"

### 6.2 Alternative: Direct Access

If you prefer direct access without reverse proxy:
- Access at: `http://synology.local:8080/`
- Or: `http://192.168.1.XXX:8080/`

---

## 🔒 Step 7: Configure Firewall (If Needed)

Synology firewall configuration:

1. Control Panel → Security → Firewall
2. Click "Create Rule" if port not already allowed
3. Port: 8080
4. Protocol: TCP
5. Action: Allow
6. Apply

---

## 📝 Step 8: Configure Application

Once container is running:

1. Open browser: `http://synology.local:8080`
2. Go to Settings tab
3. Add Claude API key from console.anthropic.com
4. Add Google Maps key (optional)
5. Click "Save API Key"
6. Start using the application!

---

## 🔄 Step 9: Update Application

When you have new code:

### 9.1 Stop Old Container

```bash
# SSH into Synology
ssh admin@synology.local

# Stop container
docker stop travel-web-portal

# Remove container
docker rm travel-web-portal
```

### 9.2 Update Files

```bash
# Upload new files to /volume1/docker/travel-web-portal/
# Using SCP, rsync, or File Station
```

### 9.3 Rebuild and Run

```bash
# Rebuild image
docker build -t travel-web-portal:latest .

# Run new container
docker run -d \
  --name travel-web-portal \
  --restart unless-stopped \
  -p 8080:80 \
  -v /volume1/docker/travel-web-portal:/usr/share/nginx/html \
  travel-web-portal:latest
```

---

## 🐳 Step 10: Docker Compose (Advanced)

For easier management, create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  travel-portal:
    image: travel-web-portal:latest
    container_name: travel-web-portal
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - /volume1/docker/travel-web-portal:/usr/share/nginx/html
    environment:
      - TZ=Australia/Sydney
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
```

### Run with Docker Compose

```bash
# Navigate to folder
cd /volume1/docker/travel-web-portal

# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f
```

---

## 📊 Monitoring & Management

### View Container Logs

```bash
docker logs -f travel-web-portal
```

### Check Container Status

```bash
docker stats travel-web-portal
```

### SSH into Container

```bash
docker exec -it travel-web-portal /bin/sh
```

### View Running Containers

```bash
docker ps
```

---

## 🔐 Security Recommendations

### 1. Change Default Port

```bash
# Change from 8080 to 9000
docker run -d \
  --name travel-web-portal \
  --restart unless-stopped \
  -p 9000:80 \
  travel-web-portal:latest
```

### 2. Add Basic Authentication

Create `nginx.conf` with auth:

```nginx
server {
    listen 80;
    server_name _;
    
    # Basic auth
    auth_basic "Travel Portal";
    auth_basic_user_file /etc/nginx/.htpasswd;

    root /usr/share/nginx/html;
    index index.html;
    
    # ... rest of config
}
```

Generate password file:

```bash
# In container or locally
docker run --rm httpd:2.4-alpine \
  htpasswd -c /tmp/.htpasswd your_username

# Copy to container
docker cp /tmp/.htpasswd travel-web-portal:/etc/nginx/.htpasswd
```

### 3. Use HTTPS with Reverse Proxy

1. Get SSL certificate (Let's Encrypt)
2. Configure Synology reverse proxy with HTTPS
3. Point to `http://localhost:8080`

### 4. Regular Backups

```bash
# Backup volume
rsync -avz admin@synology.local:/volume1/docker/travel-web-portal ~/backups/
```

---

## 🆘 Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs travel-web-portal

# View error details
docker run -it travel-web-portal:latest /bin/sh
```

### Port Already in Use

```bash
# Use different port
docker run -d \
  --name travel-web-portal \
  -p 8081:80 \
  travel-web-portal:latest
```

### Files Not Updating

```bash
# Verify volume mount
docker inspect travel-web-portal | grep -A 10 Mounts

# Check file permissions
ls -la /volume1/docker/travel-web-portal/
```

### Nginx Errors

```bash
# Check nginx config
docker exec travel-web-portal nginx -t

# Reload nginx
docker exec travel-web-portal nginx -s reload
```

---

## 📈 Performance Tuning

### 1. Increase Memory

```bash
docker update --memory 512m travel-web-portal
```

### 2. CPU Limits

```bash
docker run -d \
  --cpus="1" \
  --memory="512m" \
  --name travel-web-portal \
  -p 8080:80 \
  travel-web-portal:latest
```

### 3. Enable Caching

Already configured in nginx.conf, but adjust:

```nginx
expires 1y;  # Change cache duration
```

---

## 🔄 Maintenance Tasks

### Weekly

```bash
# Check logs for errors
docker logs travel-web-portal | tail -50
```

### Monthly

```bash
# Remove unused images
docker image prune

# Clean up
docker system prune
```

### Quarterly

```bash
# Backup data
rsync -avz admin@synology.local:/volume1/docker/travel-web-portal ~/backups/travel-$(date +%Y%m%d)/
```

---

## 🎯 Access Your Application

Once running:

- **Local Network:** `http://synology.local:8080`
- **By IP:** `http://192.168.1.XXX:8080`
- **By Hostname:** `http://your-synology-hostname:8080`

---

## 📚 Useful Docker Commands

```bash
# View all containers
docker ps -a

# Start stopped container
docker start travel-web-portal

# Stop running container
docker stop travel-web-portal

# Restart container
docker restart travel-web-portal

# Remove container
docker rm travel-web-portal

# View container details
docker inspect travel-web-portal

# Update container
docker pull travel-web-portal:latest
docker rm travel-web-portal
# ... run new container

# Backup image
docker save travel-web-portal:latest > travel-portal-backup.tar

# Restore image
docker load < travel-portal-backup.tar
```

---

## ✅ Verification Checklist

- [ ] Files uploaded to `/volume1/docker/travel-web-portal/`
- [ ] Dockerfile created
- [ ] nginx.conf created
- [ ] Image built successfully
- [ ] Container running
- [ ] Port accessible
- [ ] Application loads at `http://synology.local:8080`
- [ ] Claude API key configured
- [ ] Chat bot working
- [ ] All features functional

---

## 🎉 You're Done!

Your Travel Web Portal is now self-hosted on your Synology NAS!

**Next Steps:**
1. Access at `http://synology.local:8080`
2. Configure Claude API key
3. Start planning your Italy trip
4. Enjoy private, self-hosted travel planning!

---

**Happy self-hosting! 🚀**
