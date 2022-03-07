import React, { useEffect, useState } from "react";
import { Webform } from "akvo-react-form";
import "akvo-react-form/dist/index.css";
import "./style.scss";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Progress, notification } from "antd";
import { api } from "../../lib";
import { take, takeRight, tail, pick } from "lodash";
import { PageLoader } from "../../components";

const parseCascade = (cascade, names, results = []) => {
  if (names.length) {
    cascade = cascade.find((c) => c.value === take(names)[0]);
    results = [...results, cascade.label];
    return parseCascade(cascade?.children, tail(names), results);
  }
  return tail(results);
};

const Forms = () => {
  const navigate = useNavigate();
  const { formId } = useParams();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [percentage, setPercentage] = useState(0);

  const onFinish = (values) => {
    const questions = forms.question_group
      .map((x) => x.question)
      .flatMap((x) => x);
    const answers = Object.keys(values)
      .map((v) => {
        const question = questions.find((q) => q.id === parseInt(v));
        let val = values[v];
        if (val) {
          val =
            question.type === "option"
              ? [val]
              : question.type === "geo"
              ? [val.lat, val.lng]
              : val;
          return {
            question: parseInt(v),
            type: question.type,
            value: val,
            meta: question.meta,
          };
        }
        return false;
      })
      .filter((x) => x);
    const cascade = forms?.cascade?.administration || [];
    const names = answers
      .filter((x) => x.type !== "geo" && x.meta)
      .map((x) => {
        if (x.type === "cascade") {
          return parseCascade(cascade, x.value);
        }
        return x.value;
      })
      .flatMap((x) => x)
      .join(" - ");
    const geo = answers.find((x) => x.type === "geo" && x.meta)?.value;
    const administration = answers.find(
      (x) => x.type === "cascade" && x.meta
    )?.value;
    const data = {
      data: {
        administration: administration ? takeRight(administration)[0] : null,
        name: names,
        geo: geo || null,
      },
      answer: answers
        .map((x) => {
          if (x.type === "cascade") {
            return { ...x, value: takeRight(x.value)?.[0] || null };
          }
          return x;
        })
        .map((x) => pick(x, ["question", "value"])),
    };
    api
      .post(`form-data/${formId}`, data)
      .then(() => {
        notification.success({
          message: "Submitted",
        });
        setTimeout(() => {
          navigate("/control-center");
        }, 3000);
      })
      .catch(() => {
        notification.error({
          message: "Something went wrong",
        });
      });
  };

  const onChange = ({ progress }) => {
    setPercentage(progress.toFixed(0));
  };

  useEffect(() => {
    if (formId && loading) {
      api.get(`/web/form/${formId}`).then((x) => {
        setForms(x.data);
        setLoading(false);
      });
    }
  }, [formId, loading]);

  return (
    <div id="form">
      <Row justify="center">
        <Col span={24} className="webform">
          {loading || !formId ? (
            <PageLoader message="Fetching form.." />
          ) : (
            <>
              <Webform forms={forms} onFinish={onFinish} onChange={onChange} />
              <Progress className="progress-bar" percent={percentage} />
            </>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Forms;
