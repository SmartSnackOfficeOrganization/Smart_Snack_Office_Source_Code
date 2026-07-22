from django.db import migrations


CATEGORIES = [
    {"name": "Snacks", "description": "Bocadillos y aperitivos saludables"},
    {"name": "Bebidas", "description": "Jugos, tes y bebidas saludables"},
    {"name": "Frutas", "description": "Frutas frescas y deshidratadas"},
    {"name": "Barritas", "description": "Barritas energeticas y nutritivas"},
    {"name": "Granolas", "description": "Granolas, cereales y toppings"},
    {"name": "Nueces", "description": "Nueces, frutos secos y mix"},
    {"name": "Lacteos", "description": "Yogures, quesos y productos lacteos"},
    {"name": "Cafeteria", "description": "Cafe, te y bebidas calientes"},
    {"name": "Otros", "description": "Otros productos saludables"},
]


def seed_categories(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    for cat in CATEGORIES:
        Category.objects.get_or_create(name=cat["name"], defaults={"description": cat["description"]})


def reverse_seed_categories(apps, schema_editor):
    Category = apps.get_model("catalog", "Category")
    names = [cat["name"] for cat in CATEGORIES]
    Category.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("catalog", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_categories, reverse_seed_categories),
    ]
