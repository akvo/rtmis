import React, { useEffect, useCallback, useMemo } from "react";
import "./style.scss";
import { Select } from "antd";
import PropTypes from "prop-types";

import { store } from "../../lib";

const FormDropdown = ({
  loading: parentLoading = false,
  title = false,
  hidden = false,
  submissionTypes = [],
  ...props
}) => {
  const { forms, selectedForm, loadingForm } = store.useState((state) => state);
  const filterForms = useMemo(() => {
    const form_items = title ? window.forms : forms;
    return form_items.filter(
      (f) =>
        !submissionTypes.length ||
        (submissionTypes.length &&
          f?.content?.submission_types?.length &&
          submissionTypes.filter((st) =>
            f.content.submission_types.includes(st)
          ).length)
    );
  }, [title, submissionTypes, forms]);

  const handleChange = useCallback((e) => {
    if (!e) {
      return;
    }
    store.update((s) => {
      s.loadingForm = true;
    });
    store.update((s) => {
      s.questionGroups = window.forms.find(
        (f) => f.id === e
      ).content.question_group;
      s.selectedForm = e;
      s.loadingForm = false;
      s.advancedFilters = [];
      s.showAdvancedFilters = false;
    });
  }, []);
  useEffect(() => {
    if (
      (!!filterForms?.length && !selectedForm) ||
      !filterForms.map((f) => f?.id).includes(selectedForm)
    ) {
      handleChange(filterForms[0].id);
    }
  }, [filterForms, selectedForm, handleChange]);
  if (filterForms && !hidden) {
    return (
      <Select
        placeholder={`Select Form`}
        style={{ width: title ? "100%" : 160 }}
        onChange={(e) => {
          handleChange(e);
        }}
        value={selectedForm || null}
        className={`form-dropdown ${title ? " form-dropdown-title" : ""}`}
        disabled={parentLoading || loadingForm}
        getPopupContainer={(trigger) => trigger.parentNode}
        {...props}
      >
        {filterForms.map((optionValue, optionIdx) => (
          <Select.Option key={optionIdx} value={optionValue.id}>
            {optionValue.name}
          </Select.Option>
        ))}
      </Select>
    );
  }

  return "";
};

FormDropdown.propTypes = {
  loading: PropTypes.bool,
  title: PropTypes.bool,
  hidden: PropTypes.bool,
};

export default React.memo(FormDropdown);
