import { Row, Col, Form, Input, Select, Spin, Space } from "antd";

const { Option } = Select;

const InputType = ({ field, name, options, type }) => {
  return (
    <>
      {type === "value" && (
        <Row className="form-row">
          <Col span={24}>
            <Form.Item name={[field.name, name]} label={name}>
              <Input type="number" />
            </Form.Item>
          </Col>
        </Row>
      )}
      {type === "option" && (
        <div className="form-row">
          <Form.Item name={[field.name, name]} label={name}>
            <Select
              getPopupContainer={(trigger) => trigger.parentNode}
              placeholder={`Select ${name}...`}
              allowClear
            >
              {options?.map((opt, index) => (
                <Option key={index} value={opt}>
                  {opt}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>
      )}
      {type === "multiple_option" && (
        <div className="form-row">
          <Form.Item name={[field.name, name]} label={name}>
            <Select
              getPopupContainer={(trigger) => trigger.parentNode}
              placeholder={`Select ${name}...`}
              mode="multiple"
              allowClear
            >
              {options?.map((opt, index) => (
                <Option key={index} value={opt}>
                  {opt}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </div>
      )}
      {type === "aggregate" && (
        <Row className="form-row ant-form-item">
          <Col span={6} className="ant-form-item-label">
            <label>{name}</label>
          </Col>
          <Col span={18} className="ant-form-item-control">
            <Form.List name={[field.name, "aggregate"]}>
              {(items) => (
                <>
                  {items.map(({ key: aggKey, name: aggName }) => (
                    <Space key={aggKey} direction="horizontal">
                      {options.map((opt, opx) => {
                        return (
                          <Form.Item
                            name={[aggName, opt]}
                            key={`${aggKey}-${opx}`}
                          >
                            <Input addonBefore={opt} type="number" />
                          </Form.Item>
                        );
                      })}
                    </Space>
                  ))}
                </>
              )}
            </Form.List>
          </Col>
        </Row>
      )}
    </>
  );
};

const InputAttributes = ({ attributes = [], loading = false }) => {
  return (
    <Spin spinning={loading} tip="Loading...">
      <Form.List name="attributes">
        {(fields) => {
          return (
            <>
              {fields.map((field, index) => (
                <InputType field={field} key={index} {...attributes?.[index]} />
              ))}
            </>
          );
        }}
      </Form.List>
    </Spin>
  );
};

export default InputAttributes;
