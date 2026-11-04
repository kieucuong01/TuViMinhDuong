"""HTTP trust-boundary checks; never loads a model or downloads weights."""
import os
import unittest
from server import create_app
from fastapi.testclient import TestClient


class HttpBounds(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(create_app())

    def test_bounded_json(self):
        for body in ([], {"input": "x" * 801}, {"input": "x", "voice": "clone"}):
            self.assertEqual(self.client.post("/v1/audio/speech", json=body).status_code, 400)
        self.assertEqual(self.client.post("/v1/audio/speech", content=b"x" * 8193).status_code, 413)

    def test_no_cloning(self):
        self.assertEqual(self.client.post("/v1/voices", json={}).status_code, 405)

    def test_optional_bearer_auth(self):
        os.environ["VIENEU_API_KEY"] = "test-only-key"
        try:
            self.assertEqual(self.client.post("/v1/audio/speech", json={"input": "Xin chào"}).status_code, 401)
        finally:
            del os.environ["VIENEU_API_KEY"]


if __name__ == "__main__":
    unittest.main()
