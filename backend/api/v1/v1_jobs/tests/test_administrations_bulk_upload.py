from io import BytesIO
import unittest
from django.core.management import call_command
from django.test import TestCase
import pandas as pd
from api.v1.v1_jobs.administrations_bulk_upload import seed_administration_data

from api.v1.v1_profile.models import Administration, AdministrationAttribute
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin
from utils.administration_upload_template import generate_template


def generate_inmemory_template(attributes=[]) -> pd.DataFrame:
    iofile = BytesIO()
    generate_template(iofile, attributes)
    return pd.read_excel(iofile, sheet_name='data')


def write_inmemory_excel_file(df: pd.DataFrame) -> BytesIO:
    iofile = BytesIO()
    writer = pd.ExcelWriter(iofile, engine='xlsxwriter')
    df.to_excel(writer, sheet_name='data', index=False)
    writer.save()
    return iofile


class SeedDataTestCase(TestCase, ProfileTestHelperMixin):
    def setUp(self):
        super().setUp()
        call_command("administration_seeder", "--test")
        self.reset_db_sequence(Administration)
        self.attribute_ids = []
        self.value_att = AdministrationAttribute.objects.create(
                name='value attribute')
        self.option_att = AdministrationAttribute.objects.create(
                name='option attribute',
                type=AdministrationAttribute.Type.OPTION,
                options=['opt #1', 'opt #2'])
        self.multiple_option_att = AdministrationAttribute.objects.create(
                name='multiple option attribute',
                type=AdministrationAttribute.Type.MULTIPLE_OPTION,
                options=['opt #1', 'opt #2'])
        self.aggregate_att = AdministrationAttribute.objects.create(
                name='aggregate attribute',
                type=AdministrationAttribute.Type.AGGREGATE,
                options=['opt #1', 'opt #2'])

    def test_seed_data(self):
        df = generate_inmemory_template([
            self.value_att.id,
            self.option_att.id])
        df.loc[len(df)] = [
                'Indonesia',
                'Jakarta',
                'South Jakarta',
                'Pasar Minggu',
                'Lenteng Agung',
                'y',
                'opt #1'
                ]
        df.loc[len(df)] = [
                'Indonesia',
                'Jakarta',
                'South Jakarta',
                'Pasar Minggu',
                'Jagakarsa',
                '',
                'opt #2'
                ]
        upload_file = write_inmemory_excel_file(df)
        seed_administration_data(upload_file)
        self.assertTrue(
                Administration.objects.filter(name='South Jakarta').exists())
        self.assertTrue(
                Administration.objects.filter(name='Pasar Minggu').exists())
        self.assertTrue(
                Administration.objects.filter(name='Lenteng Agung').exists())
        self.assertTrue(
                Administration.objects.filter(name='Jagakarsa').exists())
        adm1 = Administration.objects.get(name='Lenteng Agung')
        adm2 = Administration.objects.get(name='Jagakarsa')
        self.assertEqual(2, adm1.attributes.count())
        self.assertEqual(1, adm2.attributes.count())

    def test_seed_attribute_type_variant(self):
        df = generate_inmemory_template([
            self.value_att.id,
            self.option_att.id,
            self.multiple_option_att.id,
            self.aggregate_att.id])
        df.loc[len(df)] = [
                'Indonesia',
                'Jakarta',
                'South Jakarta',
                'Pasar Minggu',
                'Lenteng Agung',
                '1',
                'opt #1',
                'opt #1 | opt #2',
                'opt #1 = 1 | opt #2 = 2',
                ]
        upload_file = write_inmemory_excel_file(df)
        seed_administration_data(upload_file)

        adm1 = Administration.objects.get(name='Lenteng Agung')
        self.assertEqual(4, adm1.attributes.count())

        value_att = adm1.attributes.get(attribute=self.value_att)
        self.assertEqual('1', value_att.value.get('value'))

        option_att = adm1.attributes.get(attribute=self.option_att)
        self.assertEqual('opt #1', option_att.value.get('value'))

        multiple_option_att = adm1.attributes.get(
                attribute=self.multiple_option_att)
        self.assertEqual(
                ['opt #1', 'opt #2'],
                multiple_option_att.value.get('value'))

        aggregate_att = adm1.attributes.get(attribute=self.aggregate_att)
        self.assertEqual(
                {'opt #1': '1', 'opt #2': '2'},
                aggregate_att.value.get('value'))


class ValidateBulkUploadTestCase(TestCase):
    @unittest.skip('TODO')
    def test_invalid_sheet_names(self):
        self.fail()
