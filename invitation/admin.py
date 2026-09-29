import csv

from django.contrib import admin
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import reverse
from django.utils.html import format_html

from .models import RSVP, GuestMessage, QuizQuestion, ScheduleItem, ScratchMessage, SiteSettings


def export_csv(fields):
    def action(modeladmin, request, queryset):
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        name = modeladmin.model._meta.verbose_name_plural.replace(" ", "_")
        response["Content-Disposition"] = f'attachment; filename="{name}.csv"'
        response.write("﻿")  # BOM so Excel shows Arabic correctly
        writer = csv.writer(response)
        writer.writerow(fields)
        for obj in queryset:
            writer.writerow([getattr(obj, f) for f in fields])
        return response

    action.short_description = "Export selected to CSV"
    return action


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    fieldsets = [
        ("The couple", {"fields": [
            ("groom_name_en", "groom_name_ar"),
            ("bride_name_en", "bride_name_ar"),
            "couple_photo",
            "couple_message_en", "couple_message_ar",
        ]}),
        ("Date & venue", {"fields": [
            "wedding_datetime",
            ("venue_name_en", "venue_name_ar"),
            ("venue_address_en", "venue_address_ar"),
            "google_maps_url",
            "location_qr_code", "qr_preview",
        ]}),
        ("Music", {"fields": ["song", "song_title"]}),
        ("Guest interaction", {"fields": ["guestbook_open", "guestbook_auto_approve", "rsvp_open"]}),
        ("Link preview", {"fields": ["share_image"], "classes": ["collapse"]}),
    ]
    readonly_fields = ["qr_preview"]

    @admin.display(description="QR preview")
    def qr_preview(self, obj):
        if obj.location_qr_code:
            return format_html(
                '<img src="{}" style="width:160px;height:160px;object-fit:contain;'
                'image-rendering:pixelated;background:#fff;padding:8px;border-radius:8px">',
                obj.location_qr_code.url,
            )
        return "No QR code uploaded yet."

    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def changelist_view(self, request, extra_context=None):
        obj = SiteSettings.load()
        return HttpResponseRedirect(reverse("admin:invitation_sitesettings_change", args=[obj.pk]))


@admin.register(ScheduleItem)
class ScheduleItemAdmin(admin.ModelAdmin):
    list_display = ["time", "icon", "title_en", "title_ar", "order"]
    list_editable = ["order"]


@admin.register(GuestMessage)
class GuestMessageAdmin(admin.ModelAdmin):
    list_display = ["name", "short_message", "is_approved", "created_at"]
    list_filter = ["is_approved", "created_at"]
    list_editable = ["is_approved"]
    search_fields = ["name", "message"]
    actions = ["approve", "hide", export_csv(["name", "message", "created_at"])]
    date_hierarchy = "created_at"

    @admin.display(description="Message")
    def short_message(self, obj):
        return obj.message[:80] + ("…" if len(obj.message) > 80 else "")

    @admin.action(description="Show selected messages on the site")
    def approve(self, request, queryset):
        self.message_user(request, f"{queryset.update(is_approved=True)} message(s) are now visible.")

    @admin.action(description="Hide selected messages")
    def hide(self, request, queryset):
        self.message_user(request, f"{queryset.update(is_approved=False)} message(s) hidden.")


@admin.register(RSVP)
class RSVPAdmin(admin.ModelAdmin):
    list_display = ["name", "attending", "created_at"]
    list_filter = ["attending"]
    search_fields = ["name"]
    actions = [export_csv(["name", "attending", "created_at"])]

    def changelist_view(self, request, extra_context=None):
        extra_context = {
            **(extra_context or {}),
            "subtitle": f"{RSVP.objects.filter(attending=True).count()} guests confirmed",
        }
        return super().changelist_view(request, extra_context)


@admin.register(QuizQuestion)
class QuizQuestionAdmin(admin.ModelAdmin):
    list_display = ["question_en", "question_ar", "answer", "order", "is_active"]
    list_editable = ["order", "is_active"]
    fields = [("question_en", "question_ar"), "answer", ("reveal_en", "reveal_ar"), ("order", "is_active")]


@admin.register(ScratchMessage)
class ScratchMessageAdmin(admin.ModelAdmin):
    list_display = ["text_en", "text_ar", "is_active"]
    list_editable = ["is_active"]
