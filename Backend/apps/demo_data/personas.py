from dataclasses import dataclass


@dataclass(frozen=True)
class Persona:
    key: str
    label: str
    category_weights: dict[str, float]
    tag_weights: dict[str, float]
    allergy_pool: tuple[str, ...] = ()


PERSONAS: tuple[Persona, ...] = (
    Persona(
        key="healthy_office",
        label="Oficina saludable",
        category_weights={
            "Frutas": 0.25,
            "Barritas": 0.2,
            "Granolas": 0.2,
            "Nueces": 0.15,
            "Bebidas frías": 0.1,
            "Snacks": 0.1,
        },
        tag_weights={
            "sin-azucar": 0.3,
            "alto-proteina": 0.25,
            "organico": 0.2,
            "vegano": 0.15,
            "sin-gluten": 0.1,
        },
        allergy_pool=("gluten", "lactosa"),
    ),
    Persona(
        key="sweet_tooth",
        label="Dulce preferido",
        category_weights={
            "Barritas": 0.3,
            "Granolas": 0.25,
            "Snacks": 0.2,
            "Frutas": 0.15,
            "Lacteos": 0.1,
        },
        tag_weights={
            "dulce": 0.4,
            "chocolate": 0.25,
            "energia": 0.2,
            "organico": 0.15,
        },
        allergy_pool=("mani", "nueces"),
    ),
    Persona(
        key="savory_snack",
        label="Snack salado",
        category_weights={
            "Snacks": 0.35,
            "Nueces": 0.25,
            "Otros": 0.15,
            "Barritas": 0.15,
            "Lacteos": 0.1,
        },
        tag_weights={
            "salado": 0.4,
            "crujiente": 0.25,
            "alto-proteina": 0.2,
            "sin-gluten": 0.15,
        },
        allergy_pool=("gluten", "mani"),
    ),
    Persona(
        key="beverage_focus",
        label="Enfocado en bebidas",
        category_weights={
            "Bebidas frías": 0.35,
            "Cafeteria": 0.3,
            "Frutas": 0.15,
            "Lacteos": 0.1,
            "Otros": 0.1,
        },
        tag_weights={
            "hidracion": 0.3,
            "cafeina": 0.25,
            "sin-azucar": 0.25,
            "organico": 0.2,
        },
        allergy_pool=("lactosa",),
    ),
)


def get_persona(key: str) -> Persona:
    for persona in PERSONAS:
        if persona.key == key:
            return persona
    raise KeyError(f"Unknown persona: {key}")
