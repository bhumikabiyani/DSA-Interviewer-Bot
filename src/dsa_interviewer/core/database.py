import functools
import logging
import time as _time

from sqlalchemy import create_engine
from sqlalchemy.exc import DisconnectionError, OperationalError
from sqlalchemy.orm import declarative_base, sessionmaker

from dsa_interviewer.core.config import settings

logger = logging.getLogger(__name__)

SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def with_db_retry(func):
    """Decorator that retries a function once on transient DB errors.

    Catches ``OperationalError`` and ``DisconnectionError`` (connection resets,
    pool timeouts, etc.), waits 0.5 s, then calls the function **one** more
    time.  All other exceptions propagate immediately.
    """

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except (OperationalError, DisconnectionError) as exc:
            logger.warning(
                "Transient DB error in %s, retrying once: %s", func.__name__, exc
            )
            _time.sleep(0.5)
            return func(*args, **kwargs)

    return wrapper


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_db_and_tables():
    Base.metadata.create_all(bind=engine)

