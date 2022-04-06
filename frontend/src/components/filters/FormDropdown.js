import React, { useEffect, useCallback } from "react";
import "./style.scss";
import { Select } from "antd";
import PropTypes from "prop-types";

import { api, store } from "../../lib";
import { useNotification } from "../../util/hooks";

const FormDropdown = ({ loading: parentLoading = false, ...props }) => {
  const { forms, selectedForm, loadingForm } = store.useState((state) => state);
  const { notify } = useNotification();

  const handleChange = useCallback(
    (e) => {
      if (!e) {
        return;
      }
      store.update((s) => {
        s.loadingForm = true;
      });
      api
        .get(`/form/${e}`)
        .then((res) => {
          store.update((s) => {
            s.questionGroups = res.data.question_group;
            s.selectedForm = e;
          });
          store.update((s) => {
            s.loadingForm = false;
          });
        })
        .catch(() => {
          notify({
            type: "error",
            message: "Could not load form data",
          });
          store.update((s) => {
            s.loadingForm = false;
          });
        });
    },
    [notify]
  );

  useEffect(() => {
    if (!!forms?.length && !selectedForm) {
      handleChange(forms[0].id);
    }
  }, [forms, selectedForm, handleChange]);

  if (forms) {
    return (
      <Select
        placeholder={`Select Form`}
        style={{ width: 160 }}
        onChange={(e) => {
          handleChange(e);
        }}
        value={selectedForm}
        disabled={parentLoading || loadingForm}
        getPopupContainer={(trigger) => trigger.parentNode}
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
