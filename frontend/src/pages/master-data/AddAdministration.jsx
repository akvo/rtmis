import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
} from "antd";
import { Breadcrumbs, InputAttributes } from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import { api, store } from "../../lib";
import "./style.scss";

const { Option } = Select;

const AddAdministration = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attributes, setAttributes] = useState(true);
  const [level, setLevel] = useState(null);
  const [preload, setPreload] = useState(true);
  const admLevels = store.useState((s) => s.levels);
  const initialValues = store.useState((s) => s.masterData.administration);

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const { id } = useParams();

  const deleteAdministration = async (row) => {
    try {
      await api.delete(`/administrations/${row.id}`);
      notify({
        type: "success",
        message: `Administration deleted`,
      });
      navigate("/master-data");
    } catch {
      Modal.error({
        title: "Unable to delete the administration",
        content: (
          <>
            It is associated with other resources or has cascade restrictions.
            <br />
            <em>
              Please review and resolve dependencies before attempting to
              delete.
            </em>
          </>
        ),
      });
      setLoading(false);
    }
  };

  const handleOnDelete = () => {
    Modal.confirm({
      title: `Delete ${initialValues.name}`,
      content: "Are you sure you want to delete this administration?",
      onOk: () => {
        store.update((s) => {
          s.masterData.administration = {};
        });
        deleteAdministration(initialValues);
      },
    });
  };

  const parentAdm = useMemo(() => {
    return level === null ? [] : window.dbadm.filter((a) => a.level === level);
  }, [level]);

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      const _attributes = values.attributes
        .map((attr) => {
          const { id: attrId, aggregate, ...fieldValue } = attr;
          const attributeValue = aggregate?.[0]
            ? Object.fromEntries(
                Object.entries(aggregate[0]).filter(
                  (entries) => entries?.[1] !== null
                )
              )
            : Object.values(fieldValue)?.[0] || null;
          return {
            attribute: attrId,
            value: attributeValue,
          };
        })
        .filter(
          (attr) =>
            (!Array.isArray(attr.value) && attr.value) ||
            (Array.isArray(attr.value) && attr.value.length)
        );
      const payload =
        values.code === ""
          ? {
              name: values.name,
              parent: values.parent,
              attributes: _attributes,
            }
          : {
              code: values.code,
              name: values.name,
              parent: values.parent,
              attributes: _attributes,
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
    if (id && preload) {
      setPreload(false);
      const { data: apiData } = await api.get(`/administrations/${id}`);
      store.update((s) => {
        s.masterData.administration = apiData;
      });
    }
  }, [id, preload]);

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
            acc[currentValue] = id
              ? findValue?.value?.[currentValue] || null
              : null;
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
          [attr.name]: id ? findValue?.value || defaultValue : defaultValue,
        };
      });
      setAttributes(_attributes);
      const findLevel = admLevels.find(
        (l) => l.id === initialValues?.level?.id
      );
      if (findLevel) {
        setLevel(findLevel.level - 1);
      }
      const fieldValues = id
        ? {
            ...initialValues,
            parent: initialValues?.parent?.id,
            level_id: findLevel?.level - 1,
            attributes: attrFields,
          }
        : { attributes: attrFields };
      form.setFieldsValue(fieldValues);
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [form, id, initialValues, admLevels]);

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
          <Row gutter={16} align="middle">
            <Col span={6}>
              <div className="form-row">
                <Form.Item name="level_id" label="Parent Level">
                  <Select
                    getPopupContainer={(trigger) => trigger.parentNode}
                    placeholder="Select level.."
                    value={level}
                    onChange={(val) => {
                      setLevel(val);
                      form.setFieldsValue({ parent: null });
                    }}
                    allowClear
                  >
                    {admLevels
                      ?.slice()
                      ?.sort((a, b) => a?.level - b?.level)
                      ?.map((adm) => (
                        <Option key={adm.id} value={adm.level}>
                          {adm.name}
                        </Option>
                      ))}
                  </Select>
                </Form.Item>
              </div>
            </Col>
            <Col span={18}>
              <Form.Item name="parent" label="Administration Parent">
                <Select
                  showSearch
                  filterOption={(input, option) =>
                    (option?.name ?? "")
                      .toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  getPopupContainer={(trigger) => trigger.parentNode}
                  placeholder="Select parent.."
                  fieldNames={{ value: "id", label: "name" }}
                  options={parentAdm}
                  allowClear
                />
              </Form.Item>
            </Col>
          </Row>
          <Row className="form-row">
            <Col span={24}>
              <Form.Item name="code" label="Administration Code">
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
        <Space direction="horizontal">
          {id && (
            <Button type="danger" onClick={handleOnDelete}>
              Delete
            </Button>
          )}
          <Button type="primary" htmlType="submit" loading={submitting}>
            Save administration
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default AddAdministration;
