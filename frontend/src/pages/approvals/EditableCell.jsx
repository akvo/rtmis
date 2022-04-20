import React, { useState } from "react";
import { Button, Input, Select, Space } from "antd";

const EditableCell = ({ record, updateCell }) => {
  const [editing, setEditing] = useState(false);

  const notEditable = record.type === "cascade" || record.type === "geo";
  const getAnswerValue = (answer) => {
    return answer.type === "multiple_option"
      ? answer.join(",")
      : answer.type === "option"
      ? answer[0]
      : answer;
  };
  const renderAnswerInput = (answer) => {
    return answer.type === "option" ? (
      <Select />
    ) : answer.type === "option" ? (
      <Select mode="multiple" />
    ) : (
      <Input type="text" />
    );
  };
  const renderAnswerText = (answer) => {
    return <div>{getAnswerValue(answer)}</div>;
  };

  const handleSave = () => {
    updateCell(record);
  };

  return editing ? (
    <Space direction="horizontal">
      {renderAnswerInput(record.answer)}
      <Button type="primary" onClick={handleSave}>
        Save
      </Button>
      <Button
        onClick={() => {
          setEditing(!editing);
        }}
      >
        Cancel
      </Button>
    </Space>
  ) : (
    <div
      onClick={() => {
        if (!notEditable) {
          setEditing(!editing);
        }
      }}
    >
      {renderAnswerText(record.answer)}
    </div>
  );
};

export default EditableCell;
