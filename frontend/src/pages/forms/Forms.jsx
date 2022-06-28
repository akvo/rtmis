import React, { useEffect, useState, useMemo } from "react";
import { Webform } from "akvo-react-form";
import "akvo-react-form/dist/index.css";
import "./style.scss";
import { useParams, useNavigate } from "react-router-dom";
import { Row, Col, Space, Progress, Result, Button, notification } from "antd";
import { api, store, uiText } from "../../lib";
import { takeRight, pick } from "lodash";
import { PageLoader, Breadcrumbs, DescriptionPanel } from "../../components";
import { useNotification } from "../../util/hooks";
import { FormTour } from "./components";

const Forms = () => {
  const navigate = useNavigate();
  const { user: authUser } = store.useState((s) => s);
  const { formId } = useParams();
  const [loading, setLoading] = useState(true);
  const [forms, setForms] = useState([]);
  const [percentage, setPercentage] = useState(0);
  const [submit, setSubmit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
        setTimeout(() => {
          setShowSuccess(true);
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
      <Row justify="center" gutter={[16, 16]}>
        <Col span={24} className="webform">
          <Space>
            <Breadcrumbs
              pagePath={pagePath}
              description={text.formDescription}
            />
          </Space>
          <DescriptionPanel description={text.formDescription} />
          {loading || !formId ? (
            <PageLoader message={text.fetchingForm} />
          ) : (
            !showSuccess && (
              <Webform
                forms={forms}
                onFinish={onFinish}
                onCompleteFailed={onFinishFailed}
                onChange={onChange}
                submitButtonSetting={{ loading: submit }}
              />
            )
          )}
          {(!loading || formId) && !showSuccess && (
            <Progress className="progress-bar" percent={percentage} />
          )}
          {!loading && showSuccess && (
            <Result
              status="success"
              title={text?.formSuccessTitle}
              subTitle={
                authUser?.role?.id === 1
                  ? text?.formSuccessSubTitleForAdmin
                  : text?.formSuccessSubTitle
              }
              extra={[
                <Button
                  key="back-button"
                  type="primary"
                  onClick={() => setShowSuccess(false)}
                >
                  Add New Submission
                </Button>,
                !authUser?.role?.id === 1 && (
                  <Button
                    key="profile-button"
                    onClick={() => navigate("/data/uploads")}
                  >
                    Finish and Go to Batch
                  </Button>
                ),
              ]}
            />
          )}
        </Col>
      </Row>
    </div>
  );
};

export default Forms;
