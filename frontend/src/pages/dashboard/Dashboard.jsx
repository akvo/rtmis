import React from "react";
import "./style.scss";
import { useParams } from "react-router-dom";
import { Row, Col } from "antd";
import { VisualisationFilters } from "../../components";

const Dashboard = () => {
  const { formId } = useParams();
  const selectedForm = window?.forms?.find((x) => String(x.id) === formId);
  const current = window?.dashboard?.find((x) => String(x.form_id) === formId);

  return (
    <div id="dashboard">
      <div className="page-title-wrapper">
        <h1>{`${selectedForm.name} Data`}</h1>
      </div>
      <VisualisationFilters showFormOptions={false} />
      <Row className="main-wrapper" align="middle">
        <Col span={24} align="center">
          {current ? <>Render</> : <h4>No data</h4>}
        </Col>
      </Row>
    </div>
  );
};

export default React.memo(Dashboard);
