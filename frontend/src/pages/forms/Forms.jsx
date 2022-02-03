import React, { useEffect, useState } from "react";
import { Webform } from "akvo-react-form";
import "akvo-react-form/dist/index.css";
import "./style.scss";
import { useParams } from "react-router-dom";
import { Row, Col, Affix, Progress } from "antd";
import { api } from "../../lib";

const Forms = () => {
  const { formId } = useParams();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [percentage, setPercentage] = useState(0);

  const onFinish = (values) => {
    let data = Object.keys(values).map((v) => {
      if (values[v]) {
        return { question: parseInt(v), value: values[v] };
      }
      return false;
    });
    data = data.filter((x) => x);
    console.info(data);
  };

  const onChange = ({ progress }) => {
    setPercentage(progress.toFixed(0));
  };

  useEffect(() => {
    (async function () {
      if (formId && loading) {
        api.get(`v1/form/${formId}`).then((x) => {
          setForms(x.data);
          setLoading(false);
        });
      }
    })();
  }, [formId, loading]);

  if (loading) {
    return "";
  }
  if (!formId) {
    return "";
  }

  return (
    <div id="form">
      <Affix style={{ width: "100%", zIndex: 1002 }}>
        <div className="webform-progress-bar">
          <Progress percent={percentage} />
        </div>
      </Affix>
      <Row justify="center">
        <Col span={24} className="webform">
          <Webform forms={forms} onFinish={onFinish} onChange={onChange} />
        </Col>
      </Row>
    </div>
  );
};

export default Forms;
