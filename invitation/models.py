import datetime
from zoneinfo import ZoneInfo

from django.core.validators import FileExtensionValidator
from django.db import models

CAIRO = ZoneInfo("Africa/Cairo")


def default_wedding_datetime():
    return datetime.datetime(2026, 10, 17, 19, 0, tzinfo=CAIRO)


class SiteSettings(models.Model):
    """Single row holding every editable piece of the invitation."""

    # Couple
    groom_name_en = models.CharField("Groom name (English)", max_length=60, default="Abdelfattah")
    groom_name_ar = models.CharField("Groom name (Arabic)", max_length=60, default="عبدالفتاح")
    bride_name_en = models.CharField("Bride name (English)", max_length=60, default="Hoda")
    bride_name_ar = models.CharField("Bride name (Arabic)", max_length=60, default="هدى")
    couple_photo = models.ImageField(
        upload_to="couple/", blank=True,
        help_text="Optional. Shown in the couple section. Portrait photos look best.",
    )
    couple_message_en = models.TextField(
        "Couple message (English)", blank=True,
        default="Two hearts, one story — and we'd love for you to be part of its most beautiful chapter.",
    )
    couple_message_ar = models.TextField(
        "Couple message (Arabic)", blank=True,
        default="قلبين وحكاية واحدة… ويسعدنا تكونوا معانا في أحلى فصل فيها.",
    )

    # Event
    wedding_datetime = models.DateTimeField(
        default=default_wedding_datetime,
        help_text="Used by the countdown. Time zone: Africa/Cairo.",
    )
    venue_name_en = models.CharField("Venue name (English)", max_length=100, default="Acacia Hall")
    venue_name_ar = models.CharField("Venue name (Arabic)", max_length=100, default="قاعة أكاسيا")
    venue_address_en = models.CharField(
        "Venue address (English)", max_length=200, default="El Bagour, Menoufia, Egypt"
    )
    venue_address_ar = models.CharField("Venue address (Arabic)", max_length=200, default="الباجور، المنوفية")
    google_maps_url = models.URLField(
        max_length=500,
        default="https://www.google.com/maps/search/?api=1&query=Acacia+Hall+El+Bagour+Menoufia+Egypt",
        help_text="Paste the share link of the venue from Google Maps.",
    )
    location_qr_code = models.ImageField(
        "Location QR code", upload_to="qr/", blank=True,
        help_text="Upload the venue QR code image. It is displayed at full sharpness, never stretched.",
    )

    # Music
    song = models.FileField(
        upload_to="music/", blank=True,
        validators=[FileExtensionValidator(["mp3", "m4a", "aac", "ogg", "wav"])],
        help_text="The wedding song (mp3 recommended). The music button is hidden until a song is uploaded.",
    )
    song_title = models.CharField(max_length=120, blank=True, help_text="Optional, e.g. the song name.")

    # Sharing
    share_image = models.ImageField(
        upload_to="share/", blank=True,
        help_text="Optional preview image when the link is shared on WhatsApp / Facebook (1200×630).",
    )

    # Behaviour
    guestbook_auto_approve = models.BooleanField(
        default=True,
        help_text="If off, new guestbook messages stay hidden until you approve them.",
    )
    guestbook_open = models.BooleanField(default=True, help_text="Allow new guestbook messages.")
    rsvp_open = models.BooleanField(default=False, help_text="Allow new RSVP responses.")

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Invitation settings"
        verbose_name_plural = "Invitation settings"

    def __str__(self):
        return f"{self.groom_name_en} & {self.bride_name_en}"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        pass  # the settings row is permanent

    @classmethod
    def load(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class ScheduleItem(models.Model):
    """Wedding-day programme shown in the details section."""

    time = models.TimeField()
    title_en = models.CharField("Title (English)", max_length=80)
    title_ar = models.CharField("Title (Arabic)", max_length=80)
    icon = models.CharField(max_length=8, default="✨", help_text="An emoji, e.g. 💍 🍽️ 💃")
    order = models.PositiveSmallIntegerField(default=0)

    class Meta:
        ordering = ["order", "time"]
        verbose_name = "Schedule item"

    def __str__(self):
        return f"{self.time:%H:%M} — {self.title_en}"


class GuestMessage(models.Model):
    name = models.CharField(max_length=60)
    message = models.TextField(max_length=500)
    is_approved = models.BooleanField("Visible", default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Guestbook message"

    def __str__(self):
        return f"{self.name}: {self.message[:40]}"


class RSVP(models.Model):
    name = models.CharField(max_length=60)
    attending = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "RSVP"
        verbose_name_plural = "RSVPs"

    def __str__(self):
        return self.name


class QuizQuestion(models.Model):
    GROOM, BRIDE = "groom", "bride"
    ANSWERS = [(GROOM, "The groom"), (BRIDE, "The bride")]

    question_en = models.CharField("Question (English)", max_length=200)
    question_ar = models.CharField("Question (Arabic)", max_length=200)
    answer = models.CharField(max_length=5, choices=ANSWERS)
    reveal_en = models.CharField(
        "Fun fact after answering (English)", max_length=200, blank=True,
    )
    reveal_ar = models.CharField(
        "Fun fact after answering (Arabic)", max_length=200, blank=True,
    )
    order = models.PositiveSmallIntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["order", "id"]
        verbose_name = "Quiz question"

    def __str__(self):
        return self.question_en


class ScratchMessage(models.Model):
    """One of these is picked at random for the scratch card."""

    text_en = models.CharField("Message (English)", max_length=160)
    text_ar = models.CharField("Message (Arabic)", max_length=160)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Scratch-card message"

    def __str__(self):
        return self.text_en
