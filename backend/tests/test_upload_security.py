"""
Extended upload security tests – oversized files, magic byte verification, edge cases.
"""

import io

from fastapi.testclient import TestClient


def test_file_upload_oversized_rejected(client: TestClient):
    """Test that files exceeding 5 MB are rejected during chunk streaming."""
    header = b"\xff\xd8\xff\xe0\x00\x10JFIF"
    oversized_content = header + b"\x00" * (5 * 1024 * 1024 + 1024)
    files = {"file": ("huge.jpg", io.BytesIO(oversized_content), "image/jpeg")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 400
    assert "too large" in res.json()["detail"].lower()


def test_file_upload_magic_byte_valid_png_and_jpeg(client: TestClient):
    """Test valid PNG and JPEG magic bytes are properly accepted."""
    jpeg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00" + b"\x00" * 50
    files = {"file": ("sample.jpg", io.BytesIO(jpeg_bytes), "image/jpeg")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 200
    assert "url" in res.json()

    png_bytes = b"\x89PNG\r\n\x1a\n" + b"\x00" * 50
    files = {"file": ("sample.png", io.BytesIO(png_bytes), "image/png")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 200


def test_file_upload_fake_image_extension_with_text_content(client: TestClient):
    """Test that a .jpg file with plain text content is rejected via magic byte check."""
    text_content = b"This is plain text pretending to be an image file."
    files = {"file": ("photo.jpg", io.BytesIO(text_content), "image/jpeg")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 400
    assert "signature" in res.json()["detail"].lower() or "image" in res.json()["detail"].lower()


def test_file_upload_webp_valid(client: TestClient):
    """Test that a valid WebP file is accepted."""
    webp_header = b"RIFF\x24\x00\x00\x00WEBPVP8 " + b"\x00" * 30
    files = {"file": ("photo.webp", io.BytesIO(webp_header), "image/webp")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 200


def test_file_upload_no_extension(client: TestClient):
    """Test that a file without extension is rejected."""
    content = b"\xff\xd8\xff\xe0\x00\x10JFIF" + b"valid"
    files = {"file": ("photo", io.BytesIO(content), "image/jpeg")}
    res = client.post("/api/upload", files=files)
    assert res.status_code == 400
    assert "extension" in res.json()["detail"].lower()
