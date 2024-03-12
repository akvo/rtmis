import React, { useRef, useState, useMemo } from "react";
import { Button, Modal, Carousel, Row, Col, Space } from "antd";
import { QuestionCircleOutlined } from "@ant-design/icons";
import { store, uiText } from "../../lib";
import "./style.scss";

const Tour = ({ steps, title = "Help" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const cRef = useRef(null);
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);
  const handleNext = () => {
    if (current < steps.length - 1) {
      cRef.current.next();
    } else {
      setIsVisible(false);
    }
  };
  const handlePrev = () => {
    cRef.current.prev();
  };
  const handleCancel = () => {
    setIsVisible(false);
  };
  const handleChange = (index) => {
    setCurrent(index);
  };
  if (steps.length < 1) {
    return "";
  }
  return (
    <>
      <Button
        type="text"
        onClick={() => {
          setCurrent(0);
          setIsVisible(true);
        }}
        icon={
          <QuestionCircleOutlined style={{ fontSize: 24, color: "#1990ff" }} />
        }
      />
      <Modal
        title={title}
        open={isVisible}
        onCancel={handleCancel}
        destroyOnClose={true}
        footer={
          <Row justify="space-between">
            <Col className="text-muted">
              {current + 1} / {steps.length}
            </Col>
            <Col>
              <Space direction="horizontal">
                <Button
                  onClick={handlePrev}
                  disabled={current < 1}
                  shape="round"
                >
                  {text?.prev}
                </Button>
                <Button type="primary" onClick={handleNext} shape="round">
                  {current < steps.length - 1 ? text?.next : text?.finish}
                </Button>
              </Space>
            </Col>
          </Row>
        }
      >
        <Carousel afterChange={handleChange} ref={cRef} dots={false}>
          {steps.map((step, sI) => (
            <div key={sI}>
              <img src={step.image} height={300} />
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </Carousel>
      </Modal>
    </>
  );
};

export default React.memo(Tour);
