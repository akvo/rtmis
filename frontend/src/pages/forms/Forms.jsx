import React, { useEffect, useState, useMemo } from "react";
import { Webform } from "akvo-react-form";
import "akvo-react-form/dist/index.css";
import "./style.scss";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Space, Progress, notification } from "antd";
import { api, store, uiText } from "../../lib";
import { takeRight, pick } from "lodash";
import { PageLoader, Breadcrumbs, DescriptionPanel } from "../../components";
import { useNotification } from "../../util/hooks";

const descriptionData = (
  <p>
    Please fill up the webform below with relevant responses. You will need to
    answer all mandatory questions before you can submit.
    <br />
    Once you have sumitted a webform, please do not forget to add it as part of
    a batch and send it for approval.
  </p>
);
const Forms = () => {
  const navigate = useNavigate();
  const { user: authUser } = store.useState((s) => s);
  const { formId } = useParams();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [percentage, setPercentage] = useState(0);
  const [submit, setSubmit] = useState(false);
  const { notify } = useNotification();
  const { language } = store.useState((s) => s);
  const { active: activeLang } = language;
  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const pagePath = [
    {
      title: "Control Center",
      link: "/control-center",
    },
    {
      title:
        authUser?.role?.value === "Data Entry Staff"
          ? authUser.name
          : "Manage Data",
      link:
        authUser?.role?.value === "Data Entry Staff"
          ? "/profile"
          : "/data/manage",
    },
    {
      title: forms.name,
    },
  ];

  const onFinish = (values) => {
    setSubmit(true);
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
    const names = answers
      .filter((x) => !["geo", "cascade"].includes(x.type) && x.meta)
      .map((x) => {
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
      .post(`form-pending-data/${formId}`, data)
      .then(() => {
        notification.success({
          message: "Submitted",
        });
        setTimeout(() => {
          navigate("/profile");
        }, 3000);
      })
      .catch(() => {
        notification.error({
          message: text.errorSomething,
        });
      })
      .finally(() => {
        setTimeout(() => {
          setSubmit(false);
        }, 2000);
      });
  };

  const onFinishFailed = ({ errorFields }) => {
    if (errorFields.length) {
      notify({
        type: "error",
        message: text.errorMandatoryFields,
      });
    }
  };

  const onChange = ({ progress }) => {
    setPercentage(progress.toFixed(0));
  };

  useEffect(() => {
    if (formId && loading) {
      api.get(`/form/web/${formId}`).then((x) => {
        setForms(x.data);
        setLoading(false);
      });
    }
  }, [formId, loading]);
  return (
    <div id="form">
      <Row justify="center">
        <Col span={24} className="webform">
          <Space>
            <Breadcrumbs pagePath={pagePath} description={descriptionData} />
          </Space>
          <DescriptionPanel description={descriptionData} />
          {loading || !formId ? (
            <PageLoader message={text.fetchingForm} />
          ) : (
            <Webform
              forms={forms}
              onFinish={onFinish}
              onCompleteFailed={onFinishFailed}
              onChange={onChange}
              submitButtonSetting={{ loading: submit }}
            />
          )}
          {(!loading || formId) && (
            <Progress className="progress-bar" percent={percentage} />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Forms;
