from io import BytesIO
from django.core.management import call_command
from django.test import TestCase
import pandas as pd
from api.v1.v1_jobs.administrations_bulk_upload import (
        seed_administration_data, validate_administrations_bulk_upload)
from api.v1.v1_jobs.functions import ValidationText
from api.v1.v1_jobs.validate_upload import ExcelError

from api.v1.v1_profile.models import (
        Administration, AdministrationAttribute, Levels)
from api.v1.v1_profile.tests.mixins import ProfileTestHelperMixin
from utils.upload_administration import generate_template


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


def write_template_with_columns(columns) -> BytesIO:
    iofile = BytesIO()
    writer = pd.ExcelWriter(iofile, engine='xlsxwriter')
    df = pd.DataFrame(columns=columns, index=[0])
    df.to_excel(
            writer,
            sheet_name='data',
            startrow=1,
            header=False,
            index=False)
    workbook = writer.book
    worksheet = writer.sheets['data']
    header_format = workbook.add_format({
        'bold': True,
        'text_wrap': True,
        'valign': 'top',
        'border': 1
    })
    for col_num, value in enumerate(df.columns.values):
        worksheet.write(0, col_num, value, header_format)
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
                '1',
                '2',
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

    def test_set_attributes_on_upper_level(self):
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
                '',
                '',
                'y',
                ''
                ]
        upload_file = write_inmemory_excel_file(df)
        seed_administration_data(upload_file)

        level5 = Administration.objects.get(name='Lenteng Agung')
        self.assertEqual(2, level5.attributes.count())

        level3 = Administration.objects.get(name='South Jakarta')
        self.assertEqual(1, level3.attributes.count())


class ValidateBulkUploadTestCase(TestCase, ProfileTestHelperMixin):
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
        self.level_count = Levels.objects.count()

    def test_invalid_sheet_names(self):
        data = pd.DataFrame(columns=['test'], index=[0])
        iofile = BytesIO()
        writer = pd.ExcelWriter(iofile, engine='xlsxwriter')
        data.to_excel(writer, sheet_name='test')
        writer.save()
        result = validate_administrations_bulk_upload(iofile)
        self.assertEqual(1, len(result))
        self.assertEqual(ExcelError.sheet, result[0]['error'])
        self.assertEqual(
                ValidationText.template_validation.value,
                result[0]['error_message'])

    def test_empty_sheet(self):
        iofile = BytesIO()
        generate_template(iofile)
        result = validate_administrations_bulk_upload(iofile)
        self.assertEqual(1, len(result))
        self.assertEqual(ExcelError.sheet, result[0]['error'])
        self.assertEqual(
                ValidationText.file_empty_validation.value,
                result[0]['error_message'])

    def test_missing_level_header(self):
        headers = [
                f'{lvl.id}|{lvl.name}' for lvl
                in Levels.objects.order_by('level').all()[:self.level_count-2]]
        headers.append('Invalid')
        template_file = write_template_with_columns(headers)
        df = pd.read_excel(template_file, sheet_name='data')
        df.loc[len(df)] = range(len(headers))  # dummy data
        upload_file = write_inmemory_excel_file(df)

        result = validate_administrations_bulk_upload(upload_file)

        self.assertEqual(2, len(result))
        self.assertEqual(result[0], {
            'error': ExcelError.header,
            'error_message': ValidationText.header_invalid_level.value,
            'cell': 'D1'
        })
        self.assertEqual(result[1], {
            'error': ExcelError.header,
            'error_message': ValidationText.header_name_missing.value,
            'cell': 'E1'
        })

    def test_invalid_level_header(self):
        level_headers = [
                f'{lvl.id}|{lvl.name}' for lvl
                in Levels.objects.order_by('level').all()[:self.level_count-1]]
        attribute_headers = [
                f'{att.id}|{att.name}' for att
                in AdministrationAttribute.objects.all()[:2]]
        headers = level_headers + attribute_headers
        template_file = write_template_with_columns(headers)
        df = pd.read_excel(template_file, sheet_name='data')
        df.loc[len(df)] = range(len(headers))  # dummy data
        upload_file = write_inmemory_excel_file(df)

        result = validate_administrations_bulk_upload(upload_file)

        self.assertEqual(1, len(result))
        self.assertEqual(result[0], {
            'error': ExcelError.header,
            'error_message': ValidationText.header_invalid_level.value,
            'cell': 'E1'
        })

    def test_invalid_attribute_header(self):
        level_headers = [
                f'{lvl.id}|{lvl.name}' for lvl
                in Levels.objects.order_by('level').all()]
        attribute_headers = [
                f'{att.id}|{att.name}' for att
                in AdministrationAttribute.objects.all()[:2]]
        attribute_headers.append(
            f'{self.aggregate_att.id}|{self.aggregate_att.name}')
        attribute_headers.append(
            f'{self.aggregate_att.id}|{self.aggregate_att.name}|no_opt')
        attribute_headers.append('9999|Invalid attribute')
        attribute_headers.append('NO_ID')
        headers = level_headers + attribute_headers
        template_file = write_template_with_columns(headers)
        df = pd.read_excel(template_file, sheet_name='data')
        df.loc[len(df)] = range(len(headers))  # dummy data
        upload_file = write_inmemory_excel_file(df)

        result = validate_administrations_bulk_upload(upload_file)

        self.assertEqual(4, len(result))
        self.assertEqual(result[0], {
            'error': ExcelError.header,
            'error_message': ValidationText.header_invalid_attribute.value,
            'cell': 'H1'
        })
        self.assertEqual(result[1], {
            'error': ExcelError.header,
            'error_message': ValidationText.header_invalid_attribute.value,
            'cell': 'I1'
        })
        self.assertEqual(result[2], {
            'error': ExcelError.header,
            'error_message': ValidationText.header_invalid_attribute.value,
            'cell': 'J1'
        })
        self.assertEqual(result[3], {
            'error': ExcelError.header,
            'error_message': ValidationText.header_invalid_attribute.value,
            'cell': 'K1'
        })

    def test_invalid_attribute_values(self):
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
                'invalid',
                'opt #1 | invalid',
                '1',
                '2',
                ]
        upload_file = write_inmemory_excel_file(df)

        result = validate_administrations_bulk_upload(upload_file)

        self.assertEqual(2, len(result))
        self.assertEqual(result[0], {
            'error': ExcelError.value,
            'error_message':
                ValidationText.invalid_attribute_options.value.format(
                    'invalid', str(self.option_att.options)
                ),
            'cell': 'G2'
        })
        self.assertEqual(result[1], {
            'error': ExcelError.value,
            'error_message':
                ValidationText.invalid_attribute_options.value.format(
                    'invalid', str(self.multiple_option_att.options)
                ),
            'cell': 'H2'
        })
