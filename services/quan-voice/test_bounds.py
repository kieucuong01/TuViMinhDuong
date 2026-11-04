import unittest
from server import validate_speech, VOICE


class SpeechBounds(unittest.TestCase):
    def test_contract(self):
        result = validate_speech({"input": "Tử Vi và Thiên Phủ"})
        self.assertEqual((result["voice"], result["sample_rate"], result["response_format"]), (VOICE, 24000, "pcm"))

    def test_rejects_unbounded_or_unapproved(self):
        for body in (None, [], {"input": " "}, {"input": "x" * 801}, {"input": 1},
                     {"input": "x", "voice": "clone"}, {"input": "x", "sample_rate": 48000},
                     {"input": "x", "response_format": "wav"}):
            with self.subTest(body=body), self.assertRaises(ValueError):
                validate_speech(body)


if __name__ == "__main__":
    unittest.main()
