# Deployment Guide

## Deployment Options

### 1. Docker Compose (Recommended)

The easiest way to deploy the application in production.

#### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- 2GB RAM minimum
- 10GB disk space

#### Steps

1. **Clone and configure**
```bash
git clone https://github.com/yourusername/DSA-Interviewer-Bot.git
cd DSA-Interviewer-Bot

cp .env.example .env
# Edit .env and set GROQ_API_KEY
nano .env
```

2. **Build vector store**
```bash
# Install dependencies locally first
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Build vector database
python scripts/embed_and_index.py
```

3. **Deploy with Docker Compose**
```bash
docker-compose up -d
```

4. **Verify deployment**
```bash
# Check services
docker-compose ps

# Check logs
docker-compose logs -f

# Test API
curl http://localhost/health
```

#### Services

The Docker Compose stack includes:

- **API Server** (port 8000)
  - FastAPI application
  - Auto-restart on failure
  - Volume-mounted data directory

- **Redis Cache** (port 6379)
  - Session storage
  - Rate limiting data
  - Persistent volume

- **Nginx** (port 80/443)
  - Reverse proxy
  - Load balancing
  - SSL termination (configure separately)

#### Configuration

Edit `docker-compose.yml` to customize:

```yaml
services:
  api:
    environment:
      - DEBUG=false
      - LOG_LEVEL=INFO
      - API_PORT=8000
```

### 2. Manual Deployment

For custom deployment scenarios.

#### System Requirements
- Ubuntu 20.04+ / Debian 11+ / RHEL 8+
- Python 3.9+
- 2GB RAM minimum
- 10GB disk space

#### Installation

1. **Install system dependencies**
```bash
sudo apt update
sudo apt install -y python3.9 python3.9-venv python3-pip nginx redis-server
```

2. **Create application user**
```bash
sudo useradd -m -s /bin/bash dsa-interviewer
sudo su - dsa-interviewer
```

3. **Clone and setup**
```bash
git clone https://github.com/yourusername/DSA-Interviewer-Bot.git
cd DSA-Interviewer-Bot

python3.9 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

4. **Configure environment**
```bash
cp .env.example .env
nano .env  # Set GROQ_API_KEY and other settings
```

5. **Build vector store**
```bash
python scripts/embed_and_index.py
```

6. **Create systemd service**
```bash
sudo nano /etc/systemd/system/dsa-interviewer.service
```

```ini
[Unit]
Description=DSA Interviewer API
After=network.target redis.service

[Service]
Type=simple
User=dsa-interviewer
WorkingDirectory=/home/dsa-interviewer/DSA-Interviewer-Bot
Environment="PATH=/home/dsa-interviewer/DSA-Interviewer-Bot/.venv/bin"
ExecStart=/home/dsa-interviewer/DSA-Interviewer-Bot/.venv/bin/uvicorn dsa_interviewer.main:app --host 0.0.0.0 --port 8000 --workers 4
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

7. **Start service**
```bash
sudo systemctl daemon-reload
sudo systemctl enable dsa-interviewer
sudo systemctl start dsa-interviewer
sudo systemctl status dsa-interviewer
```

8. **Configure Nginx**
```bash
sudo nano /etc/nginx/sites-available/dsa-interviewer
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
        access_log off;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/dsa-interviewer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Cloud Deployment

#### AWS EC2

1. **Launch EC2 instance**
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.medium (2 vCPU, 4GB RAM)
   - Storage: 20GB gp3
   - Security group: Allow ports 22, 80, 443

2. **Connect and setup**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip
sudo apt update && sudo apt upgrade -y
```

3. **Follow manual deployment steps above**

4. **Configure SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

#### Google Cloud Run

1. **Build container**
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/dsa-interviewer
```

2. **Deploy**
```bash
gcloud run deploy dsa-interviewer \
  --image gcr.io/PROJECT_ID/dsa-interviewer \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GROQ_API_KEY=your_key
```

#### Heroku

1. **Create app**
```bash
heroku create dsa-interviewer
```

2. **Add buildpack**
```bash
heroku buildpacks:set heroku/python
```

3. **Set environment variables**
```bash
heroku config:set GROQ_API_KEY=your_key
```

4. **Deploy**
```bash
git push heroku main
```

### 4. Kubernetes

#### Prerequisites
- Kubernetes cluster (1.20+)
- kubectl configured
- Helm 3+ (optional)

#### Deployment

1. **Create namespace**
```bash
kubectl create namespace dsa-interviewer
```

2. **Create secret**
```bash
kubectl create secret generic dsa-interviewer-secrets \
  --from-literal=groq-api-key=your_key \
  -n dsa-interviewer
```

3. **Apply manifests**
```bash
kubectl apply -f k8s/ -n dsa-interviewer
```

Example `k8s/deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: dsa-interviewer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: dsa-interviewer
  template:
    metadata:
      labels:
        app: dsa-interviewer
    spec:
      containers:
      - name: api
        image: dsa-interviewer:latest
        ports:
        - containerPort: 8000
        env:
        - name: GROQ_API_KEY
          valueFrom:
            secretKeyRef:
              name: dsa-interviewer-secrets
              key: groq-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
```

## Production Checklist

### Security
- [ ] Set `DEBUG=false` in production
- [ ] Use strong secrets for API keys
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Implement rate limiting
- [ ] Set up firewall rules
- [ ] Regular security updates

### Performance
- [ ] Use multiple workers (4+ for production)
- [ ] Enable Redis caching
- [ ] Configure connection pooling
- [ ] Set appropriate timeouts
- [ ] Monitor resource usage
- [ ] Implement CDN for static assets

### Monitoring
- [ ] Set up logging aggregation
- [ ] Configure health checks
- [ ] Set up uptime monitoring
- [ ] Track error rates
- [ ] Monitor API latency
- [ ] Set up alerts

### Backup
- [ ] Backup vector store regularly
- [ ] Backup Redis data
- [ ] Backup configuration files
- [ ] Document recovery procedures
- [ ] Test restore process

### Scaling
- [ ] Horizontal scaling ready (stateless API)
- [ ] Load balancer configured
- [ ] Database replication (if needed)
- [ ] Auto-scaling policies
- [ ] Resource limits set

## Monitoring & Maintenance

### Health Checks

```bash
# API health
curl http://your-domain.com/health

# Service status
systemctl status dsa-interviewer

# Docker status
docker-compose ps
```

### Logs

```bash
# Systemd logs
sudo journalctl -u dsa-interviewer -f

# Docker logs
docker-compose logs -f api

# Nginx logs
sudo tail -f /var/log/nginx/access.log
```

### Updates

```bash
# Pull latest code
git pull origin main

# Update dependencies
pip install -r requirements.txt

# Rebuild vector store (if needed)
python scripts/embed_and_index.py

# Restart service
sudo systemctl restart dsa-interviewer
# OR
docker-compose restart api
```

## Troubleshooting

### API not responding
```bash
# Check service status
systemctl status dsa-interviewer

# Check logs
journalctl -u dsa-interviewer -n 100

# Check port
netstat -tlnp | grep 8000
```

### High memory usage
```bash
# Check memory
free -h

# Reduce workers in production
# Edit systemd service or docker-compose.yml
```

### ChromaDB errors
```bash
# Rebuild vector store
python scripts/embed_and_index.py

# Check permissions
ls -la data/vector_store/
```

## Support

For deployment issues:
- Check [Troubleshooting Guide](SETUP.md#troubleshooting)
- Review logs for error messages
- Open an issue on GitHub
- Contact support team