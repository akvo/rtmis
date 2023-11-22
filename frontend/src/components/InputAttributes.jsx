import { Row, Col, Form, Input, Select } from "antd";

const { Option } = Select;

const InputType = ({ field, name, options }) => {
  return options.length ? (
    <div className="form-row">
      <Form.Item
        name={[field.name, name]}
        label={name}
        rules={[{ required: true }]}
      >
        <Select
          getPopupContainer={(trigger) => trigger.parentNode}
          placeholder="Select level.."
          allowClear
        >
          {options?.map((opt) => (
            <Option key={opt.id} value={opt.id}>
              {opt.name}
            </Option>
          ))}
        </Select>
      </Form.Item>
    </div>
  ) : (
    <Row className="form-row">
      <Col span={24}>
        <Form.Item name={[field.name, name]} label={name}>
          <Input type="number" />
        </Form.Item>
      </Col>
    </Row>
  );
};

const InputAttributes = ({ attributes = [] }) => {
  return (
    <Form.List name="attributes">
      {(fields) => {
        return (
          <>
            {fields.map((field, index) => (
              <InputType {...attributes?.[index]} field={field} key={index} />
            ))}
          </>
        );
      }}
    </Form.List>
  );
};

export default InputAttributes;
