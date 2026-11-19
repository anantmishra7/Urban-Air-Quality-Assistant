import io
import pytest
from fastapi.testclient import TestClient


def test_create_report_success(client: TestClient):
    payload = {
        "city": "Delhi",
        "latitude": 28.6139,
        "longitude": 77.2090,
        "description": "[Construction Dust] Heavy unpaved road dust near metro station construction.",
        "photo_path": "/uploads/test_photo.jpg",
    }
    res = client.post("/api/report/", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["id"] is not None
    assert data["city"] == "Delhi"
    assert data["status"] == "submitted"
    assert "Construction Dust" in data["description"]


def test_create_report_invalid_coordinates(client: TestClient):
    # Invalid latitude > 90
    payload = {
        "city": "Delhi",
        "latitude": 150.0,
        "longitude": 77.2090,
        "description": "Valid description of pollution incident.",
    }
    res = client.post("/api/report/", json=payload)
    assert res.status_code == 422


def test_create_report_sql_injection_defense(client: TestClient):
    # Payload containing SQL injection attack vectors
    payload = {
        "city": "Delhi'; DROP TABLE report; --",
        "latitude": 28.61,
        "longitude": 77.21,
        "description": "' OR 1=1; -- Smoke emission test",
    }
    res = client.post("/api/report/", json=payload)
    assert res.status_code == 201
    # Check that report table is still intact and reachable
    list_res = client.get("/api/report/")
    assert list_res.status_code == 200
    assert len(list_res.json()) > 0


def test_list_reports(client: TestClient):
    # Pre-create a report
    client.post("/api/report/", json={
        "city": "Mumbai",
        "latitude": 19.0760,
        "longitude": 72.8777,
        "description": "Industrial chimney fumes near port.",
    })
    res = client.get("/api/report/?city=Mumbai")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    assert any(r["city"] == "Mumbai" for r in data)


def test_file_upload_valid_image(client: TestClient):
    fake_image_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"fakeimagecontent" * 10
    files = {"file": ("smoke.jpg", io.BytesIO(fake_image_bytes), "image/jpeg")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    assert "url" in data
    assert data["url"].startswith("/uploads/")
    assert data["size_bytes"] == len(fake_image_bytes)


def test_file_upload_disallowed_extension_rejected(client: TestClient):
    malicious_script = b"print('malicious code')"
    files = {"file": ("exploit.py", io.BytesIO(malicious_script), "text/x-python")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 400
    assert "Unsupported file extension" in res.json()["detail"]


def test_file_upload_disallowed_exe_rejected(client: TestClient):
    fake_exe = b"MZ\x90\x00" + b"\x00" * 20
    files = {"file": ("payload.exe", io.BytesIO(fake_exe), "application/x-msdownload")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 400


def test_file_upload_path_traversal_neutralized(client: TestClient):
    fake_png = b"\x89PNG\r\n\x1a\n" + b"pngcontent"
    # Attempt directory traversal filename
    files = {"file": ("../../etc/passwd.png", io.BytesIO(fake_png), "image/png")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 200
    data = res.json()
    # The server sanitized the filename to safe basename
    assert ".." not in data["filename"]
    assert "/" not in data["filename"]
    assert "\\" not in data["filename"]


def test_file_upload_empty_file_rejected(client: TestClient):
    files = {"file": ("empty.png", io.BytesIO(b""), "image/png")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 400
    assert "Empty file" in res.json()["detail"]
