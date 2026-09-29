import json
import mimetypes
import os
import re

from django.conf import settings
from django.core.cache import cache
from django.http import FileResponse, Http404, HttpResponse, JsonResponse
from django.shortcuts import render
from django.utils._os import safe_join
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST

from .models import RSVP, GuestMessage, QuizQuestion, ScheduleItem, ScratchMessage, SiteSettings

NAME_MAX = 60
MESSAGE_MAX = 500


@ensure_csrf_cookie
def index(request):
    site = SiteSettings.load()
    quiz = [
        {
            "q_en": q.question_en, "q_ar": q.question_ar, "answer": q.answer,
            "reveal_en": q.reveal_en, "reveal_ar": q.reveal_ar,
        }
        for q in QuizQuestion.objects.filter(is_active=True)
    ]
    scratch = [
        {"en": s.text_en, "ar": s.text_ar} for s in ScratchMessage.objects.filter(is_active=True)
    ] or [{"en": "Your mission: Celebrate, Dance & Have Fun! 🎉", "ar": "مهمتك: تفرح وترقص وتنبسط! 🎉"}]

    lang = request.GET.get("lang")
    context = {
        "site": site,
        "schedule": ScheduleItem.objects.all(),
        "messages_list": GuestMessage.objects.filter(is_approved=True)[:60],
        "config": {
            "weddingDate": site.wedding_datetime.isoformat(),
            "quiz": quiz,
            "scratch": scratch,
            "groom": {"en": site.groom_name_en, "ar": site.groom_name_ar},
            "bride": {"en": site.bride_name_en, "ar": site.bride_name_ar},
            "autoApprove": site.guestbook_auto_approve,
        },
        "initial_lang": lang if lang in ("ar", "en") else "",
    }
    return render(request, "invitation/index.html", context)


def _client_ip(request):
    forwarded = request.META.get("HTTP_X_FORWARDED_FOR")
    return (forwarded.split(",")[0] if forwarded else request.META.get("REMOTE_ADDR", "")).strip()


def _rate_limited(request, bucket, limit, window):
    key = f"rl:{bucket}:{_client_ip(request)}"
    count = cache.get(key, 0)
    if count >= limit:
        return True
    cache.set(key, count + 1, window)
    return False


def _payload(request):
    if request.content_type == "application/json":
        try:
            return json.loads(request.body or b"{}")
        except ValueError:
            return {}
    return request.POST


def _clean_name(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()[:NAME_MAX]


def _clean_message(value):
    # keep the guest's line breaks, but no more than two in a row
    return re.sub(r"\n{3,}", "\n\n", str(value or "").replace("\r", "")).strip()[:MESSAGE_MAX]


@require_POST
def guestbook_create(request):
    site = SiteSettings.load()
    if not site.guestbook_open:
        return JsonResponse({"ok": False, "error": "closed"}, status=403)
    data = _payload(request)
    if data.get("website"):  # honeypot: humans never fill this
        return JsonResponse({"ok": True, "pending": True})
    name, message = _clean_name(data.get("name")), _clean_message(data.get("message"))
    if not name or not message:
        return JsonResponse({"ok": False, "error": "missing"}, status=400)
    if _rate_limited(request, "guestbook", 6, 600):
        return JsonResponse({"ok": False, "error": "slow_down"}, status=429)

    entry = GuestMessage.objects.create(name=name, message=message, is_approved=site.guestbook_auto_approve)
    return JsonResponse({
        "ok": True,
        "pending": not entry.is_approved,
        "entry": {"id": entry.id, "name": entry.name, "message": entry.message},
    })


@require_GET
def guestbook_list(request):
    after = request.GET.get("after")
    qs = GuestMessage.objects.filter(is_approved=True)
    if after and after.isdigit():
        qs = qs.filter(id__gt=int(after))
    return JsonResponse({
        "entries": [{"id": m.id, "name": m.name, "message": m.message} for m in qs[:60]]
    })


@require_POST
def rsvp_create(request):
    site = SiteSettings.load()
    if not site.rsvp_open:
        return JsonResponse({"ok": False, "error": "closed"}, status=403)
    data = _payload(request)
    if data.get("website"):
        return JsonResponse({"ok": True})
    name = _clean_name(data.get("name"))
    if not name:
        return JsonResponse({"ok": False, "error": "missing"}, status=400)
    if _rate_limited(request, "rsvp", 8, 600):
        return JsonResponse({"ok": False, "error": "slow_down"}, status=429)

    RSVP.objects.create(name=name, attending=True)
    return JsonResponse({"ok": True, "name": name})


RANGE_RE = re.compile(r"bytes=(\d*)-(\d*)")


def serve_media(request, path):
    """Serve uploaded files with HTTP Range support (needed by iOS Safari for audio)."""
    try:
        full_path = safe_join(str(settings.MEDIA_ROOT), path)
    except Exception:
        raise Http404
    if not os.path.isfile(full_path):
        raise Http404

    size = os.path.getsize(full_path)
    content_type = mimetypes.guess_type(full_path)[0] or "application/octet-stream"
    match = RANGE_RE.fullmatch(request.headers.get("Range", "").strip())

    if not match or not any(match.groups()):
        response = FileResponse(open(full_path, "rb"), content_type=content_type)
        response["Accept-Ranges"] = "bytes"
        response["Cache-Control"] = "public, max-age=86400"
        return response

    start_s, end_s = match.groups()
    if start_s:
        start = int(start_s)
        end = min(int(end_s), size - 1) if end_s else size - 1
    else:  # suffix range: last N bytes
        start, end = max(size - int(end_s), 0), size - 1
    if start > end or start >= size:
        response = HttpResponse(status=416)
        response["Content-Range"] = f"bytes */{size}"
        return response

    with open(full_path, "rb") as fh:
        fh.seek(start)
        chunk = fh.read(end - start + 1)
    response = HttpResponse(chunk, status=206, content_type=content_type)
    response["Content-Range"] = f"bytes {start}-{end}/{size}"
    response["Accept-Ranges"] = "bytes"
    response["Content-Length"] = str(len(chunk))
    response["Cache-Control"] = "public, max-age=86400"
    return response
