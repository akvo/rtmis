import React, { useCallback, useEffect, useState } from "react";
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Space,
} from "antd";
import { Breadcrumbs } from "../../components";
import { useNavigate, useParams } from "react-router-dom";
import { useNotification } from "../../util/hooks";
import "./style.scss";
import { api } from "../../lib";

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Entities",
    link: "/master-data/entities/",
  },
  {
    title: "Add Entity",
  },
];

const AddEntity = () => {
  const [submitting, setSubmitting] = useState(false);
  const [entity, setEntity] = useState(null);
  const { id } = useParams();

  const navigate = useNavigate();
  const [form] = Form.useForm();
  const { notify } = useNotification();

  const onDelete = () => {
    Modal.confirm({
      title: `Delete ${entity?.name}`,
      content: "Are you sure you want to delete this entity?",
      onOk: async () => {
        try {
          await api.delete(`/entities/${entity.id}`);
          notify({
            type: "success",
            message: "Entity deleted",
          });
          navigate("/master-data/entities/");
        } catch (error) {
          Modal.error({
            title: "Unable to delete the entity",
            content: (
              <>
                It is associated with other resources or has cascade
                restrictions.
                <br />
                <em>
                  Please review and resolve dependencies before attempting to
                  delete.
                </em>
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
        await api.post("/entities", values);
      }
      notify({
        type: "success",
        message: `Entity ${id ? "updated" : "added"}`,
      });
      setSubmitting(false);
      navigate("/master-data/entities/");
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
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
      </Row>
      <Divider />
      <Form
        name="entity-form"
        form={form}
        layout="vertical"
        onFinish={onFinish}
      >
        <Card bodyStyle={{ padding: 0 }}>
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
        </Card>
        <Space>
          {id && (
            <Button type="danger" onClick={onDelete}>
              Delete
            </Button>
          )}
          <Button type="primary" htmlType="submit" loading={submitting}>
            Save
          </Button>
        </Space>
      </Form>
    </div>
  );
};

export default AddEntity;
