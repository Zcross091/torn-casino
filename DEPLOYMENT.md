# 🚀 Deployment Guide

Quick guides for deploying your casino on various platforms.

## Option 1: Free Static Hosting (Easiest)

### Netlify

1. Go to [netlify.com](https://netlify.com)
2. Sign up with GitHub
3. Click "New site from Git"
4. Connect your repo
5. Build command: (leave empty)
6. Publish directory: `.` (root)
7. Deploy!

Your casino will be live at `your-casino.netlify.app`

### Vercel

1. Go to [vercel.com](https://vercel.com)
2. Import your project
3. Select "Static" deployment
4. Deploy!

### GitHub Pages

1. Create `gh-pages` branch
2. Push your files
3. Go to Settings → Pages
4. Select `gh-pages` branch
5. Your site is live at `username.github.io/casino`

## Option 2: Traditional VPS (Most Control)

### Setup on Ubuntu/Debian

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your casino
git clone your-repo
cd your-casino

# Install dependencies (if using backend)
npm install

# Start with PM2 (keeps it running)
npm install -g pm2
pm2 start backend-example.js --name casino
pm2 startup
pm2 save
```

### With Nginx (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name casino.example.com;

    # Static files
    location / {
        root /var/www/casino;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

### Enable HTTPS with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d casino.example.com
```

## Option 3: Docker

### Build Docker Image

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm install
EXPOSE 3000
CMD ["node", "backend-example.js"]
EOF

# Build
docker build -t my-casino .

# Run
docker run -p 3000:3000 my-casino
```

### Docker Compose

```yaml
version: '3'
services:
  casino:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
    volumes:
      - ./:/app
  
  nginx:
    image: nginx:latest
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - casino
```

Run with:
```bash
docker-compose up
```

## Option 4: Railway / Render (Easy Deployment)

### Railway

1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repo
4. Auto-deploys on push!

### Render

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect GitHub
4. Set build command: `npm install`
5. Start command: `node backend-example.js`

## Option 5: Shared Hosting (Budget Option)

### Using cPanel

1. Upload files via FTP
2. No backend needed (works with static files only)
3. Update `api.js` to use local storage
4. Set up SSL in cPanel

## Domain Setup

### Custom Domain on Netlify

1. In Netlify: Site settings → Domain management
2. Add your domain
3. Update DNS records at your domain registrar:
   ```
   CNAME: your-casino.netlify.app
   ```

### Custom Domain on VPS

1. Update DNS A record to your VPS IP
2. Configure Nginx/Apache vhost
3. Set up SSL certificate

## Database Setup (For Production)

### PostgreSQL

```bash
# Install
sudo apt-get install postgresql postgresql-contrib

# Create database
sudo -u postgres createdb casino_db
sudo -u postgres createuser casino_user --password

# Connect string
postgresql://casino_user:password@localhost:5432/casino_db
```

### MongoDB

```bash
# Docker setup
docker run -d -p 27017:27017 --name casino-mongo mongo

# Connection string
mongodb://localhost:27017/casino
```

## Environment Variables

Create `.env` file:

```env
# Deployment
NODE_ENV=production
PORT=3000
DOMAIN=casino.example.com

# Database
DB_HOST=localhost
DB_NAME=casino_db
DB_USER=casino_user
DB_PASSWORD=secure_password

# APIs
TORN_API_ENDPOINT=https://api.torn.com

# Security
CORS_ORIGIN=https://casino.example.com
JWT_SECRET=your_secret_key_here

# Payments (if using)
STRIPE_KEY=sk_live_xxxxx
```

## Monitoring & Logging

### PM2 Monitoring

```bash
pm2 monit
pm2 logs casino --lines 100
pm2 save
pm2 start ecosystem.config.js
```

### Nginx Error Logs

```bash
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## Scaling

### Load Balancing

For multiple server instances:

```nginx
upstream casino_backend {
    server 192.168.1.1:3000;
    server 192.168.1.2:3000;
    server 192.168.1.3:3000;
}

server {
    location /api {
        proxy_pass http://casino_backend;
    }
}
```

### Caching

```nginx
# Cache static assets
location ~* \.(js|css|png|jpg)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

## Security Checklist

- [ ] Enable HTTPS/SSL
- [ ] Set secure headers (CSP, X-Frame-Options)
- [ ] Rate limiting on API endpoints
- [ ] CORS properly configured
- [ ] SQL injection prevention (parameterized queries)
- [ ] Input validation on all endpoints
- [ ] Secrets not in code (use .env)
- [ ] Regular backups of database
- [ ] Monitor error logs
- [ ] Keep dependencies updated

## Performance Optimization

### Frontend

```bash
# Minify JS/CSS
npm install -g terser csso-cli

# Optimize images
npm install imagemin-cli

# Bundle size analysis
npm run build -- --analyze
```

### Backend

- Use Redis for caching
- Implement connection pooling
- Add CDN for static assets
- Compress responses with gzip
- Use database indexes

## Monitoring & Alerts

### Uptime Monitoring

Use free services:
- [UptimeRobot](https://uptimerobot.com)
- [StatusPage](https://www.statuspage.io)
- [HealthChecks](https://healthchecks.io)

### Error Tracking

- [Sentry](https://sentry.io) - Free tier available
- [Rollbar](https://rollbar.com)
- [LogRocket](https://logrocket.com)

## Backup Strategy

```bash
# Daily database backup
0 2 * * * pg_dump casino_db > /backups/casino_$(date +\%Y\%m\%d).sql

# Upload to S3
aws s3 sync /backups/ s3://my-backups/casino/
```

## Troubleshooting Deployment

### "502 Bad Gateway"
- Backend not running
- Check PM2 status: `pm2 status`
- Check logs: `pm2 logs`

### "CORS Error"
- Update CORS_ORIGIN in .env
- Verify frontend and backend URLs match

### "SSL Certificate Error"
- Renew certificate: `certbot renew`
- Check certificate: `certbot certificates`

### "Database Connection Failed"
- Check DB credentials in .env
- Verify database is running
- Check firewall rules

## Support Hosting Services

| Service | Price | Best For |
|---------|-------|----------|
| Netlify | Free | Static sites |
| Vercel | Free | Next.js/Static |
| Railway | $5/mo | Full stack |
| Render | Free | Full stack |
| DigitalOcean | $5/mo | VPS |
| Heroku | $7/mo | Node.js apps |
| AWS | Varies | Enterprise |

---

Choose the option that best fits your needs! Start with free hosting to test, then upgrade to paid for production.
