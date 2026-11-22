"""Offline tests for scripts/gemini_design_handoff.py (no API calls)."""
import importlib.util
import json
from pathlib import Path
import unittest

SOURCE = Path(__file__).resolve().parents[1] / "scripts" / "gemini_design_handoff.py"
spec = importlib.util.spec_from_file_location("gemini_design_handoff", SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class GeminiHandoffTests(unittest.TestCase):
    def test_expected_model(self):
        self.assertIn("gemini-3.8-flash:generateContent", module.model_url("gemini-3.8-flash"))

    def test_reject_invalid_models(self):
        for model in ("", "https://malicious", "../gemini-model", "gemini-something?key=abc"):
            with self.subTest(model=model):
                with self.assertRaises(ValueError):
                    module.model_url(model)

    def test_payload_preserves_request(self):
        request = "[Gemini Design Request] Make accessible buttons for Wordville cards with 44px tap targets."
        data = json.loads(module.build_payload(request, "# Wordville").decode("utf-8"))
        self.assertIn(request, data["contents"][0]["parts"][0]["text"])
        self.assertEqual(data["generationConfig"]["maxOutputTokens"], 4096)
        self.assertNotIn("GEMINI_API_KEY", json.dumps(data))

    def test_parse_text_response(self):
        document = {"candidates": [{"content": {"parts": [
            {"text": "Design goals: " + "detail " * 30},
            {"thought": True, "text": "hidden thought must be excluded"}]}}]}
        text = module.parse_response(document)
        self.assertIn("Design goals", text)
        self.assertNotIn("hidden thought", text)

    def test_empty_response_is_rejected(self):
        with self.assertRaises(ValueError):
            module.parse_response({"candidates": []})


if __name__ == "__main__":
    unittest.main()
