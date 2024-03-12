import React, { useCallback, useEffect, useState, useMemo } from "react";
import { Button, Col, Form, Input, Modal, Row, Space } from "antd";
import { Breadcrumbs, DescriptionPanel } from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import "./style.scss";
import { api, store, uiText } from "../../lib";

const AddEntity = () => {
  const [submitting, setSubmitting] = useState(false);
  const [entity, setEntity] = useState(null);
  const { id } = useParams();

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();

  const { active: activeLang } = store.useState((s) => s.language);
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.manageEntityTypes,
      link: "/control-center/master-data/entity-types/",
    },
    {
      title: id ? text.editEntity : text.addEntity,
    },
  ];

  const descriptionData = (
    <p>{id ? text.editEntityTypeDesc : text.addEntityTypeDesc}</p>
  );

  const onDelete = () => {
    Modal.confirm({
      title: `${text.deleteText} ${entity?.name}`,
      content: text.confirmDeleteEntity,
      onOk: async () => {
        try {
          await api.delete(`/entities/${entity.id}`);
          notify({
            type: "success",
            message: text.successDeletedEntity,
          });
          store.update((s) => {
            s.options.entityTypes = s.options.entityTypes.filter(
              (t) => t?.id !== entity.id
            );
          });
          navigate("/control-center/master-data/entity-types/");
        } catch (error) {
          Modal.error({
            title: text.errDeleteEntityTitle,
            content: (
              <>
                {text.errDeleteCascadeText1}
                <br />
                <em>{text.errDeleteCascadeText2}</em>
              </>
            ),
          });
        }
      },
    });
  };

  const onFinish = async (values) => {
    setSubmitting(true);
    try {
      if (id) {
        await api.put(`/entities/${id}`, values);
      } else {
        const { data: newEntity } = await api.post("/entities", values);
        store.update((s) => {
          s.options.entityTypes = [...s.options.entityTypes, newEntity];
        });
      }
      notify({
        type: "success",
        message: id ? text.successUpdatedEntity : text.successAddedEntity,
      });
      setSubmitting(false);
      navigate("/control-center/master-data/entity-types/");
    } catch (error) {
      setSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!id) {
      form.resetFields();
      return;
    }
    if (id) {
      const { data: apiData } = await api.get(`/entities/${id}`);
      setEntity(apiData);
      form.setFieldsValue({ name: apiData?.name });
    }
  }, [form, id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <div id="add-entity">
      <div className="description-container">
        <Row justify="space-between">
          <Col>
            <Breadcrumbs pagePath={pagePath} />
            <DescriptionPanel
              description={descriptionData}
              title={id ? text.editEntity : text.addEntity}
            />
          </Col>
        </Row>
      </div>
      <div className="table-section">
        <div className="table-wrapper">
          <Form
            name="adm-form"
            form={form}
            labelCol={{ span: 6 }}
            wrapperCol={{ span: 18 }}
            onFinish={onFinish}
          >
            <Form.Item
              name="name"
              label={text.nameField}
              rules={[
                {
                  required: true,
                  message: text.nameFieldRequired,
                },
              ]}
            >
              <Input />
            </Form.Item>
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

export default AddEntity;
