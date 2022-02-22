import React, { useEffect, useState } from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Divider,
  Input,
  Select,
  Checkbox,
  message,
} from "antd";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib";
import { Breadcrumbs } from "../../components";

const { Option } = Select;

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Manage Users",
    link: "/users",
  },
  {
    title: "Add User",
  },
];

const AddUser = () => {
  const [cookies] = useCookies(["AUTH_TOKEN"]);
  const [counties, setCounties] = useState([]);
  const [subCounties, setSubCounties] = useState([]);
  const [wards, setWards] = useState([]);
  const [communities, setCommunities] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = (values) => {
    setSubmitting(true);
    api
      .post("add/user/", {
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        administration: values.community
          ? values.community
          : values.ward
          ? values.ward
          : values.subcounty
          ? values.subcounty
          : values.county,
        role: values.role,
      })
      .then(() => {
        message.success("User added");
        setSubmitting(false);
        navigate("/users");
      })
      .catch((err) => {
        message.error(err.response?.data?.message || "User could not be added");
        setSubmitting(false);
      });
  };

  const getAdministration = (id) => {
    setLoading(true);
    api
      .get(`administration/${id}`, {
        headers: { Authorization: `Bearer ${cookies.AUTH_TOKEN}` },
      })
      .then((res) => {
        switch (res.data.level) {
          case 0:
            setCounties(res.data.children);
            setLoading(false);
            break;
          case 1:
            setSubCounties(res.data.children);
            setLoading(false);
            break;
          case 2:
            setWards(res.data.children);
            setLoading(false);
            break;
          case 3:
            setCommunities(res.data.children);
            setLoading(false);
            break;
          default:
            setLoading(false);
            break;
        }
      })
      .catch((err) => {
        message.error("Could not load data");
        setLoading(false);
        console.error(err);
      });
  };

  useEffect(() => {
    const init = () => {
      setLoading(true);
      api
        .get("administration/1")
        .then((res) => {
          setCounties(res.data.children);
          setLoading(false);
        })
        .catch((err) => {
          message.error("Could not load data");
          setLoading(false);
          console.error(err);
        });
    };
    if (cookies.AUTH_TOKEN) {
      init();
    }
  }, [cookies.AUTH_TOKEN]);

  return (
    <div id="addUser">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
      </Row>
      <Divider />
      <Form
        name="user-form"
        form={form}
        layout="vertical"
        initialValues={{
          first_name: "",
          last_name: "",
          email: "",
          role: null,
          county: null,
        }}
        onFinish={onFinish}
      >
        <Card bodyStyle={{ padding: 0 }}>
          <Row className="form-row">
            <Col span={12}>
              <Form.Item
                label="First name"
                name="first_name"
                rules={[
                  {
                    required: true,
                    message: "First name is required",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="Last name"
                name="last_name"
                rules={[
                  {
                    required: true,
                    message: "Last name is required",
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>
          <div className="form-row">
            <Form.Item
              label="Email Address"
              name="email"
              rules={[
                {
                  required: true,
                  message: "Please enter a valid Email Address",
                  type: "email",
                },
              ]}
            >
              <Input />
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item
              name="organization"
              label="Organization"
              rules={[{ required: false }]}
            >
              <Select
                disabled
                placeholder="Select one.."
                onChange={(e) => {
                  form.setFieldsValue({ organization: e });
                }}
                allowClear
              >
                <Option value="1">MOH</Option>
                <Option value="2">UNICEF</Option>
              </Select>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: "Please select a Role" }]}
            >
              <Select
                placeholder="Select one.."
                onChange={(e) => {
                  form.setFieldsValue({ role: e });
                }}
              >
                <Option value="1">Super Admin</Option>
                <Option value="2">Admin</Option>
                <Option value="3">Approver</Option>
                <Option value="4">User</Option>
              </Select>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item
              name="county"
              label="County"
              rules={[{ required: true, message: "Please select a county" }]}
            >
              <Select
                disabled={loading}
                placeholder="Select one.."
                allowClear
                onChange={(e) => {
                  form.setFieldsValue({
                    county: e,
                    subcounty: null,
                    ward: null,
                    community: null,
                  });
                  setSubCounties([]);
                  setWards([]);
                  setCommunities([]);
                  getAdministration(e);
                }}
              >
                {counties.map((county, countyIdx) => (
                  <Option key={countyIdx} value={county.id}>
                    {county.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item
              name="subcounty"
              label="Sub-County"
              rules={[{ required: false }]}
            >
              <Select
                disabled={loading}
                placeholder="Select one.."
                allowClear
                onChange={(e) => {
                  form.setFieldsValue({
                    subcounty: e,
                    ward: null,
                    community: null,
                  });
                  setWards([]);
                  setCommunities([]);
                  getAdministration(e);
                }}
              >
                {subCounties.map((subcounty, subcountyIdx) => (
                  <Option key={subcountyIdx} value={subcounty.id}>
                    {subcounty.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item name="ward" label="Ward" rules={[{ required: false }]}>
              <Select
                disabled={loading}
                placeholder="Select one.."
                allowClear
                onChange={(e) => {
                  form.setFieldsValue({ ward: e, community: null });
                  setCommunities([]);
                  getAdministration(e);
                }}
              >
                {wards.map((ward, wardIdx) => (
                  <Option key={wardIdx} value={ward.id}>
                    {ward.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
          <div className="form-row">
            <Form.Item
              name="community"
              label="Community"
              rules={[{ required: false }]}
            >
              <Select
                disabled={loading}
                placeholder="Select one.."
                allowClear
                onChange={(e) => {
                  form.setFieldsValue({ community: e });
                }}
              >
                {communities.map((community, communityIdx) => (
                  <Option key={communityIdx} value={community.id}>
                    {community.name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </div>
        </Card>
        <Row justify="space-between">
          <Col>
            <Row>
              <Checkbox id="informUser" onChange={() => {}}></Checkbox>
              <label htmlFor="informUser">Inform User of Changes</label>
            </Row>
          </Col>
          <Col>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              disabled={loading}
            >
              Add User
            </Button>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default AddUser;
