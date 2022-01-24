class DataApprovalStatus:
    pending = 1
    approved = 2
    rejected = 3

    FieldStr = {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
    }


class QuestionTypes:
    geo = 1
    administration = 2
    text = 3
    numeric = 4
    option = 5
    multiple_option = 6
    cascade = 7
    photo = 8
    date = 9

    FieldStr = {
        geo: 'Geo',
        administration: 'Administration',
        text: 'Text',
        numeric: 'Numeric',
        option: 'Option',
        multiple_option: 'Multiple Option',
        cascade: 'Cascade',
        photo: 'Photo',
        date: 'Date',
    }
