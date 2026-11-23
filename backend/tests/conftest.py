import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool

import backend.app.db as app_db
from backend.app.main import app

# Use in-memory SQLite database with StaticPool so all connections share the same memory DB
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@pytest.fixture(name="session", autouse=True)
def session_fixture():
    orig_engine = app_db.engine
    app_db.engine = test_engine

    SQLModel.metadata.create_all(test_engine)

    def get_test_session():
        with Session(test_engine) as session:
            yield session

    app.dependency_overrides[app_db.get_session] = get_test_session

    yield

    SQLModel.metadata.drop_all(test_engine)
    app.dependency_overrides.clear()
    app_db.engine = orig_engine


@pytest.fixture(name="client")
def client_fixture():
    return TestClient(app)
