"""
Utilidades compartidas para restricciones alimentarias — tests.
"""

from django.test import SimpleTestCase

from apps.catalog.allergies import matching_allergens, product_is_compatible


class AllergyHelperTests(SimpleTestCase):
    def test_matching_is_case_insensitive(self):
        matched = matching_allergens(["Mani", "gluten"], ["mani", "vegano"])
        self.assertEqual(matched, ["Mani"])

    def test_no_allergies_is_compatible(self):
        self.assertTrue(product_is_compatible([], ["mani"]))
        self.assertTrue(product_is_compatible(None, ["mani"]))

    def test_violation_detected(self):
        self.assertFalse(product_is_compatible(["lactosa"], ["Lactosa", "dulce"]))
