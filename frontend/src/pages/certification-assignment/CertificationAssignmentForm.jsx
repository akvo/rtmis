import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Row, Col, Space, Form, Button, Select, Modal, Input, Tag } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import {
  AdministrationDropdown,
  Breadcrumbs,
  DescriptionPanel,
} from "../../components";
import { api, store, uiText } from "../../lib";
import { useNotification } from "../../util/hooks";
import "./style.scss";

const CertificationAssignmentForm = () => {
  const [form] = Form.useForm();

  const navigate = useNavigate();
  const { id } = useParams();
  const { notify } = useNotification();

  const [editAssignment, setEditAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState(null);
  const [county, setCounty] = useState(null);
  const [assignee, setAssignee] = useState(null);

  const profile = store.useState((s) => s.user);
  const selectedAdm = store.useState((s) => s.administration);
  const levels = store.useState((s) => s.levels);
  const IS_COUNTY_ADMIN = profile?.role?.value === "County Admin";
  const { active: activeLang } = store.useState((s) => s.language);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const onFinish = async ({ administrations }) => {
    setSubmitting(true);
    const administrationIDs = administrations?.map((a) => a?.id);
    try {
      if (id) {
        await api.put(`/form/certification-assignment/${id}`, {
          assignee,
          administrations: administrationIDs,
        });
      } else {
        await api.post("/form/certification-assignment/", {
          assignee,
          administrations: administrationIDs,
        });
      }
      setSubmitting(false);
      store.update((s) => {
        s.administration = s.administration.slice(0, 1);
      });
      navigate("/control-center/certification");
      notify({
        type: "success",
        message: id ? text.certifySuccessUpdated : text.certifySuccessAdded,
      });
    } catch (error) {
      setSubmitting(false);
      Modal.error({
        title: text.notifyError,
        content: String(error),
      });
    }
  };

  const onDelete = async () => {
    if (!editAssignment?.id) {
      return;
    }
    setLoading(true);
    try {
      await api.delete(`/form/certification-assignment/${editAssignment.id}`);
      setLoading(false);
      navigate("/control-center/certification");
      notify({
        type: "success",
        message: text.certifySuccessDeleted,
      });
    } catch (error) {
      setLoading(false);
      Modal.error({
        title: text.notifyError,
        content: String(error),
      });
    }
  };

  const onSelectCounty = useCallback(
    async (countyID) => {
      setAssignee(null);
      setSubCounties([]);
      setCounty(countyID);
      const { data: apiData } = await api.get(`/administrations/${countyID}`);
      if (!IS_COUNTY_ADMIN) {
        store.update((s) => {
          s.administration = [s.administration[0], apiData];
        });
      }
      const subOptions = apiData?.children?.map((d) => ({
        label: d?.name,
        value: d?.id,
      }));
      setSubCounties(subOptions);
    },
    [IS_COUNTY_ADMIN]
  );

  const onSelectSubCounty = (value) => {
    setAssignee(value);
    form.setFieldsValue({
      assignee: value,
      administrations: [],
    });
    store.update((s) => {
      s.administration = selectedAdm.slice(0, 2);
    });
  };

  const onSelectVillage = (values) => {
    const lastLevel = levels?.slice(-1)?.[0]?.level;
    const villages = form.getFieldValue("administrations") || [];
    const selectedLevel = selectedAdm?.slice(-1)?.[0]?.level + 1;
    if (selectedLevel >= lastLevel) {
      const ward = selectedAdm.find((s) => s?.level === lastLevel - 1);
      const village = ward?.children?.find(
        (c) =>
          values?.includes(c.id) &&
          !villages.filter((v) => v?.id === c?.id).length
      );
      if (village) {
        form.setFieldsValue({
          administrations: [
            ...villages,
            {
              ...village,
              full_name: village?.full_name?.replace(/\|/g, " - "),
            },
          ],
        });
        store.update((s) => {
          s.administration = selectedAdm.slice(0, selectedAdm.length);
        });
      }
    }
    /**
     * Reset if change county
     */
    const findCounty = selectedAdm?.[0]?.children?.find((c) =>
      values?.includes(c?.id)
    );
    if (findCounty && findCounty.id !== county && findCounty?.level === 2) {
      setCounty(findCounty.id);
      setAssignee(null);
      setSubCounties([]);
      form.setFieldsValue({ administrations: [] });
    }
  };

  const pageTitle = id ? text.certificationEdit : text.certificationAdd;
  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.certificationTitle,
      link: "/control-center/certification",
    },
    {
      title: pageTitle,
    },
  ];

  const fetchData = useCallback(async () => {
    try {
      if (id && !editAssignment?.id) {
        const { data: apiData } = await api.get(
          `/form/certification-assignment/${id}`
        );
        setEditAssignment(apiData);
      }
      if (id && loading && editAssignment?.id) {
        await onSelectCounty(editAssignment?.county_id);
        setCounty(editAssignment?.county_id);
        setAssignee(editAssignment?.assignee?.id);
        form.setFieldsValue({
          assignee: editAssignment?.assignee?.id,
          administrations: editAssignment?.administrations,
        });

        setLoading(false);
      }

      if (!id && loading) {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, [id, loading, editAssignment, form, onSelectCounty]);

  const fetchCounties = useCallback(async () => {
    try {
      const { data: apiData } = await api.get("/administrations/1");
      /**
       * Filter by level name = County
       */
      const countyOptions = apiData?.children?.map((d) => ({
        label: d?.name,
        value: d?.id,
      }));
      setCounties(countyOptions);
    } catch {
      setCounties([]);
    }
  }, []);

  const fetchSubCounties = useCallback(async () => {
    if (IS_COUNTY_ADMIN && subCounties === null) {
      onSelectCounty(profile?.administration?.id);
    }
  }, [
    IS_COUNTY_ADMIN,
    subCounties,
    profile?.administration?.id,
    onSelectCounty,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCounties();
  }, [fetchCounties]);

  useEffect(() => {
    fetchSubCounties();
  }, [fetchSubCounties]);

  return (
    <div id="certification-assignments">
      <div className="description-container">
        <Row justify="space-between" align="bottom">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={text.certificationDesc}
              title={pageTitle}
            />
          </Col>
        </Row>
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          <Form
            name="certification-form"
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            onFinish={onFinish}
          >
            <div className="form-row">
              <Form.Item
                name="assignee"
                label={text.certifyAssignee}
                rules={[
                  { required: true, message: text.certifyAssigneeRequired },
                ]}
              >
                <Space align="baseline" direction="vertical" size="small">
                  {!IS_COUNTY_ADMIN && (
                    <Select
                      placeholder={text.selectCounty}
                      getPopupContainer={(trigger) => trigger.parentNode}
                      dropdownMatchSelectWidth={false}
                      options={counties}
                      className="custom-select"
                      filterOption={(val, option) =>
                        option.label.toLowerCase().includes(val.toLowerCase())
                      }
                      disabled={loading || submitting}
                      onChange={onSelectCounty}
                      value={county}
                      showSearch
                      allowClear
                    />
                  )}
                  <Select
                    placeholder={text.selectSubCounty}
                    getPopupContainer={(trigger) => trigger.parentNode}
                    dropdownMatchSelectWidth={false}
                    options={subCounties}
                    className="custom-select"
                    filterOption={(val, option) =>
                      option.label.toLowerCase().includes(val.toLowerCase())
                    }
                    disabled={loading || submitting}
                    onChange={onSelectSubCounty}
                    value={assignee}
                    showSearch
                    allowClear
                  />
                </Space>
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item name="village" label={text.admToCertify}>
                <AdministrationDropdown
                  size="large"
                  width="100%"
                  certify={assignee}
                  excluded={form
                    .getFieldValue("administrations")
                    ?.map((a) => a?.id)}
                  onChange={onSelectVillage}
                />
              </Form.Item>
            </div>
            <Row>
              <Col span={18} offset={6} className="administrations-list">
                <Form.List
                  name="administrations"
                  rules={[
                    {
                      required: true,
                      message: text.admToCertifyRequired,
                    },
                  ]}
                >
                  {(fields, { remove }, { errors }) => (
                    <Space align="baseline" direction="vertical" size="small">
                      {fields.map(({ key, name, ...restField }) => (
                        <div key={key}>
                          <Form.Item name={[name, "full_name"]} {...restField}>
                            <Input type="hidden" />
                          </Form.Item>
                          <Tag onClose={() => remove(name)} closable>
                            {form.getFieldValue([
                              "administrations",
                              name,
                              "full_name",
                            ])}
                          </Tag>
                        </div>
                      ))}
                      <Form.ErrorList errors={errors} />
                    </Space>
                  )}
                </Form.List>
              </Col>
            </Row>

            <Row justify="center" align="middle">
              <Col span={18} offset={6}>
                <Space>
                  <Button
                    type="primary"
                    htmlType="submit"
                    shape="round"
                    loading={submitting}
                  >
                    {text.saveButton}
                  </Button>
                  {id && (
                    <Button type="danger" shape="round" onClick={onDelete}>
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

export default CertificationAssignmentForm;
