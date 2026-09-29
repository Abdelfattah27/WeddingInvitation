from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path

from invitation.views import serve_media

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("invitation.urls")),
]

if settings.SERVE_MEDIA:
    urlpatterns += [
        re_path(r"^media/(?P<path>.+)$", serve_media, name="media"),
    ]
