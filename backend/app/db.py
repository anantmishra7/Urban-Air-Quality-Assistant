import os
from typing import List, Optional
from datetime import datetime, timezone

from sqlmodel import SQLModel, Field, create_engine, Session, select

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./breathecity.db")
engine = create_engine(DATABASE_URL, echo=False)


class Report(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    city: str
    latitude: float
    longitude: float
    description: str
    photo_path: Optional[str] = None
    status: str = Field(default="submitted")
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    return Session(engine)
