import React, { useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Select,
  Space,
} from "antd";
import { Breadcrumbs } from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import { api } from "../../lib";
import { MinusCircleOutlined } from "@ant-design/icons";
import "./style.scss";

const attributeTypes = [
  {
    id: 1,
    name: "administration",
    api: "/administration-attributes",
  },
  {
    id: 2,
    name: "entity",
    api: null,
  },
];

const { Option } = Select;

const AddAttribute = () => {
  const [submitting, setSubmitting] = useState(false);
  const [attrType, setAttrType] = useState(null);

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const { id } = useParams();

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title: "Manage Attributes",
      link: "/master-data/attributes",
    },
    {
      title: id ? "Edit Attribute" : "Add Attribute",
    },
  ];

  const handleOnSelectType = (val) => {
    const findType = attributeTypes.find((atype) => atype.id === val);
    setAttrType(findType);
  };

  const onFinish = async (values) => {
    if (!attrType?.api) {
      return;
    }
    try {
      setSubmitting(true);
      const apiURL = id ? `${attrType.api}/${id}` : attrType.api;
      await api.post(apiURL, {
        name: values.name,
        options: values.options.map((o) => o.name),
      });
      notify({
        type: "success",
        message: `Attribute ${id ? "updated" : "added"}`,
      });
      setSubmitting(false);
      navigate("/master-data/attributes");
    } catch {
      setSubmitting(false);
    }
  };

  return (
    <div id="add-attribute">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          {/* <DescriptionPanel description={descriptionData} /> */}
        </Col>
      </Row>
      <Divider />
      <Form
        name="adm-form"
        form={form}
        layout="vertical"
        initialValues={{
          attribute_type: "",
          name: "",
          options: [],
        }}
        onFinish={onFinish}
      >
        <Card bodyStyle={{ padding: 0 }}>
          <div className="form-row">
            <Form.Item
              name="attribute_type"
              label="Attribute Type"
              rules={[{ required: true }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder="Select type..."
                onSelect={handleOnSelectType}
                allowClear
              >
                {attributeTypes?.map((at) => (
                  <Option key={at.id} value={at.id}>
                    {at.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Row className="form-row">
            <Col span={24}>
              <Form.Item
                name="name"
                label="Attribute Name"
                rules={[
                  {
                    required: true,
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <Row className="form-row">
            <Col span={24}>
              <Form.Item label="Options">
                <Form.List name="options">
                  {(fields, { add, remove }) => (
                    <div>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key}>
                          <Form.Item name={[name, "name"]} {...restField}>
                            <Input />
                          </Form.Item>
                          <Button
                            icon={<MinusCircleOutlined />}
                            onClick={() => remove(name)}
                          >
                            Remove
                          </Button>
                        </Space>
                      ))}
                      <Button onClick={() => add()}>Add option</Button>
                    </div>
                  )}
                </Form.List>
              </Form.Item>
            </Col>
          </Row>
        </Card>
        <Row justify="end" align="middle">
          <Col>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Add attribute
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddAttribute;
