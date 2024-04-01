import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Row, Col, Space, Form, Button, Select, Modal } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import {
  AdministrationDropdown,
  Breadcrumbs,
  DescriptionPanel,
} from "../../components";
import { api, store, uiText } from "../../lib";
import { useNotification } from "../../util/hooks";

const CertificationAssignmentForm = () => {
  const [form] = Form.useForm();

  const navigate = useNavigate();
  const { id } = useParams();
  const { notify } = useNotification();

  const [editAssignment, setEditAssignment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState([]);

  const { active: activeLang } = store.useState((s) => s.language);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const onFinish = async ({ assignee, administrations }) => {
    setSubmitting(true);
    try {
      if (id) {
        await api.put(`/form/certification-assignment/${id}`, {
          assignee,
          administrations,
        });
      } else {
        await api.post("/form/certification-assignment/", {
          assignee,
          administrations,
        });
      }
      setSubmitting(false);
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

  const onSelectCounty = useCallback(async (countyID) => {
    const { data: apiData } = await api.get(`/administrations/${countyID}`);
    const subOptions = apiData?.children?.map((d) => ({
      label: d?.name,
      value: d?.id,
    }));
    setSubCounties(subOptions);
  }, []);

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
        const admIDs = editAssignment?.administrations
          ?.filter((a) => a?.id)
          ?.map((a) => a.id);
        const admAPIs = admIDs?.map((admID) =>
          api.get(`administration/${admID}`)
        );

        await onSelectCounty(editAssignment?.county_id);

        form.setFieldsValue({ county: editAssignment?.county_id });
        form.setFieldsValue({ assignee: editAssignment?.assignee?.id });
        form.setFieldsValue({ administrations: admIDs });
        const admAPIResponses = await Promise.all(admAPIs);
        const administrations = admAPIResponses.map((a) => a?.data);

        const parents = await Promise.all(
          (administrations?.[0]?.path?.split(".") ?? [])
            .filter((p) => p)
            .map(async (pID) => {
              const apiResponse = await api.get(`administration/${pID}`);
              return apiResponse.data;
            })
        );

        store.update((s) => {
          s.administration = [...parents, ...administrations];
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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCounties();
  }, [fetchCounties]);

  return (
    <div id="mobile-assignments">
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
                name="county"
                label={text.admCounty}
                rules={[{ required: true, message: text.admCountyRequired }]}
              >
                <Select
                  placeholder={text.admCounty}
                  getPopupContainer={(trigger) => trigger.parentNode}
                  dropdownMatchSelectWidth={false}
                  options={counties}
                  className="custom-select"
                  filterOption={(val, option) =>
                    option.label.toLowerCase().includes(val.toLowerCase())
                  }
                  disabled={loading || submitting}
                  onChange={onSelectCounty}
                  showSearch
                  allowClear
                />
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item
                name="assignee"
                label={text.certifyAssignee}
                rules={[
                  { required: true, message: text.certifyAssigneeRequired },
                ]}
              >
                <Select
                  placeholder={text.certifyAssignee}
                  getPopupContainer={(trigger) => trigger.parentNode}
                  dropdownMatchSelectWidth={false}
                  options={subCounties}
                  className="custom-select"
                  filterOption={(val, option) =>
                    option.label.toLowerCase().includes(val.toLowerCase())
                  }
                  disabled={loading || submitting}
                  showSearch
                  allowClear
                />
              </Form.Item>
            </div>
            <div className="form-row">
              <Form.Item
                name="administrations"
                label={text.admToCertify}
                rules={[{ required: true, message: text.admToCertifyRequired }]}
              >
                <AdministrationDropdown
                  size="large"
                  width="100%"
                  direction="vertical"
                  persist={id ? true : false}
                  allowMultiple
                />
              </Form.Item>
            </div>
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
