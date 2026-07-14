"""
Motor de búsqueda TF-IDF para la HU-05 (Búsqueda inteligente de productos).

Este módulo es *independiente de Django*: recibe texto plano y devuelve un
ranking por relevancia semántica usando scikit-learn (TF-IDF + similitud
coseno). Vive en ``ml/`` según la arquitectura del proyecto (CLAUDE.md: los
modelos de Scikit-learn van en la carpeta ``ml/``).

La orquestación con la base de datos (coincidencia literal + construcción del
corpus a partir de los productos) se hace en
``Backend/apps/catalog/search_service.py``, que es quien llama a
``rank_documents``.
"""

from __future__ import annotations

from typing import List, Sequence, Tuple

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import linear_kernel

# Lista mínima de palabras vacías en español. scikit-learn solo trae stopwords
# en inglés, así que aportamos un conjunto pequeño para mejorar la relevancia
# sin agregar dependencias externas.
SPANISH_STOPWORDS: List[str] = [
    "a",
    "al",
    "algo",
    "alguna",
    "algunas",
    "alguno",
    "algunos",
    "ante",
    "antes",
    "como",
    "con",
    "contra",
    "cual",
    "cuando",
    "de",
    "del",
    "desde",
    "donde",
    "durante",
    "e",
    "el",
    "ella",
    "ellas",
    "ellos",
    "en",
    "entre",
    "era",
    "es",
    "esa",
    "ese",
    "eso",
    "esta",
    "estas",
    "este",
    "esto",
    "estos",
    "ha",
    "hasta",
    "la",
    "las",
    "le",
    "les",
    "lo",
    "los",
    "mas",
    "me",
    "mi",
    "mis",
    "mucho",
    "muy",
    "nada",
    "ni",
    "no",
    "nos",
    "o",
    "otra",
    "otro",
    "para",
    "pero",
    "por",
    "porque",
    "que",
    "se",
    "si",
    "sin",
    "sobre",
    "su",
    "sus",
    "tambien",
    "tan",
    "te",
    "tiene",
    "tu",
    "un",
    "una",
    "uno",
    "unos",
    "y",
    "ya",
]


def rank_documents(
    query: str,
    documents: Sequence[str],
    min_score: float = 1e-6,
) -> List[Tuple[int, float]]:
    """
    Ordena ``documents`` por relevancia semántica frente a ``query`` con TF-IDF.

    Se ajusta (fit) el vocabulario TF-IDF sobre el corpus de documentos y luego
    se proyecta la consulta en ese mismo espacio vectorial; la relevancia es la
    similitud coseno entre la consulta y cada documento (los vectores TF-IDF
    quedan normalizados L2, por lo que ``linear_kernel`` equivale al coseno).

    Args:
        query: término de búsqueda en lenguaje natural (ej. "dulce", "picante").
        documents: corpus, un string por producto (nombre + descripción + ...).
        min_score: umbral mínimo de similitud para considerar una coincidencia.

    Returns:
        Lista de tuplas ``(indice, score)`` ordenada por score descendente,
        incluyendo solo los documentos con score > ``min_score``. El índice
        corresponde a la posición del documento en ``documents``.
    """
    query = (query or "").strip()
    if not query or not documents:
        return []

    vectorizer = TfidfVectorizer(
        strip_accents="unicode",
        lowercase=True,
        stop_words=SPANISH_STOPWORDS,
    )

    try:
        doc_matrix = vectorizer.fit_transform(documents)
        query_vector = vectorizer.transform([query])
    except ValueError:
        # Vocabulario vacío (p. ej. documentos solo con stopwords): sin ranking.
        return []

    scores = linear_kernel(query_vector, doc_matrix).flatten()

    ranked = [
        (index, float(score)) for index, score in enumerate(scores) if score > min_score
    ]
    ranked.sort(key=lambda pair: pair[1], reverse=True)
    return ranked
