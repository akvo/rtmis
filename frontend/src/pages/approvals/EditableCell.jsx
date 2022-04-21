import React, { useEffect, useState } from "react";
import { Button, Input, Select, Row, Col } from "antd";
import { api } from "../../lib";
const { Option } = Select;
import { UndoOutlined, SaveOutlined } from "@ant-design/icons";

const EditableCell = ({ record, updateCell, resetCell }) => {
  const [editing, setEditing] = useState(false);
  const [locationName, setLocationName] = useState("-");
  const [value, setValue] = useState(null);

  useEffect(() => {
    if (record && (record.newValue || record.answer)) {
      setValue(record.newValue ? record.newValue : record.answer);
    }
  }, [record]);

  const notEditable = record.type === "cascade" || record.type === "geo";

  useEffect(() => {
    const getLocationName = () => {
      const fetchData = (id, acc) => {
        api.get(`administration/${id}`).then((res) => {
          acc.unshift(res.data.name);
          if (res.data.level > 0) {
            fetchData(res.data.parent, acc);
          } else {
            setLocationName(acc.join("|"));
          }
        });
      };
      fetchData(record.answer, []);
    };
    if (record && record.type === "cascade") {
      getLocationName();
    }
  }, [record]);
  const getAnswerValue = () => {
    const finalVal = record.newValue ? record.newValue : record.answer;
    return record.type === "multiple_option"
      ? finalVal.join(", ")
      : record.type === "option"
      ? finalVal
        ? finalVal[0]
        : "-"
      : finalVal;
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
    ) : (
      <Input
        type={record.type === "number" ? "number" : "text"}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
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
          updateCell(record.id, value);
          setEditing(!editing);
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
        {record.type === "cascade" ? locationName : getAnswerValue()}
      </Col>
      {record.edited && (
        <Button
          onClick={() => {
            resetCell(record.id);
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
