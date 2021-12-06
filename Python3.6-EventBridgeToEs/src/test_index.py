from unittest import TestCase, mock
from index import main_handler
import os


class Test(TestCase):
    def test_main_handler(self):
        with mock.patch.dict(os.environ, {"ES_INDEX_NAME": ""}):
            with self.assertRaisesRegex(ValueError, "ES_INDEX_NAME is empty"):
                main_handler({}, {})

        with mock.patch.dict(os.environ, {"ES_INDEX_NAME": "ERROR_INDEX_NAME"}):
            with self.assertRaisesRegex(ValueError, "ES_INDEX_NAME must be lowercase"):
                main_handler({}, {})

        with mock.patch.dict(os.environ, {"ES_INDEX_NAME": "index_name"}):
            event_list = {
                "EventList": []
            }
            ret = main_handler(event_list, {})
            self.assertEqual(ret, "error, empty event")

