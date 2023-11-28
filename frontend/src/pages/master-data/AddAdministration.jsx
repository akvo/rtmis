import React, { useCallback, useEffect, useState } from "react";
import { Button, Card, Col, Divider, Form, Input, Row, Select } from "antd";
import {
  AdministrationDropdown,
  Breadcrumbs,
  InputAttributes,
} from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import { api, store } from "../../lib";
import "./style.scss";

const admLevels = [
  {
    id: 1,
    level: 0,
    name: "National",
  },
  {
    id: 2,
    level: 1,
    name: "County",
  },
  {
    id: 3,
    level: 2,
    name: "Sub-County",
  },
];

const { Option } = Select;

const AddAdministration = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attributes, setAttributes] = useState(true);
  const [level, setLevel] = useState(1);
  const [preload, setPreload] = useState(true);
  const selectedAdm = store.useState((s) => s.administration);
  const initialValues = store.useState((s) => s.masterData.administration);

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const { id } = useParams();

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const parent = selectedAdm?.slice(-1)?.[0];
      const payload = {
        code: values.code,
        name: values.name,
        parent: parent?.id || values.parent,
        attributes: values.attributes.map((attr) => {
          const { id: attrId, aggregate, ...fieldValue } = attr;
          const attributeValue = aggregate?.[0]
            ? aggregate?.[0]
            : Object.values(fieldValue)?.[0] || "";
          return {
            attribute: attrId,
            value: attributeValue,
          };
        }),
      };
      if (id) {
        await api.put(`/administrations/${id}`, payload);
        notify({
          type: "success",
          message: `Administration updated`,
        });
      } else {
        await api.post("/administrations", payload);
        notify({
          type: "success",
          message: `Administration added`,
        });
      }
      store.update((s) => {
        s.masterData.administration = {};
      });
      setSubmitting(false);
      navigate("/master-data");
    } catch {
      setSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (id && preload && !initialValues?.id) {
      setPreload(false);
      const { data: apiData } = await api.get(`/administrations/${id}`);
      store.update((s) => {
        s.masterData.administration = apiData;
      });
    }
    if ((!id || initialValues?.id) && preload) {
      setPreload(false);
    }
  }, [id, preload, initialValues]);

  const fetchAttributes = useCallback(async () => {
    if (id && !initialValues?.id) {
      return;
    }
    try {
      const { data: _attributes } = await api.get("/administration-attributes");
      const attrFields = _attributes.map((attr) => {
        const findValue = initialValues?.attributes?.find(
          (a) => a?.attribute === attr?.id
        );
        if (attr.type === "aggregate") {
          const initAggregation = attr?.options?.reduce((acc, currentValue) => {
            acc[currentValue] = findValue?.value?.[currentValue] || null;
            return acc;
          }, {});
          return {
            id: attr?.id,
            aggregate: [initAggregation],
          };
        }
        const defaultValue = attr.type === "value" ? "" : [];
        return {
          id: attr?.id,
          [attr.name]: findValue?.value || defaultValue,
        };
      });
      setAttributes(_attributes);
      form.setFieldsValue({ ...initialValues, attributes: attrFields });
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [form, id, initialValues]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title: "Manage Administrative List",
      link: "/master-data",
    },
    {
      title: id ? "Edit Administration" : "Add Administration",
    },
  ];

  return (
    <div id="add-administration">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          {/* <DescriptionPanel description={descriptionData} /> */}
        </Col>
      </Row>
      <Divider />
      <Form name="adm-form" form={form} layout="vertical" onFinish={onFinish}>
        <Card bodyStyle={{ padding: 0 }}>
          <Row gutter={16}>
            <Col span={6}>
              <div className="form-row">
                <Form.Item name="level_id" label="Administration Level">
                  <Select
                    getPopupContainer={(trigger) => trigger.parentNode}
                    placeholder="Select level.."
                    value={level}
                    onChange={(val) => {
                      setLevel(val);
                      store.update((s) => {
                        s.masterData.administration = {
                          ...s.masterData.administration,
                          parent: null,
                        };
                      });
                    }}
                    allowClear
                  >
                    {admLevels?.map((adm) => (
                      <Option key={adm.id} value={adm.id}>
                        {adm.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
            </Col>
            <Col span={18}>
              <Form.Item name="parent" label="Administration Parent">
                {initialValues?.parent?.name ? (
                  <Input
                    type="text"
                    value={initialValues.parent.name}
                    readOnly
                  />
                ) : (
                  <>
                    {level === 1 ? (
                      <Select placeholder="Select parent.." allowClear>
                        {selectedAdm?.map((adm) => (
                          <Option key={adm.id} value={adm.id}>
                            {adm.name}
                          </Option>
                        ))}
                      </Select>
                    ) : (
                      <AdministrationDropdown
                        size="large"
                        width="100%"
                        maxLevel={level}
                      />
                    )}
                  </>
                )}

                <Input type="hidden" />
              </Form.Item>
            </Col>
          </Row>
          <Row className="form-row">
            <Col span={24}>
              <Form.Item
                name="code"
                label="Administration Code"
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
              <Form.Item
                name="name"
                label="Administration Name"
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
        <Row align="middle">
          <Col>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Save administration
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddAdministration;
