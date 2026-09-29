# Abdelfattah ❤️ Hoda — Wedding Invitation

A bilingual (Arabic RTL / English LTR) digital wedding invitation built with Django.
The Django admin is the CMS for all text, the date, the venue, the QR code, the song, quiz questions and scratch-card messages. It also collects guestbook messages and RSVPs.

## Run locally

```bash
pip install -r requirements.txt
python manage.py migrate          # also seeds default content
python manage.py createsuperuser
python manage.py runserver
```

- Invitation: http://127.0.0.1:8000/ (`?lang=en` or `?lang=ar` forces a language)
- CMS: http://127.0.0.1:8000/admin/

## What to fill in the admin

| Where | What |
|---|---|
| **Invitation settings** | Upload the **Location QR code**, the **Song**, and optionally a couple photo and link-preview image. Set the exact **wedding time** and paste the real **Google Maps link**. |
| **Quiz questions** | The seeded answers are placeholders. Set who the real answer is for each question. |
| **Schedule items** | The evening programme (times and titles in AR/EN). |
| **Scratch-card messages** | One is picked at random for each visitor. |
| **Guestbook messages** | Hide/show messages, or turn off auto-approve in settings to moderate first. |
| **RSVPs** | See who is coming, and export to CSV (Excel-friendly, Arabic safe). |

## Deploying

Set environment variables:

```
DJANGO_DEBUG=false
DJANGO_SECRET_KEY=<long random string>
DJANGO_ALLOWED_HOSTS=yourdomain.com
DJANGO_CSRF_TRUSTED_ORIGINS=https://yourdomain.com
```

Then run `python manage.py collectstatic` and serve with `gunicorn wedding_site.wsgi`.
WhiteNoise (in requirements) serves static files. Uploaded media is served by Django with HTTP Range support, which iOS Safari needs to play the song. Keep `db.sqlite3` and `media/` on persistent storage.

## Easter eggs 🤫

- Tap the groom's name 5 times.
- Open the browser console.
- View the page source.
