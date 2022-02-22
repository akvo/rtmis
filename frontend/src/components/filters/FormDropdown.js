import React, { useEffect } from "react";
import "./style.scss";
import { Select, message } from "antd";
import PropTypes from "prop-types";

import { api, store } from "../../lib";

const FormDropdown = ({ loading: parentLoading = false, ...props }) => {
  const { forms, selectedForm } = store.useState((state) => state);

  const handleChange = (e) => {
    if (!e) {
      return;
    }
    api
      .get(`/form/${e}/`)
      .then((res) => {
        store.update((s) => {
          s.questionGroups = res.data.question_group;
          s.selectedForm = e;
        });
      })
      .catch(() => {
        message.error("Could not load form data");
      });
  };

  useEffect(() => {
    if (forms.length && !selectedForm) {
      handleChange(forms[0].id);
    }
  }, [forms, selectedForm]);

  if (forms) {
    return (
      <Select
        placeholder={`Select Form`}
        style={{ width: 160 }}
        onChange={(e) => {
          handleChange(e);
        }}
        value={selectedForm}
        disabled={parentLoading}
        {...props}
      >
        {forms.map((optionValue, optionIdx) => (
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
};

export default React.memo(FormDropdown);
