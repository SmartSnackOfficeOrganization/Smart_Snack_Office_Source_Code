"""
Pruebas unitarias del motor Item-Based CF (sin Django ORM).

    python manage.py test apps.ai_engine.tests_item_cf_engine
"""

import sys
from pathlib import Path

from django.test import SimpleTestCase

_REPO_ROOT = Path(__file__).resolve().parents[3]
if str(_REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(_REPO_ROOT))

from ml.recommend.item_cf_engine import (
    accumulate_interactions,  # noqa: E402
    best_seed_item,
    compute_item_similarity,
    recommend_for_user,
)


class ItemCFEngineTests(SimpleTestCase):
    def test_accumulate_takes_max_weight(self):
        matrix = accumulate_interactions(
            [
                ("u1", "p1", 2.0),
                ("u1", "p1", 5.0),
                ("u1", "p2", 1.0),
            ]
        )
        self.assertEqual(matrix["u1"]["p1"], 5.0)
        self.assertEqual(matrix["u1"]["p2"], 1.0)

    def test_item_similarity_and_recommendations(self):
        interactions = {
            "u1": {"p1": 1.0, "p2": 1.0},
            "u2": {"p1": 1.0, "p2": 1.0},
            "u3": {"p1": 1.0, "p3": 1.0},
            "u4": {"p2": 1.0, "p4": 1.0},
        }
        similarity = compute_item_similarity(interactions)
        self.assertIn("p2", similarity["p1"])
        self.assertGreater(similarity["p1"]["p2"], 0)

        ranked = recommend_for_user(
            {"p1": 1.0},
            similarity,
            exclude={"p1"},
            top_n=3,
        )
        self.assertTrue(ranked)
        top_ids = [item_id for item_id, _ in ranked]
        self.assertIn("p2", top_ids)

    def test_best_seed_item_picks_strongest_contributor(self):
        interactions = {
            "u1": {"p1": 1.0, "p2": 1.0},
            "u2": {"p1": 1.0, "p2": 1.0},
            "u3": {"p1": 1.0, "p3": 1.0},
        }
        similarity = compute_item_similarity(interactions)
        seed = best_seed_item("p2", {"p1": 1.0}, similarity)
        self.assertEqual(seed, "p1")

    def test_empty_interactions_yield_empty_similarity(self):
        self.assertEqual(compute_item_similarity({}), {})
        self.assertEqual(recommend_for_user({}, {}), [])
        self.assertIsNone(best_seed_item("p1", {}, {}))
