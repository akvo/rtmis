import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Col, Form, Input, Modal, Row, Select, Space } from "antd";
import {
  AdministrationDropdown,
  Breadcrumbs,
  DescriptionPanel,
  InputAttributes,
} from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import { api, config, store, uiText } from "../../lib";
import "./style.scss";

const { Option } = Select;

const AddAdministration = () => {
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [attributes, setAttributes] = useState(true);
  const [level, setLevel] = useState(null);
  const [preload, setPreload] = useState(true);
  const authUser = store.useState((s) => s.user);
  const { administration_level: levelAccess } = config.roles.find(
    (r) => r?.id === authUser?.role?.id
  );
  const admLevels = store.useState((s) => s.levels);
  const initialValues = store.useState((s) => s.masterData.administration);
  const selectedAdmns = store.useState((s) => s.administration);

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();
  const { id } = useParams();
  const ADM_PERSIST = id ? true : false;
  const levelIDs = useMemo(() => {
    return admLevels?.slice(1, admLevels.length - 1)?.map((l) => l.id) || [];
  }, [admLevels]);
  const showAdm = levelIDs.includes(level);

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

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
      const _parent = selectedAdmns?.slice(-1)?.[0]?.id;
      const payload =
        values.code === ""
          ? {
              name: values.name,
              parent: _parent,
              attributes: _attributes,
            }
          : {
              code: values.code,
              name: values.name,
              parent: _parent,
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
    if (!id) {
      store.update((s) => {
        s.masterData.administration = {};
      });
      form.resetFields();
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
      const findParent = window.dbadm.find(
        (adm) => adm?.id === initialValues?.parent?.id
      );
      if (findParent && id) {
        const findLevel = admLevels.find((l) => l?.level === findParent.level);
        setLevel(findLevel?.id);
        const ancestors =
          findParent?.path
            ?.split(".")
            ?.filter((p) => p)
            ?.map((pID) =>
              window.dbadm.find((dba) => dba?.id === parseInt(pID, 10))
            ) || [];
        store.update((s) => {
          s.administration = [...ancestors, findParent]?.map((a, ax) => {
            const childLevel = admLevels.find((l) => l?.level === ax + 1);
            return {
              ...a,
              childLevelName: childLevel?.name || null,
              children:
                a?.children ||
                window.dbadm.filter((sa) => sa?.parent === a?.id),
            };
          });
        });
        const level_id = levelIDs?.includes(findLevel?.id)
          ? findLevel.id
          : null;
        form.setFieldsValue({
          ...initialValues,
          level_id,
          attributes: attrFields,
        });
      } else {
        form.setFieldsValue({ attributes: attrFields });
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }, [form, id, initialValues, admLevels, levelIDs]);

  useEffect(() => {
    fetchAttributes();
  }, [fetchAttributes]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.manageAdministrativeList,
      link: "/master-data",
    },
    {
      title: id ? text.editAdministration : text.addAdministration,
    },
  ];

  return (
    <div id="add-administration">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
          <DescriptionPanel
            title={id ? text.editAdministration : text.addAdministration}
          />
        </Col>
      </Row>
      <div className="table-section">
        <div className="table-wrapper">
          <Form
            name="adm-form"
            form={form}
            onFinish={onFinish}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="code" label="Administration Code">
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <div className="form-row">
                  <Form.Item name="level_id" label="Level">
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
                        ?.slice(1, admLevels.length - 1)
                        ?.filter((l) => l?.id >= levelAccess[0])
                        ?.sort((a, b) => a?.level - b?.level)
                        ?.map((adm) => (
                          <Option key={adm.id} value={adm.id}>
                            {adm.name}
                          </Option>
                        ))}
                    </Select>
                  </Form.Item>
                </div>
              </Col>
              <Col span={24}>
                {showAdm && (
                  <Form.Item name="parent" label="Administration Parent">
                    <AdministrationDropdown
                      size="large"
                      width="100%"
                      maxLevel={level}
                      persist={ADM_PERSIST}
                      currentId={id}
                    />
                  </Form.Item>
                )}
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
                      message: "Administration name is required",
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <InputAttributes attributes={attributes} loading={loading} />
            <Space
              direction="horizontal"
              justify="center"
              style={{ justifyContent: "center", width: "100%" }}
            >
              {id && (
                <Button type="danger" shape="round" onClick={handleOnDelete}>
                  Delete
                </Button>
              )}
              <Button
                type="primary"
                shape="round"
                htmlType="submit"
                loading={submitting}
              >
                Save administration
              </Button>
            </Space>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AddAdministration;
