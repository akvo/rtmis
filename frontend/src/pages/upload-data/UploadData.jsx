import React, { useState } from "react";
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
import { Breadcrumbs } from "../../components";
import { AdministrationDropdown } from "../../components";
import { api, store } from "../../lib";
import { useNotification } from "../../util/hooks";

const { Option } = Select;
const { Dragger } = Upload;
const regExpFilename = /filename="(?<filename>.*)"/;
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
  const [formId, setFormId] = useState(null);
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  const props = {
    name: "file",
    multiple: true,
    action: "",
  };

  const handleChange = (e) => {
    setFormId(e);
  };

  const downloadTemplate = () => {
    setLoading(true);
    api
      .get(`export/form/${formId}`, { responseType: "blob" })
      .then((res) => {
        const contentDispositionHeader = res.headers["content-disposition"];
        const filename = regExpFilename.exec(contentDispositionHeader)?.groups
          ?.filename;
        if (filename) {
          const url = window.URL.createObjectURL(new Blob([res.data]));
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute("download", filename);
          document.body.appendChild(link);
          link.click();
          setLoading(false);
        } else {
          notify({
            type: "error",
            message: "Could not fetch template",
          });
          setLoading(false);
        }
      })
      .catch((e) => {
        console.error(e);
        notify({
          type: "error",
          message: "Could not fetch template",
        });
        setLoading(false);
      });
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
        <Checkbox id="updateExisting" className="dev" onChange={() => {}}>
          Update Existing Data
        </Checkbox>
      </Row>
      <Card
        style={{ padding: 0, minHeight: "40vh" }}
        bodyStyle={{ padding: 0 }}
      >
        <Space align="center" size={32}>
          <img src="/assets/data-download.svg" />
          <p>If you do not already have a template please download it</p>
          <Select placeholder="Select Form..." onChange={handleChange}>
            {forms.map((f, fI) => (
              <Option key={fI} value={f.id}>
                {f.name}
              </Option>
            ))}
          </Select>
          <Button loading={loading} type="primary" onClick={downloadTemplate}>
            Download
          </Button>
        </Space>
        <Space align="center" size={32}>
          <img src="/assets/data-upload.svg" />
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
            <Button className="dev">Browse your computer</Button>
          </Dragger>
        </div>
      </Card>
    </div>
  );
};

export default React.memo(UploadData);
