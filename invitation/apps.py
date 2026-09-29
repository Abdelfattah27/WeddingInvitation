from django.apps import AppConfig
from django.contrib.admin.apps import AdminConfig


class InvitationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "invitation"
    verbose_name = "Wedding invitation"


class WeddingAdminConfig(AdminConfig):
    default_site = "invitation.admin_site.WeddingAdminSite"
