import React from "react";
import "./style.scss";
import {
  Row,
  Col,
  Card,
  Divider,
  Checkbox,
  Button,
  Space,
  Select,
  Upload,
} from "antd";
import { FileTextFilled } from "@ant-design/icons";
import dataUploadIcon from "../../assets/data-upload.svg";
import dataDownloadIcon from "../../assets/data-download.svg";
import { Breadcrumbs } from "../../components";
import { AdministrationDropdown } from "../../components";
import { store } from "../../lib";

const { Option } = Select;
const { Dragger } = Upload;

const pagePath = [
  {
    title: "Control Center",
    link: "/control-center",
  },
  {
    title: "Data Upload",
  },
];

const UploadData = () => {
  const { forms } = store.useState((state) => state);

  const props = {
    name: "file",
    multiple: true,
    action: "",
  };

  return (
    <div id="uploadData">
      <Row justify="space-between">
        <Col>
          <Breadcrumbs pagePath={pagePath} />
        </Col>
      </Row>
      <Divider />
      <Row align="middle">
        <Checkbox id="updateExisting" onChange={() => {}}></Checkbox>
        <label htmlFor="updateExisting">Update Existing Data</label>
      </Row>
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <Space align="center" size={32}>
          <img src={dataDownloadIcon} />
          <p>If you do not already have a template please download it</p>
          <Select placeholder="Select Form...">
            {forms.map((f, fI) => (
              <Option key={fI} value={f.id}>
                {f.name}
              </Option>
            ))}
          </Select>
          <Button className="light">Download</Button>
        </Space>
        <Space align="center" size={32}>
          <img src={dataUploadIcon} />
          <p>Upload your data</p>
          <Select placeholder="Select Form...">
            {forms.map((f, fI) => (
              <Option key={fI} value={f.id}>
                {f.name}
              </Option>
            ))}
          </Select>
          <AdministrationDropdown />
        </Space>
        <div className="upload-wrap">
          <Dragger {...props}>
            <p className="ant-upload-drag-icon">
              <FileTextFilled style={{ color: "#707070" }} />
            </p>
            <p className="ant-upload-text">Drop your file here</p>
            <Button type="primary">Browse your computer</Button>
          </Dragger>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(UploadData);
