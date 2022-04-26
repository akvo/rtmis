import React, { useEffect, useState } from "react";
import { Button, DatePicker, Input, Select, Row, Col, Spin } from "antd";
import { api } from "../lib";
import { isEqual } from "lodash";
const { Option } = Select;
import { UndoOutlined, SaveOutlined, LoadingOutlined } from "@ant-design/icons";
import moment from "moment";

const EditableCell = ({ record, parentId, updateCell, resetCell }) => {
  const [editing, setEditing] = useState(false);
  const [locationName, setLocationName] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (record && (record.newValue || record.value)) {
      const newValue = record.newValue ? record.newValue : record.value;
      setValue(
        record.type === "date"
          ? moment(newValue).format("YYYY-MM-DD")
          : newValue
      );
    }
  }, [record]);

  const notEditable = record.type === "cascade" || record.type === "geo";
  const edited =
    record && record.newValue && !isEqual(record.value, record.newValue);

  useEffect(() => {
    const getLocationName = () => {
      const fetchData = (id, acc) => {
        api.get(`administration/${id}`).then((res) => {
          acc.unshift(res.data.name);
          if (res.data.level > 0) {
            fetchData(res.data.parent, acc);
          } else {
            setLocationName(acc.join(" | "));
            setLocationLoading(false);
          }
        });
      };
      setLocationLoading(true);
      fetchData(record.value, []);
    };
    if (record && record.type === "cascade" && !locationName) {
      getLocationName();
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
        onClick={() => {
          if (!notEditable) {
            setEditing(!editing);
          }
        }}
      >
        {record.type === "cascade" ? (
          locationLoading ? (
            <Spin
              indicator={<LoadingOutlined style={{ color: "#1b91ff" }} spin />}
            />
          ) : locationName ? (
            locationName
          ) : (
            "-"
          )
        ) : (
          getAnswerValue()
        )}
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

export default React.memo(EditableCell);
