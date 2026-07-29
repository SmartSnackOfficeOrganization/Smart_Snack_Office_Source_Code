"""Curated catalogs for realistic snack / office product names."""

from __future__ import annotations

import random
from decimal import Decimal

FIRST_NAMES = [
    "Ana",
    "Carlos",
    "Diana",
    "Eduardo",
    "Fernanda",
    "Gabriel",
    "Helena",
    "Ivan",
    "Julia",
    "Kevin",
    "Laura",
    "Miguel",
    "Natalia",
    "Oscar",
    "Paula",
    "Roberto",
    "Sofia",
    "Tomas",
    "Valentina",
    "Andres",
]

LAST_NAMES = [
    "Garcia",
    "Rodriguez",
    "Martinez",
    "Lopez",
    "Hernandez",
    "Gonzalez",
    "Perez",
    "Sanchez",
    "Ramirez",
    "Torres",
    "Flores",
    "Rivera",
    "Gomez",
    "Diaz",
    "Reyes",
]

COMPANY_SUFFIXES = [
    "Foods",
    "Snacks SAS",
    "Nutricion",
    "Office Bites",
    "Healthy Co",
    "Natural Market",
]

ADDRESSES = [
    "Calle 100 #19-50, Bogota",
    "Carrera 7 #71-21, Bogota",
    "Av. El Dorado #68-50, Bogota",
    "Calle 10 #5-51, Cali",
    "Carrera 43A #1-50, Medellin",
    "Calle 53 #70-20, Barranquilla",
]

# category_name -> (name templates, default tags, ingredients snippets)
PRODUCT_TEMPLATES: dict[str, list[dict]] = {
    "Snacks": [
        {
            "name": "Chips de {flavor} horneados",
            "tags": ["salado", "crujiente"],
            "flavors": ["yuca", "platano", "remolacha", "zanahoria"],
        },
        {
            "name": "Mix office {flavor}",
            "tags": ["salado", "alto-proteina"],
            "flavors": ["clasico", "picante", "herb", "sesamo"],
        },
    ],
    "Bebidas frías": [
        {
            "name": "Jugo {flavor} 350ml",
            "tags": ["hidracion", "sin-azucar"],
            "flavors": ["naranja", "mora", "lulo", "maracuya", "verde"],
        },
        {
            "name": "Te frio {flavor}",
            "tags": ["hidracion", "organico"],
            "flavors": ["limon", "durazno", "hibisco", "matcha"],
        },
    ],
    "Frutas": [
        {
            "name": "Mix frutas {flavor}",
            "tags": ["organico", "sin-azucar"],
            "flavors": ["tropical", "bosque", "andes", "citrus"],
        },
        {
            "name": "Manzana deshidratada {flavor}",
            "tags": ["dulce", "sin-gluten"],
            "flavors": ["canela", "natural", "miel"],
        },
    ],
    "Barritas": [
        {
            "name": "Barrita {flavor}",
            "tags": ["energia", "alto-proteina"],
            "flavors": ["chocolate", "vainilla", "coco", "mani", "berries"],
        },
        {
            "name": "Protein bar {flavor}",
            "tags": ["alto-proteina", "sin-azucar"],
            "flavors": ["cacao", "cafe", "cookie", "banana"],
        },
    ],
    "Granolas": [
        {
            "name": "Granola {flavor} 300g",
            "tags": ["energia", "organico"],
            "flavors": ["miel", "cacao", "frutos secos", "coco"],
        },
        {
            "name": "Clusters {flavor}",
            "tags": ["dulce", "crujiente"],
            "flavors": ["maple", "almendra", "arandano"],
        },
    ],
    "Nueces": [
        {
            "name": "Mix nueces {flavor}",
            "tags": ["alto-proteina", "salado"],
            "flavors": ["tostado", "natural", "honey", "spicy"],
        },
        {
            "name": "Almendras {flavor}",
            "tags": ["alto-proteina", "sin-gluten"],
            "flavors": ["saladas", "ahumadas", "cacao"],
        },
    ],
    "Lacteos": [
        {
            "name": "Yogur {flavor} 150g",
            "tags": ["alto-proteina", "dulce"],
            "flavors": ["natural", "fresa", "mango", "griego"],
        },
        {
            "name": "Queso snack {flavor}",
            "tags": ["salado", "alto-proteina"],
            "flavors": ["cheddar", "gouda", "light"],
        },
    ],
    "Cafeteria": [
        {
            "name": "Cafe {flavor} 250ml",
            "tags": ["cafeina", "energia"],
            "flavors": ["americano", "latte", "cold brew", "mocha"],
        },
        {
            "name": "Te {flavor} premium",
            "tags": ["organico", "hidracion"],
            "flavors": ["verde", "chai", "negro", "rooibos"],
        },
    ],
    "Otros": [
        {
            "name": "Snack pack {flavor}",
            "tags": ["energia", "crujiente"],
            "flavors": ["office", "viaje", "reunion", "focus"],
        },
        {
            "name": "Trail mix {flavor}",
            "tags": ["alto-proteina", "energia"],
            "flavors": ["clasico", "dulce-salado", "proteico"],
        },
    ],
}

ALL_TAGS = [
    "sin-azucar",
    "alto-proteina",
    "organico",
    "vegano",
    "sin-gluten",
    "dulce",
    "chocolate",
    "energia",
    "salado",
    "crujiente",
    "hidracion",
    "cafeina",
    "gluten",
    "lactosa",
    "mani",
    "nueces",
]


def random_full_name(rng: random.Random) -> str:
    return f"{rng.choice(FIRST_NAMES)} {rng.choice(LAST_NAMES)}"


def random_business_name(rng: random.Random) -> str:
    return f"{rng.choice(LAST_NAMES)} {rng.choice(COMPANY_SUFFIXES)}"


def random_address(rng: random.Random) -> str:
    return rng.choice(ADDRESSES)


def build_product_spec(
    rng: random.Random, category_name: str, index: int
) -> dict:
    templates = PRODUCT_TEMPLATES.get(category_name) or PRODUCT_TEMPLATES["Otros"]
    template = rng.choice(templates)
    flavor = rng.choice(template["flavors"])
    name = template["name"].format(flavor=flavor.title())
    if index:
        name = f"{name} #{index}"

    price = Decimal(str(round(rng.uniform(2500, 28000), -2)))
    stock = rng.randint(80, 500)
    tags = list(template["tags"])
    # Occasionally attach allergen tags for realism
    if rng.random() < 0.15:
        tags.append(rng.choice(["gluten", "lactosa", "mani", "nueces"]))

    nutrition = {
        "calories": Decimal(str(rng.randint(80, 450))),
        "protein_g": Decimal(str(round(rng.uniform(1, 25), 1))),
        "fat_g": Decimal(str(round(rng.uniform(0, 20), 1))),
        "carbs_g": Decimal(str(round(rng.uniform(5, 60), 1))),
        "sugar_g": Decimal(str(round(rng.uniform(0, 30), 1))),
        "sodium_mg": Decimal(str(rng.randint(10, 600))),
        "serving_size": rng.choice(["30g", "40g", "50g", "1 unidad", "250ml"]),
    }

    return {
        "name": name,
        "description": f"{name} ideal para la oficina. Sabor {flavor}.",
        "ingredients": f"Ingredientes naturales, {flavor}, preservantes naturales.",
        "price": price,
        "stock": stock,
        "tags": tags,
        "nutrition_facts": nutrition,
        "is_featured": rng.random() < 0.12,
    }
