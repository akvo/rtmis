import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
} from "antd";
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
    return admLevels?.slice(1, admLevels.length)?.map((l) => l.id) || [];
  }, [admLevels]);

  const showAdm = levelIDs.includes(level - 1);

  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);
  const descriptionData = <p>{id ? text.editAdmDesc : text.addAdmDesc}</p>;

  const deleteAdministration = async (row) => {
    try {
      await api.delete(`/administrations/${row.id}`);
      notify({
        type: "success",
        message: text.admSuccessDeleted,
      });
      navigate("/control-center/master-data/administration");
    } catch {
      Modal.error({
        title: text.admErrDeleteTitle,
        content: (
          <>
            {text.errDeleteCascadeText1}
            <br />
            <em>{text.errDeleteCascadeText2}</em>
          </>
        ),
      });
      setLoading(false);
    }
  };

  const handleOnDelete = () => {
    Modal.confirm({
      title: `${text.deleteText} ${initialValues.name}`,
      content: text.admConfirmDelete,
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
        ?.map((attr) => {
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
          message: text.admSuccessUpdated,
        });
      } else {
        await api.post("/administrations", payload);
        notify({
          type: "success",
          message: text.admSuccessAdded,
        });
      }
      store.update((s) => {
        s.masterData.administration = {};
      });
      setSubmitting(false);
      navigate("/control-center/master-data/administration");
    } catch (e) {
      console.error(e);
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
      const { data: findParent } = await api.get(
        `administration/${initialValues?.parent?.id}`
      );
      if (findParent && id) {
        const findLevel = admLevels.find(
          (l) => l?.level === findParent.level + 1
        );
        setLevel(findLevel?.id);
        const ancestors = await Promise.all(
          (findParent?.path?.split(".") ?? [])
            .filter((p) => p)
            .map(async (pID) => {
              const apiResponse = await api.get(`administration/${pID}`);
              return apiResponse.data;
            })
        );
        store.update((s) => {
          s.administration = [...ancestors, findParent]?.map((a, ax) => {
            const childLevel = admLevels.find((l) => l?.level === ax + 1);
            return {
              ...a,
              childLevelName: childLevel?.name || null,
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
      link: "/control-center/master-data/administration",
    },
    {
      title: id ? text.editAdministration : text.addAdministration,
    },
  ];

  return (
    <div id="add-administration">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={descriptionData}
              title={id ? text.editAdministration : text.addAdministration}
            />
          </Col>
        </Row>
      </div>
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
                <Form.Item name="code" label={text.codeLabel}>
                  <Input />
                </Form.Item>
              </Col>
              <Col span={24}>
                <div className="form-row">
                  <Form.Item name="level_id" label={text.levelLabel}>
                    <Select
                      getPopupContainer={(trigger) => trigger.parentNode}
                      placeholder={text.selectLevel}
                      value={level}
                      onChange={(val) => {
                        setLevel(val);
                        form.setFieldsValue({ parent: null });
                      }}
                      allowClear
                    >
                      {admLevels
                        ?.slice(1, admLevels.length)
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
                  <Form.Item name="parent" label={text.admParent}>
                    <AdministrationDropdown
                      size="large"
                      width="100%"
                      maxLevel={level - 1}
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
                  label={text.admName}
                  rules={[
                    {
                      required: true,
                      message: text.admNameRequired,
                    },
                  ]}
                >
                  <Input />
                </Form.Item>
              </Col>
            </Row>
            <Divider />
            <InputAttributes attributes={attributes} loading={loading} />
            <Row className="form-row" justify="center" align="middle">
              <Col span={18} offset={6}>
                <Space direction="horizontal">
                  <Button
                    type="primary"
                    shape="round"
                    htmlType="submit"
                    loading={submitting}
                  >
                    {text.saveButton}
                  </Button>
                  {id && (
                    <Button
                      type="danger"
                      shape="round"
                      onClick={handleOnDelete}
                    >
                      {text.deleteText}
                    </Button>
                  )}
                </Space>
              </Col>
            </Row>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default AddAdministration;
