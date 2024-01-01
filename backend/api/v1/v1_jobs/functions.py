import enum
import re


def tr(obj):
    return " ".join(filter(lambda x: len(x), obj.strip().split(" ")))


def contain_numbers(input_string):
    return bool(re.search(r'\d', input_string))


class HText(str):
    def __init__(self, string):
        super().__init__()
        self.obj = [string] if "|" not in string else string.split("|")
        self.clean = "|".join([tr(o) for o in self.obj])
        self.hasnum = contain_numbers(string)


class ValidationText(enum.Enum):
    header_name_missing = "Header name is missing"
    header_no_question_id = "doesn't have question id"
    header_invalid_id = "has invalid id"
    header_invalid_level = "has invalid administration level header"
    header_invalid_attribute = "has invalid administration attribute header"
    numeric_validation = "Value should be numeric"
    numeric_max_rule = "Maximum value for --question-- is --rule--"
    numeric_min_rule = "Minimum value for --question-- is --rule--"
    lat_long_validation = "Invalid lat long format"
    administration_validation = "Wrong administration format"
    administration_not_valid = "Wrong administration data for"
    administration_not_part_of = "--answer-- is not part of --administration--"
    template_validation = "Wrong sheet names or invalid file upload template"
    file_empty_validation = "You have uploaded an empty sheet"
    is_required = "is required"
    should_be_empty = "should be empty"
    start_validation = "DATA VALIDATION STARTED"
    successfully_validation = "IS SUCCESSFULLY VALIDATED"
    error_validation = "VALIDATION ERROR"
    invalid_data_id = "--data_id-- is not a valid data id"
    duplicated_data_id = "--data_id-- is a duplicate data id"
    invalid_attribute_options = (
            "invalid attribute options: {}, available options: {}")
