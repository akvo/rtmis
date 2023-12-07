import React, { useEffect, useState } from "react";
import { Button, Card, Col, Divider, Form, Input, Row, Select } from "antd";
import {
  AdministrationDropdown,
  Breadcrumbs,
  InputAttributes,
  DescriptionPanel,
} from "../../components";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import fakeSchoolAttrs from "../../placeholders/attributes-school.json";
import fakeHcfAttributes from "../../placeholders/attributes-hcf.json";
import { store } from "../../lib";
import "./style.scss";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Entities",
    link: "/master-data",
  },
  {
    title: "Add Entity",
  },
];

const fakeAttributes = {
  1: fakeSchoolAttrs,
  2: fakeHcfAttributes,
};

const { Option } = Select;

const AddEntity = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attributes, setAttributes] = useState(true);
  const [entities, setEntities] = useState();

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();

  const administration = store.useState((s) => s.administration);

  const selectedAdministration =
    administration.length > 0
      ? administration[administration.length - 1]
      : null;

  const onFinish = async (values) => {
    setSubmitting(true);

    const attributesPayload = values.attributes.map((attr, ax) => {
      const attrName = attributes?.[ax]?.name;
      const fieldValue = attr?.[attrName];
      // TODO
      return {
        administration_id: 1,
        administration_attribute_id: attributes?.[ax]?.id,
        attribute: attrName,
        value: fieldValue,
        options: attributes?.[ax]?.options ? [fieldValue] : [],
      };
    });
    const payload = {
      ...values,
      administration_id: selectedAdministration?.id || null,
      attributes: attributesPayload,
    };
    store.update((s) => {
      const _md = {
        ...s.masterData,
        entity: { ...payload, id: 2011 },
      };
      s.masterData = _md;
    });
    await new Promise((r) => setTimeout(r, 2000));
    notify({
      type: "success",
      message: `Entity added`,
    });
    setSubmitting(false);
    navigate("/master-data/entities");
  };

  const fetchAttributes = async (entityType = 1) => {
    await new Promise((r) => setTimeout(r, 2000));
    const _attributes = fakeAttributes?.[entityType];
    const attrFields = _attributes.map((attr) => {
      return {
        [attr.name]: attr.options.length ? [] : "",
      };
    });
    setAttributes(_attributes);
    form.setFieldsValue({ attributes: attrFields });
    setLoading(false);
  };

  const handleOnSelect = (value) => {
    setLoading(true);
    fetchAttributes(value);
  };

  useEffect(() => {
    // TODO
    setEntities([
      {
        id: 1,
        name: "School",
      },
      {
        id: 2,
        name: "Health Facility",
      },
    ]);
  }, []);

  return (
    <div id="add-entity">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel title={"Add Entity"} />
        </Col>
      </Row>
      <Divider />
      <Form
        name="entity-form"
        form={form}
        layout="vertical"
        initialValues={{
          entity_id: "",
          administration_id: null,
          name: "",
          attributes: [],
        }}
        onFinish={onFinish}
      >
        <Card bodyStyle={{ padding: 0 }}>
          <AdministrationDropdown
            direction="vertical"
            withLabel={true}
            persist={true}
            size="large"
            width="100%"
          />
          <div className="form-row">
            <Form.Item
              name="entity_id"
              label="Entity Type"
              rules={[{ required: true }]}
            >
              <Select
                getPopupContainer={(trigger) => trigger.parentNode}
                placeholder="Select type.."
                onChange={handleOnSelect}
                allowClear
              >
                {entities?.map((e) => (
                  <Option key={e.id} value={e.id}>
                    {e.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <Row className="form-row">
            <Col span={24}>
              <Form.Item
                name="name"
                label="Entity Name"
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
          <InputAttributes attributes={attributes} loading={loading} />
        </Card>
        <Row justify="end" align="middle">
          <Col>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Add entity
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddEntity;
