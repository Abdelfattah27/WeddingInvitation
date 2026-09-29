from django.contrib import admin
from django.utils import timezone


class WeddingAdminSite(admin.AdminSite):
    site_header = "Abdelfattah ❤ Hoda"
    site_title = "Wedding CMS"
    index_title = "Wedding dashboard"
    site_url = "/"

    def index(self, request, extra_context=None):
        from .models import RSVP, GuestMessage, SiteSettings

        settings = SiteSettings.load()
        remaining = settings.wedding_datetime - timezone.now()
        extra_context = {
            **(extra_context or {}),
            "stats": {
                "attending": RSVP.objects.filter(attending=True).count(),
                "messages": GuestMessage.objects.filter(is_approved=True).count(),
                "pending": GuestMessage.objects.filter(is_approved=False).count(),
                "days_left": max(remaining.days, 0),
            },
            "recent_rsvps": RSVP.objects.filter(attending=True)[:6],
            "recent_messages": GuestMessage.objects.all()[:4],
        }
        return super().index(request, extra_context)
