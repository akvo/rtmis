import React, { useEffect, useState } from "react";
import "./style.scss";
import { Select, message } from "antd";
import PropTypes from "prop-types";

import { api, store } from "../../lib";

const FormDropdown = ({ loading: parentLoading = false, ...props }) => {
  const { forms, selectedForm } = store.useState((state) => state);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .get("forms/")
      .then((res) => {
        store.update((s) => {
          s.forms = res.data;
        });
        setLoading(false);
      })
      .catch((err) => {
        message.error("Could not load forms");
        setLoading(false);
        console.error(err);
      });
  }, []);

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

  if (forms) {
    return (
      <Select
        placeholder={`Select Form`}
        style={{ width: 160 }}
        onChange={(e) => {
          handleChange(e);
        }}
        value={selectedForm}
        disabled={loading || parentLoading}
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
