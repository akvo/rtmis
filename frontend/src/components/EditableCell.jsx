import React, { useEffect, useState } from "react";
import { Button, DatePicker, Input, Select, Row, Col } from "antd";
import { config } from "../lib";
import { isEqual } from "lodash";
const { Option } = Select;
import { UndoOutlined, SaveOutlined } from "@ant-design/icons";
import moment from "moment";
import PropTypes from "prop-types";

const EditableCell = ({
  record,
  parentId,
  updateCell,
  resetCell,
  pendingData,
  disabled = false,
  readonly = false,
  isPublic = false,
}) => {
  const [editing, setEditing] = useState(false);
  const [locationName, setLocationName] = useState(null);
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (
      record &&
      (record.newValue ||
        record.newValue === 0 ||
        record.value ||
        record.value === 0)
    ) {
      const newValue =
        record.newValue || record.newValue === 0
          ? record.newValue
          : record.value;
      setValue(
        record.type === "date"
          ? moment(newValue).format("YYYY-MM-DD")
          : newValue
      );
    }
  }, [record]);

  const notEditable =
    record.type === "cascade" || record.type === "geo" || readonly;
  const edited =
    record &&
    (record.newValue || record.newValue === 0) &&
    !isEqual(record.value, record.newValue);

  useEffect(() => {
    if (record && record.type === "cascade" && !record?.api && !locationName) {
      const locName = config.fn.administration(record.value, false);
      setLocationName(locName?.full_name);
    }
  }, [record, locationName]);

  const getAnswerValue = () => {
    return record.type === "multiple_option"
      ? value?.join(", ")
      : record.type === "option"
      ? value
        ? value[0]
        : "-"
      : value;
  };
  const renderAnswerInput = () => {
    return record.type === "option" ? (
      <Select
        style={{ width: "100%" }}
        value={value?.length ? value[0] : null}
        onChange={(e) => {
          setValue([e]);
        }}
        disabled={disabled}
      >
        {record.option.map((o) => (
          <Option key={o.id} value={o.name} title={o.name}>
            {o.name}
          </Option>
        ))}
      </Select>
    ) : record.type === "multiple_option" ? (
      <Select
        mode="multiple"
        style={{ width: "100%" }}
        value={value?.length ? value : null}
        onChange={(e) => {
          setValue(e);
        }}
        disabled={disabled}
      >
        {record.option.map((o) => (
          <Option key={o.id} value={o.name} title={o.name}>
            {o.name}
          </Option>
        ))}
      </Select>
    ) : record.type === "date" ? (
      <DatePicker
        size="small"
        value={moment(value)}
        format="YYYY-MM-DD"
        animation={false}
        onChange={(d, ds) => {
          if (d) {
            setValue(ds);
          }
        }}
        disabled={disabled}
      />
    ) : (
      <Input
        autoFocus
        type={record.type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
        }}
        onPressEnter={() => {
          updateCell(record.id, parentId, value);
          setEditing(false);
        }}
        disabled={disabled}
      />
    );
  };

  return editing ? (
    <Row direction="horizontal">
      <Col flex={1}>{renderAnswerInput()}</Col>
      <Button
        type="primary"
        onClick={() => {
          updateCell(record.id, parentId, value);
          setEditing(false);
        }}
        icon={<SaveOutlined />}
      >
        Save
      </Button>
    </Row>
  ) : (
    <Row>
      <Col
        flex={1}
        style={{
          cursor: !notEditable && !pendingData ? "pointer" : "not-allowed",
        }}
        onClick={() => {
          if (!notEditable && !pendingData && !isPublic) {
            setEditing(!editing);
          }
        }}
      >
        {record.type === "cascade" && !record?.api
          ? locationName
          : getAnswerValue()}
      </Col>
      {edited && (
        <Button
          onClick={() => {
            resetCell(record.id, parentId);
          }}
          icon={<UndoOutlined />}
        >
          Reset
        </Button>
      )}
    </Row>
  );
};

EditableCell.propTypes = {
  record: PropTypes.shape({
    id: PropTypes.number.isRequired,
    type: PropTypes.string.isRequired,
    value: PropTypes.any.isRequired,
    option: PropTypes.array,
    newValue: PropTypes.any,
  }),
  parentId: PropTypes.number.isRequired,
  updateCell: PropTypes.func.isRequired,
  resetCell: PropTypes.func.isRequired,
  pendingData: PropTypes.oneOfType([PropTypes.string, PropTypes.bool]),
  disabled: PropTypes.bool,
  readonly: PropTypes.bool,
};
export default React.memo(EditableCell);
