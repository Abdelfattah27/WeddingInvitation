from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("api/guestbook/", views.guestbook_list, name="guestbook-list"),
    path("api/guestbook/new/", views.guestbook_create, name="guestbook-create"),
    path("api/rsvp/", views.rsvp_create, name="rsvp-create"),
]
