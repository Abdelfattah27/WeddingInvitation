import json
import shutil
import tempfile

from django.contrib.auth.models import User
from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings

from .models import RSVP, GuestMessage, SiteSettings


class InvitationTests(TestCase):
    def setUp(self):
        cache.clear()

    def post_json(self, url, data):
        return self.client.post(url, json.dumps(data), content_type="application/json")

    def test_index_renders_bilingual_content(self):
        res = self.client.get("/")
        self.assertEqual(res.status_code, 200)
        for text in ["عبدالفتاح", "Abdelfattah", "17 • 10 • 2026", "wedding-config", "افتح الدعوة"]:
            self.assertContains(res, text)
        config = res.context["config"]
        self.assertEqual(len(config["quiz"]), 5)
        self.assertEqual(len(config["scratch"]), 3)

    def test_guestbook_create_and_list(self):
        res = self.post_json("/api/guestbook/new/", {"name": " أحمد ", "message": "ربنا يسعدكم ❤️"})
        self.assertTrue(res.json()["ok"])
        self.assertEqual(GuestMessage.objects.get().name, "أحمد")
        entries = self.client.get("/api/guestbook/").json()["entries"]
        self.assertEqual(entries[0]["message"], "ربنا يسعدكم ❤️")

    def test_guestbook_requires_name_and_message(self):
        res = self.post_json("/api/guestbook/new/", {"name": "Ahmed", "message": "  "})
        self.assertEqual(res.status_code, 400)
        self.assertFalse(GuestMessage.objects.exists())

    def test_guestbook_moderation(self):
        site = SiteSettings.load()
        site.guestbook_auto_approve = False
        site.save()
        res = self.post_json("/api/guestbook/new/", {"name": "Ahmed", "message": "Congrats!"})
        self.assertTrue(res.json()["pending"])
        self.assertEqual(self.client.get("/api/guestbook/").json()["entries"], [])

    def test_honeypot_is_silently_dropped(self):
        res = self.post_json("/api/guestbook/new/", {"name": "bot", "message": "spam", "website": "x"})
        self.assertEqual(res.status_code, 200)
        self.assertFalse(GuestMessage.objects.exists())

    def test_rate_limit(self):
        for _ in range(6):
            self.post_json("/api/guestbook/new/", {"name": "A", "message": "B"})
        res = self.post_json("/api/guestbook/new/", {"name": "A", "message": "B"})
        self.assertEqual(res.status_code, 429)

    def test_rsvp(self):
        res = self.post_json("/api/rsvp/", {"name": "Sara"})
        self.assertEqual(res.json(), {"ok": True, "name": "Sara"})
        self.assertTrue(RSVP.objects.get().attending)
        self.assertEqual(self.post_json("/api/rsvp/", {"name": ""}).status_code, 400)

    def test_csrf_enforced(self):
        from django.test import Client

        client = Client(enforce_csrf_checks=True)
        res = client.post("/api/rsvp/", json.dumps({"name": "X"}), content_type="application/json")
        self.assertEqual(res.status_code, 403)

    def test_settings_singleton(self):
        SiteSettings.load()
        SiteSettings().save()
        self.assertEqual(SiteSettings.objects.count(), 1)

    def test_admin_dashboard_and_settings_page(self):
        User.objects.create_superuser("admin", "a@example.com", "pw")
        self.client.login(username="admin", password="pw")
        res = self.client.get("/admin/")
        self.assertContains(res, "Guests attending")
        res = self.client.get("/admin/invitation/sitesettings/", follow=True)
        self.assertContains(res, "Location QR code")


@override_settings(MEDIA_ROOT=tempfile.mkdtemp())
class MediaTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        from django.conf import settings

        shutil.rmtree(settings.MEDIA_ROOT, ignore_errors=True)
        super().tearDownClass()

    def test_song_supports_range_requests(self):
        site = SiteSettings.load()
        site.song = SimpleUploadedFile("song.mp3", b"0123456789", content_type="audio/mpeg")
        site.save()
        url = site.song.url
        res = self.client.get(url, HTTP_RANGE="bytes=2-5")
        self.assertEqual(res.status_code, 206)
        self.assertEqual(res.content, b"2345")
        self.assertEqual(res["Content-Range"], "bytes 2-5/10")
        self.assertContains(self.client.get("/"), "music-btn")

    def test_media_path_traversal_blocked(self):
        self.assertEqual(self.client.get("/media/../manage.py").status_code, 404)
