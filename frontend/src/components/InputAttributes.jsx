import { Row, Col, Form, Input, Select, Spin } from "antd";

const { Option } = Select;

const InputType = ({ field, name, options, mode }) => {
  return options.length ? (
    <div className="form-row">
      <Form.Item name={[field.name, name]} label={name}>
        <Select
          getPopupContainer={(trigger) => trigger.parentNode}
          placeholder={`Select ${name}...`}
          allowClear
          mode={mode}
        >
          {options?.map((opt, index) => (
            <Option key={index} value={opt}>
              {opt}
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

const InputAttributes = ({ attributes = [], loading = false, mode = null }) => {
  return (
    <Spin spinning={loading} tip="Loading...">
      <Form.List name="attributes">
        {(fields) => {
          return (
            <>
              {fields.map((field, index) => (
                <InputType
                  field={field}
                  key={index}
                  mode={mode}
                  {...attributes?.[index]}
                />
              ))}
            </>
          );
        }}
      </Form.List>
    </Spin>
  );
};

export default InputAttributes;
