import os
from collections.abc import Generator
from datetime import UTC, datetime

from sqlmodel import Field, Session, SQLModel, create_engine

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./breathecity.db")
engine = create_engine(DATABASE_URL, echo=False)


class Report(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    city: str
    latitude: float
    longitude: float
    description: str
    photo_path: str | None = None
    status: str = Field(default="submitted")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


def init_db():
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
