class QuestionTypes:
    geo = 1
    administration = 2
    text = 3
    number = 4
    option = 5
    multiple_option = 6
    cascade = 7
    photo = 8
    date = 9
    autofield = 10

    FieldStr = {
        geo: 'Geo',
        administration: 'Administration',
        text: 'Text',
        number: 'Number',
        option: 'Option',
        multiple_option: 'Multiple_Option',
        cascade: 'Cascade',
        photo: 'Photo',
        date: 'Date',
        autofield: 'Autofield',
    }


class FormTypes:
    county = 1
    national = 2

    FieldStr = {
        county: 'County',
        national: 'National',
    }


class AttributeTypes:
    chart = 1
    aggregate = 2
    table = 3
    jmp = 4
    advanced_filter = 5

    FieldStr = {
        chart: 'chart',
        aggregate: 'aggregate',
        table: 'table',
        jmp: 'jmp',
        advanced_filter: 'advanced_filter',
    }
