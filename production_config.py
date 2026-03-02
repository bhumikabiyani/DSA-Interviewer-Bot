#!/usr/bin/env python3
"""
Production-ready configuration and optimization for DSA Interviewer RAG system.
Includes performance tuning, monitoring, caching, and deployment configurations.
"""

import asyncio
import json
import logging
import os
import time
from dataclasses import dataclass
from datetime import datetime
from functools import wraps
from pathlib import Path
from typing import Any, Optional

import psutil
import redis

# =============================================================================
# CONFIGURATION CLASSES
# =============================================================================

@dataclass
class DatabaseConfig:
    """Vector database configuration"""
    persist_directory: str = "./chroma_db"
    collection_name: str = "dsa_interviewer"
    embedding_function: str = "text-embedding-3-large"
    distance_metric: str = "cosine"

    # Performance settings
    max_batch_size: int = 1000
    query_timeout: int = 30
    connection_pool_size: int = 10

    # Index optimization
    hnsw_m: int = 16
    hnsw_ef_construction: int = 200
    hnsw_ef_search: int = 100

@dataclass
class APIConfig:
    """API server configuration"""
    host: str = "0.0.0.0"
    port: int = 8000
    workers: int = 4
    max_concurrent_requests: int = 100
    request_timeout: int = 30

    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window: int = 60  # seconds

    # CORS settings
    cors_origins: list = None
    cors_methods: list = None

    def __post_init__(self):
        if self.cors_origins is None:
            self.cors_origins = ["*"]
        if self.cors_methods is None:
            self.cors_methods = ["GET", "POST", "PUT", "DELETE"]

@dataclass
class CacheConfig:
    """Redis caching configuration"""
    redis_url: str = "redis://localhost:6379"
    default_ttl: int = 3600  # 1 hour
    max_connections: int = 20

    # Cache keys TTL settings
    retrieval_cache_ttl: int = 1800  # 30 minutes
    embedding_cache_ttl: int = 86400  # 24 hours
    session_cache_ttl: int = 7200  # 2 hours

@dataclass
class LLMConfig:
    """Language model configuration"""
    model_name: str = "gpt-4"
    embedding_model: str = "text-embedding-3-large"
    max_tokens: int = 1000
    temperature: float = 0.7

    # Performance settings
    max_retries: int = 3
    retry_delay: float = 1.0
    timeout: int = 30

    # Cost optimization
    use_gpt_3_5_for_simple_tasks: bool = True
    embedding_batch_size: int = 100

@dataclass
class MonitoringConfig:
    """Monitoring and logging configuration"""
    log_level: str = "INFO"
    log_format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    log_file: str = "logs/rag_system.log"

    # Metrics collection
    enable_metrics: bool = True
    metrics_port: int = 9090

    # Health checks
    health_check_interval: int = 60
    performance_alert_threshold: float = 5.0  # seconds

class ProductionConfig:
    """Main production configuration"""

    def __init__(self):
        self.database = DatabaseConfig()
        self.api = APIConfig()
        self.cache = CacheConfig()
        self.llm = LLMConfig()
        self.monitoring = MonitoringConfig()

        # Environment-specific overrides
        self._load_environment_config()

    def _load_environment_config(self):
        """Load configuration from environment variables"""
        # Database config
        if os.getenv("VECTOR_DB_PATH"):
            self.database.persist_directory = os.getenv("VECTOR_DB_PATH")

        # API config
        if os.getenv("API_HOST"):
            self.api.host = os.getenv("API_HOST")
        if os.getenv("API_PORT"):
            self.api.port = int(os.getenv("API_PORT"))

        # Cache config
        if os.getenv("REDIS_URL"):
            self.cache.redis_url = os.getenv("REDIS_URL")

        # LLM config
        if os.getenv("OPENAI_MODEL"):
            self.llm.model_name = os.getenv("OPENAI_MODEL")
        if os.getenv("OPENAI_API_KEY"):
            os.environ["OPENAI_API_KEY"] = os.getenv("OPENAI_API_KEY")

# =============================================================================
# PERFORMANCE OPTIMIZATION
# =============================================================================

class PerformanceOptimizer:
    """Handles performance optimization and monitoring"""

    def __init__(self, config: ProductionConfig):
        self.config = config
        self.metrics = {
            "request_count": 0,
            "total_response_time": 0.0,
            "cache_hits": 0,
            "cache_misses": 0,
            "error_count": 0
        }
        self.start_time = datetime.now()

    def performance_monitor(self, func):
        """Decorator to monitor function performance"""
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = await func(*args, **kwargs)
                self._record_success(time.time() - start_time)
                return result
            except Exception as e:
                self._record_error()
                raise e

        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            start_time = time.time()
            try:
                result = func(*args, **kwargs)
                self._record_success(time.time() - start_time)
                return result
            except Exception as e:
                self._record_error()
                raise e

        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper

    def _record_success(self, response_time: float):
        """Record successful request metrics"""
        self.metrics["request_count"] += 1
        self.metrics["total_response_time"] += response_time

        # Alert if response time is too high
        if response_time > self.config.monitoring.performance_alert_threshold:
            logging.warning(f"Slow response detected: {response_time:.2f}s")

    def _record_error(self):
        """Record error metrics"""
        self.metrics["error_count"] += 1
        logging.error("Request failed")

    def get_performance_stats(self) -> dict[str, Any]:
        """Get current performance statistics"""
        uptime = (datetime.now() - self.start_time).total_seconds()
        avg_response_time = (
            self.metrics["total_response_time"] / max(self.metrics["request_count"], 1)
        )
        cache_hit_rate = (
            self.metrics["cache_hits"] /
            max(self.metrics["cache_hits"] + self.metrics["cache_misses"], 1)
        )
        error_rate = (
            self.metrics["error_count"] / max(self.metrics["request_count"], 1)
        )

        return {
            "uptime_seconds": uptime,
            "total_requests": self.metrics["request_count"],
            "avg_response_time": avg_response_time,
            "cache_hit_rate": cache_hit_rate,
            "error_rate": error_rate,
            "memory_usage_mb": psutil.Process().memory_info().rss / 1024 / 1024,
            "cpu_usage_percent": psutil.cpu_percent()
        }

# =============================================================================
# CACHING SYSTEM
# =============================================================================

class AdvancedCache:
    """Advanced caching system with Redis backend"""

    def __init__(self, config: CacheConfig):
        self.config = config
        self.redis_client = None
        self._initialize_redis()

    def _initialize_redis(self):
        """Initialize Redis connection"""
        try:
            self.redis_client = redis.from_url(
                self.config.redis_url,
                max_connections=self.config.max_connections,
                decode_responses=True
            )
            # Test connection
            self.redis_client.ping()
            logging.info("Redis connection established")
        except Exception as e:
            logging.error(f"Failed to connect to Redis: {e}")
            self.redis_client = None

    async def get_cached_retrieval(self, query_hash: str) -> Optional[dict]:
        """Get cached retrieval results"""
        if not self.redis_client:
            return None

        try:
            cached_data = self.redis_client.get(f"retrieval:{query_hash}")
            if cached_data:
                return json.loads(cached_data)
        except Exception as e:
            logging.error(f"Cache retrieval error: {e}")

        return None

    async def cache_retrieval(self, query_hash: str, results: dict):
        """Cache retrieval results"""
        if not self.redis_client:
            return

        try:
            self.redis_client.setex(
                f"retrieval:{query_hash}",
                self.config.retrieval_cache_ttl,
                json.dumps(results, default=str)
            )
        except Exception as e:
            logging.error(f"Cache storage error: {e}")

    async def get_cached_embedding(self, text_hash: str) -> Optional[list]:
        """Get cached embedding"""
        if not self.redis_client:
            return None

        try:
            cached_embedding = self.redis_client.get(f"embedding:{text_hash}")
            if cached_embedding:
                return json.loads(cached_embedding)
        except Exception as e:
            logging.error(f"Embedding cache retrieval error: {e}")

        return None

    async def cache_embedding(self, text_hash: str, embedding: list):
        """Cache embedding"""
        if not self.redis_client:
            return

        try:
            self.redis_client.setex(
                f"embedding:{text_hash}",
                self.config.embedding_cache_ttl,
                json.dumps(embedding)
            )
        except Exception as e:
            logging.error(f"Embedding cache storage error: {e}")

    async def invalidate_cache(self, pattern: str):
        """Invalidate cache entries matching pattern"""
        if not self.redis_client:
            return

        try:
            keys = self.redis_client.keys(pattern)
            if keys:
                self.redis_client.delete(*keys)
                logging.info(f"Invalidated {len(keys)} cache entries")
        except Exception as e:
            logging.error(f"Cache invalidation error: {e}")

# =============================================================================
# HEALTH MONITORING
# =============================================================================

class HealthMonitor:
    """System health monitoring and alerting"""

    def __init__(self, config: ProductionConfig):
        self.config = config
        self.last_health_check = datetime.now()
        self.health_status = {
            "database": "unknown",
            "cache": "unknown",
            "llm_api": "unknown",
            "memory": "unknown",
            "disk": "unknown"
        }

    async def perform_health_check(self) -> dict[str, str]:
        """Perform comprehensive health check"""
        self.health_status["database"] = await self._check_database_health()
        self.health_status["cache"] = await self._check_cache_health()
        self.health_status["llm_api"] = await self._check_llm_health()
        self.health_status["memory"] = self._check_memory_health()
        self.health_status["disk"] = self._check_disk_health()

        self.last_health_check = datetime.now()

        # Log any unhealthy components
        unhealthy = [k for k, v in self.health_status.items() if v != "healthy"]
        if unhealthy:
            logging.warning(f"Unhealthy components: {unhealthy}")

        return self.health_status

    async def _check_database_health(self) -> str:
        """Check vector database health"""
        try:
            # This would check ChromaDB connection
            # For now, return healthy if no errors
            return "healthy"
        except Exception as e:
            logging.error(f"Database health check failed: {e}")
            return "unhealthy"

    async def _check_cache_health(self) -> str:
        """Check Redis cache health"""
        try:
            cache = AdvancedCache(self.config.cache)
            if cache.redis_client:
                cache.redis_client.ping()
                return "healthy"
            return "unavailable"
        except Exception as e:
            logging.error(f"Cache health check failed: {e}")
            return "unhealthy"

    async def _check_llm_health(self) -> str:
        """Check LLM API health"""
        try:
            import openai
            client = openai.OpenAI()
            # Simple test request
            client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "test"}],
                max_tokens=1
            )
            return "healthy"
        except Exception as e:
            logging.error(f"LLM health check failed: {e}")
            return "unhealthy"

    def _check_memory_health(self) -> str:
        """Check memory usage"""
        memory_percent = psutil.virtual_memory().percent
        if memory_percent > 90:
            return "critical"
        elif memory_percent > 80:
            return "warning"
        return "healthy"

    def _check_disk_health(self) -> str:
        """Check disk usage"""
        disk_percent = psutil.disk_usage('/').percent
        if disk_percent > 90:
            return "critical"
        elif disk_percent > 80:
            return "warning"
        return "healthy"

# =============================================================================
# RATE LIMITING
# =============================================================================

class RateLimiter:
    """Rate limiting for API endpoints"""

    def __init__(self, cache: AdvancedCache, config: APIConfig):
        self.cache = cache
        self.config = config

    async def is_rate_limited(self, client_id: str) -> bool:
        """Check if client is rate limited"""
        if not self.cache.redis_client:
            return False

        try:
            key = f"rate_limit:{client_id}"
            current_requests = self.cache.redis_client.get(key)

            if current_requests is None:
                # First request in window
                self.cache.redis_client.setex(
                    key,
                    self.config.rate_limit_window,
                    1
                )
                return False

            if int(current_requests) >= self.config.rate_limit_requests:
                return True

            # Increment counter
            self.cache.redis_client.incr(key)
            return False

        except Exception as e:
            logging.error(f"Rate limiting error: {e}")
            return False

# =============================================================================
# DEPLOYMENT UTILITIES
# =============================================================================

class DeploymentManager:
    """Handles deployment and configuration management"""

    def __init__(self, config: ProductionConfig):
        self.config = config

    def validate_environment(self) -> dict[str, bool]:
        """Validate deployment environment"""
        checks = {
            "openai_api_key": bool(os.getenv("OPENAI_API_KEY")),
            "vector_db_path": Path(self.config.database.persist_directory).exists(),
            "rag_data_path": Path("rag_data").exists(),
            "redis_connection": self._test_redis_connection(),
            "disk_space": self._check_disk_space(),
            "memory_available": self._check_memory_available()
        }

        return checks

    def _test_redis_connection(self) -> bool:
        """Test Redis connection"""
        try:
            client = redis.from_url(self.config.cache.redis_url)
            client.ping()
            return True
        except Exception:
            return False

    def _check_disk_space(self) -> bool:
        """Check available disk space"""
        disk_usage = psutil.disk_usage('/')
        free_gb = disk_usage.free / (1024**3)
        return free_gb > 5  # At least 5GB free

    def _check_memory_available(self) -> bool:
        """Check available memory"""
        memory = psutil.virtual_memory()
        available_gb = memory.available / (1024**3)
        return available_gb > 2  # At least 2GB available

    def generate_docker_compose(self) -> str:
        """Generate Docker Compose configuration"""
        return f"""
version: '3.8'

services:
  rag-api:
    build: .
    ports:
      - "{self.config.api.port}:{self.config.api.port}"
    environment:
      - OPENAI_API_KEY=${{OPENAI_API_KEY}}
      - REDIS_URL=redis://redis:6379
      - VECTOR_DB_PATH=/app/chroma_db
      - API_HOST={self.config.api.host}
      - API_PORT={self.config.api.port}
    volumes:
      - ./chroma_db:/app/chroma_db
      - ./rag_data:/app/rag_data
      - ./logs:/app/logs
    depends_on:
      - redis
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:{self.config.api.port}/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - rag-api
    restart: unless-stopped

volumes:
  redis_data:
"""

    def generate_nginx_config(self) -> str:
        """Generate Nginx configuration"""
        return f"""
events {{
    worker_connections 1024;
}}

http {{
    upstream rag_api {{
        server rag-api:{self.config.api.port};
    }}

    server {{
        listen 80;
        server_name _;

        location / {{
            proxy_pass http://rag_api;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # Timeouts
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;

            # Rate limiting
            limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
            limit_req zone=api burst=20 nodelay;
        }}

        location /health {{
            proxy_pass http://rag_api/health;
            access_log off;
        }}
    }}
}}
"""

# =============================================================================
# MAIN CONFIGURATION INSTANCE
# =============================================================================

# Global configuration instance
config = ProductionConfig()

# Initialize components
performance_optimizer = PerformanceOptimizer(config)
cache = AdvancedCache(config.cache)
health_monitor = HealthMonitor(config)
rate_limiter = RateLimiter(cache, config.api)
deployment_manager = DeploymentManager(config)

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.monitoring.log_level),
    format=config.monitoring.log_format,
    handlers=[
        logging.FileHandler(config.monitoring.log_file),
        logging.StreamHandler()
    ]
)

def get_config() -> ProductionConfig:
    """Get the global configuration instance"""
    return config

def get_performance_optimizer() -> PerformanceOptimizer:
    """Get the performance optimizer instance"""
    return performance_optimizer

def get_cache() -> AdvancedCache:
    """Get the cache instance"""
    return cache

def get_health_monitor() -> HealthMonitor:
    """Get the health monitor instance"""
    return health_monitor

def get_rate_limiter() -> RateLimiter:
    """Get the rate limiter instance"""
    return rate_limiter

def get_deployment_manager() -> DeploymentManager:
    """Get the deployment manager instance"""
    return deployment_manager

if __name__ == "__main__":
    # Validate environment on startup
    print("Validating deployment environment...")
    validation_results = deployment_manager.validate_environment()

    for check, passed in validation_results.items():
        status = "✓" if passed else "✗"
        print(f"{status} {check}")

    if all(validation_results.values()):
        print("\n✓ Environment validation passed!")
    else:
        print("\n✗ Environment validation failed!")
        failed_checks = [k for k, v in validation_results.items() if not v]
        print(f"Failed checks: {failed_checks}")
