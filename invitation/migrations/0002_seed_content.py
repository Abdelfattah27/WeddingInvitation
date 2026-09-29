import datetime

from django.db import migrations

SCHEDULE = [
    (datetime.time(19, 0), "Guests arrive", "استقبال الضيوف", "🌿", 1),
    (datetime.time(19, 45), "Grand entrance", "زفة العروسين", "💍", 2),
    (datetime.time(21, 0), "Dinner", "العشاء", "🍽️", 3),
    (datetime.time(22, 0), "Dance floor opens", "وقت الرقص", "💃", 4),
]

QUIZ = [
    ("Who is more likely to be late?", "مين فيهم دايمًا بيتأخر؟", "bride",
     "Worth the wait, every single time.", "بس التأخير بيستاهل كل مرة 😄"),
    ("Who wakes up later?", "مين بيصحى متأخر أكتر؟", "groom",
     "Alarm #7 is usually the one that works.", "المنبه السابع عادة هو اللي بيصحّيه ⏰"),
    ("Who said \"I love you\" first?", "مين قال «بحبك» الأول؟", "groom",
     "And he'd say it again in a heartbeat.", "ولسه بيقولها كل يوم ❤️"),
    ("Who is more stubborn?", "مين الأعند فيهم؟", "bride",
     "She's usually right anyway.", "وغالبًا بيطلع معاها حق 😌"),
    ("Who takes longer to choose what to wear?", "مين بياخد وقت أطول عشان يختار لبسه؟", "bride",
     "A classic — no surprises here.", "دي كانت سهلة 😅"),
]

SCRATCH = [
    ("You're officially invited to dance with us! 💃🕺", "إنت رسميًا معزوم ترقص معانا! 💃🕺"),
    ("Don't forget to take a photo with the bride & groom 📸", "متنساش تتصور مع العروسة والعريس 📸"),
    ("Your mission: Celebrate, Dance & Have Fun! 🎉", "مهمتك: تفرح وترقص وتنبسط! 🎉"),
]


def seed(apps, schema_editor):
    SiteSettings = apps.get_model("invitation", "SiteSettings")
    ScheduleItem = apps.get_model("invitation", "ScheduleItem")
    QuizQuestion = apps.get_model("invitation", "QuizQuestion")
    ScratchMessage = apps.get_model("invitation", "ScratchMessage")

    SiteSettings.objects.get_or_create(pk=1)
    if not ScheduleItem.objects.exists():
        for time, en, ar, icon, order in SCHEDULE:
            ScheduleItem.objects.create(time=time, title_en=en, title_ar=ar, icon=icon, order=order)
    if not QuizQuestion.objects.exists():
        for i, (q_en, q_ar, answer, r_en, r_ar) in enumerate(QUIZ, 1):
            QuizQuestion.objects.create(
                question_en=q_en, question_ar=q_ar, answer=answer, reveal_en=r_en, reveal_ar=r_ar, order=i
            )
    if not ScratchMessage.objects.exists():
        for en, ar in SCRATCH:
            ScratchMessage.objects.create(text_en=en, text_ar=ar)


class Migration(migrations.Migration):
    dependencies = [("invitation", "0001_initial")]
    operations = [migrations.RunPython(seed, migrations.RunPython.noop)]
