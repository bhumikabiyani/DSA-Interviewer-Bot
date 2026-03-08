import functools
import logging
import time as _time

from sqlalchemy import create_engine
from sqlalchemy.exc import DisconnectionError, InterfaceError, OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker

from dsa_interviewer.core.config import settings

logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,      # test connection liveness before checkout
    pool_recycle=1800,        # recycle connections every 30 min
    pool_size=5,              # baseline pool size
    max_overflow=10,          # extra connections allowed under load
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Transient DB exceptions that warrant an automatic retry
_TRANSIENT_EXCEPTIONS = (OperationalError, DisconnectionError, InterfaceError)


def with_db_retry(func=None, *, max_retries: int = 2, base_delay: float = 0.5):
    """Decorator that retries a function on transient DB errors.

    On each retry the connection-pool is disposed so the next
    ``SessionLocal()`` inside the wrapped function gets a brand-new
    connection instead of another potentially stale one.

    Parameters
    ----------
    max_retries:
        Total number of retry attempts (default ``2``).
    base_delay:
        Seconds to sleep before the first retry.  Subsequent retries use
        exponential back-off (delay doubles each time).
    """

    def decorator(fn):
        @functools.wraps(fn)
        def wrapper(*args, **kwargs):
            last_exc = None
            for attempt in range(1 + max_retries):
                try:
                    return fn(*args, **kwargs)
                except _TRANSIENT_EXCEPTIONS as exc:
                    last_exc = exc
                    if attempt < max_retries:
                        delay = base_delay * (2 ** attempt)
                        logger.warning(
                            "Transient DB error in %s (attempt %d/%d), "
                            "retrying in %.1fs: %s",
                            fn.__name__,
                            attempt + 1,
                            1 + max_retries,
                            delay,
                            exc,
                        )
                        # Drop all pooled connections so the retry gets a
                        # fresh one from the server.
                        engine.dispose()
                        _time.sleep(delay)
            # All retries exhausted — re-raise the last exception
            raise last_exc  # type: ignore[misc]

        return wrapper

    # Allow usage as both @with_db_retry and @with_db_retry(max_retries=3)
    if func is not None:
        return decorator(func)
    return decorator


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_db_and_tables():
    Base.metadata.create_all(bind=engine)

