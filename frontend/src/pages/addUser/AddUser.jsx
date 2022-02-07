import React from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Button,
  Breadcrumb,
  Divider,
  Input,
  Select,
  Checkbox,
  Typography,
} from "antd";

const { Option } = Select;
const { Title } = Typography;

const AddUser = () => {
  return (
    <div id="addUser">
      <Row justify="space-between">
        <Col>
          <Breadcrumb
            separator={
              <h2 className="ant-typography" style={{ display: "inline" }}>
                {">"}
              </h2>
            }
          >
            <Breadcrumb.Item>
              <a href="">
                <Title style={{ display: "inline" }} level={2}>
                  Control Center
                </Title>
              </a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <a href="">
                <Title style={{ display: "inline" }} level={2}>
                  Manage Users
                </Title>
              </a>
            </Breadcrumb.Item>
            <Breadcrumb.Item>
              <a href="">
                <Title style={{ display: "inline" }} level={2}>
                  Add User
                </Title>
              </a>
            </Breadcrumb.Item>
          </Breadcrumb>
        </Col>
      </Row>
      <Divider />
      <Card bodyStyle={{ padding: 0 }}>
        <Row className="form-row">
          <Col span={12}>
            <label htmlFor="firstName">First Name</label>
            <Input id="firstName" />
          </Col>
          <Col span={12}>
            <label htmlFor="lastName">Last Name</label>
            <Input id="lastName" />
          </Col>
        </Row>
        <div className="form-row">
          <label htmlFor="emailAddress">Email Address</label>
          <Input type="email" id="emailAddress" />
        </div>
        <div className="form-row">
          <label htmlFor="organization">Organization</label>
          <Select
            id="organization"
            defaultValue="MOH"
            style={{ width: "100%" }}
          >
            <Option value="MOH">MOH</Option>
          </Select>
        </div>
        <div className="form-row">
          <label htmlFor="role">Role</label>
          <Select id="role" defaultValue="Admin" style={{ width: "100%" }}>
            <Option value="Admin">Admin</Option>
          </Select>
        </div>
        <div className="form-row">
          <label htmlFor="county">County</label>
          <Select id="county" defaultValue="Baringo" style={{ width: "100%" }}>
            <Option value="Baringo">Baringo</Option>
          </Select>
        </div>
        <div className="form-row">
          <label htmlFor="subCounty">Sub-County</label>
          <Select
            id="subCounty"
            defaultValue="Baringo East"
            style={{ width: "100%" }}
          >
            <Option value="Baringo East">Baringo East</Option>
          </Select>
        </div>
        <div className="form-row">
          <label htmlFor="ward">Ward</label>
          <Select id="ward" defaultValue="Kabartonjo" style={{ width: "100%" }}>
            <Option value="Kabartonjo">Kabartonjo</Option>
          </Select>
        </div>
        <div className="form-row">
          <label htmlFor="community">Community</label>
          <Select
            id="community"
            defaultValue="Bumlegun"
            style={{ width: "100%" }}
          >
            <Option value="Bumlegun">Bumlegun</Option>
          </Select>
        </div>
        <div className="form-row">
          <label htmlFor="questionnaires">Questionnaires</label>
          <Select
            id="questionnaires"
            defaultValue="G4 Questionnaire Hs V2"
            style={{ width: "100%" }}
          >
            <Option value="G4 Questionnaire Hs V2">
              G4 Questionnaire Hs V2
            </Option>
          </Select>
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
          <Button type="primary">Add User</Button>
        </Col>
      </Row>
    </div>
  );
};

export default AddUser;
