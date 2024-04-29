import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Webform } from "akvo-react-form";
import "akvo-react-form/dist/index.css";
import { v4 as uuidv4 } from "uuid";
import "./style.scss";
import { useParams, useNavigate } from "react-router-dom";
import {
  Row,
  Col,
  Space,
  Progress,
  Result,
  Button,
  notification,
  Modal,
} from "antd";
import axios from "axios";
import { api, config, store, uiText } from "../../lib";
import { takeRight, pick, isEmpty } from "lodash";
import { PageLoader, Breadcrumbs, DescriptionPanel } from "../../components";
import { useNotification } from "../../util/hooks";
import moment from "moment";

const Forms = () => {
  const navigate = useNavigate();
  const { user: authUser } = store.useState((s) => s);
  const { formId, uuid } = useParams();
  const [loading, setLoading] = useState(true);
  const [preload, setPreload] = useState(true);
  const [forms, setForms] = useState({});
  const [percentage, setPercentage] = useState(0);
  const [submit, setSubmit] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { notify } = useNotification();
  const { language, initialValue } = store.useState((s) => s);
  const { active: activeLang } = language;
  const [hiddenQIds, setHiddenQIds] = useState([]);

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const formType = window.forms.find(
    (x) => x.id === parseInt(formId)
  )?.type_text;

  const redirectToBatch =
    (formType === "National" && authUser.role.id === 2) ||
    (formType === "County" && authUser.role.id > 2);

  const pagePath = [
    {
      title: text.controlCenter,
      link: "/control-center",
    },
    {
      title: text.manageDataTitle,
      link: "/control-center/data",
    },
    {
      title: forms.name,
    },
  ];

  const webformRef = useRef();

  const getEntityByName = async ({ id, value, apiURL }) => {
    try {
      const { data: apiData } = await axios.get(apiURL);
      const findData = apiData?.find((d) => d?.name === value);
      return { id, value: findData?.id };
    } catch {
      return null;
    }
  };

  const onFinish = async ({ datapoint, ...values }, refreshForm) => {
    setSubmit(true);
    const questions = forms.question_group
      .map((x) => x.question)
      .flatMap((x) => x);
    const entityNamesEndpoints = questions
      ?.filter(
        (q) =>
          q?.type === "cascade" &&
          q?.extra?.type === "entity" &&
          typeof values?.[q?.id] === "string"
      )
      ?.map((q) => {
        const pq = questions.find((subq) => subq?.id === q?.extra?.parentId);
        const pv = values?.[pq?.id];
        const pid = Array.isArray(pv) ? pv.slice(-1)?.[0] : pv;
        return {
          id: q?.id,
          value: values?.[q?.id],
          apiURL: `${q?.api?.endpoint}${pid}`,
        };
      });
    const entityNames = entityNamesEndpoints?.map((e) => getEntityByName(e));
    const resEntities = await Promise.allSettled(entityNames);
    resEntities.forEach(({ value: entity }) => {
      if (entity?.value && values?.[entity?.id]) {
        values[entity.id] = entity.value;
      }
    });

    const answers = Object.keys(values)
      .filter((v) => !isNaN(v))
      .map((v) => {
        const qid = parseInt(v);
        // remove hidden question from final payload
        if (hiddenQIds.includes(qid)) {
          return false;
        }
        // EOL remove hidden question from final payload

        const question = questions.find((q) => q.id === qid);
        let val = values[v];
        if (val || val === 0) {
          val =
            question.type === "option"
              ? [val]
              : question.type === "geo"
              ? [val.lat, val.lng]
              : val;

          if (question.type === "cascade" && !question?.extra) {
            val = takeRight(val)?.[0] || null;
          }
          return {
            question: qid,
            type:
              question?.source?.file === "administrator.sqlite"
                ? "administration"
                : question.type,
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
      (x) => (x.type === "cascade" && x.meta) || x.type === "administration"
    )?.value;
    const dataPayload = {
      administration: administration
        ? Array.isArray(administration)
          ? takeRight(administration)[0]
          : administration
        : authUser.administration.id,
      name:
        datapoint?.name || names?.length
          ? names
          : `${authUser.administration.name} - ${moment().format("MMM YYYY")}`,
      geo: geo || null,
      submission_type: uuid
        ? config.submissionType.monitoring
        : config.submissionType.registration,
    };
    if (uuid) {
      dataPayload["uuid"] = uuid;
    }
    const data = {
      data: dataPayload,
      answer: answers.map((x) => pick(x, ["question", "value"])),
    };
    if (
      uuid &&
      ["Super Admin", "County Admin"].includes(authUser?.role?.value)
    ) {
      /**
       * Save uuid to localStorage to prevent redirection to the same page after submitted data
       */
      window?.localStorage?.setItem("submitted", uuid);
    }
    api
      .post(`form-pending-data/${formId}`, data)
      .then(() => {
        if (uuid) {
          /**
           * reset initial value
           */
          store.update((s) => {
            s.initialValue = [];
          });
        }
        if (refreshForm) {
          refreshForm();
        }
        setHiddenQIds([]);
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

  const getCascadeAnswerId = useCallback(
    async (id, questonAPI, value) => {
      const { initial, endpoint } = questonAPI;
      if (initial) {
        const cascadeID = value || initial;
        const res = await fetch(
          `${window.location.origin}${endpoint}/${cascadeID}`
        );
        const apiData = await res.json();
        if (endpoint.includes("administration")) {
          const parents = apiData?.path?.split(".");
          const startLevel = authUser?.administration?.level;
          return {
            [id]: [...parents, apiData?.id]
              .filter((a) => a !== "" && a !== "1")
              .map((a) => parseInt(a, 10))
              .slice(startLevel),
          };
        }
        return { [id]: [apiData?.id] };
      }
      const res = await fetch(window.location.origin + endpoint);
      const apiData = await res.json();
      const findCascade = apiData?.find((d) => d?.name === value);
      return {
        [id]: findCascade ? [findCascade.id] : [],
      };
    },
    [authUser?.administration?.level]
  );

  const transformValue = (type, value) => {
    if (type === "option" && Array.isArray(value) && value.length) {
      return value[0];
    }
    if (type === "geo" && Array.isArray(value) && value.length === 2) {
      const [lat, lng] = value;
      return { lat, lng };
    }
    return typeof value === "undefined" ? "" : value;
  };

  const fetchInitialMonitoringData = useCallback(
    async (response) => {
      try {
        const { data: apiData } = response;
        const questions = apiData?.question_group?.flatMap(
          (qg) => qg?.question
        );
        const res = await fetch(
          `${window.location.origin}/datapoints/${uuid}.json`
        );
        const { answers } = await res.json();
        /**
         * Transform cascade answers
         */
        const cascadeAPIs = questions
          ?.filter(
            (q) =>
              q?.type === "cascade" &&
              q?.extra?.type !== "entity" &&
              q?.api?.endpoint
          )
          ?.map((q) => getCascadeAnswerId(q.id, q.api, answers?.[q.id]));
        const cascadeResponses = await Promise.allSettled(cascadeAPIs);
        const cascadeValues = cascadeResponses
          .filter(({ status }) => status === "fulfilled")
          .map(({ value }) => value)
          .reduce((prev, curr) => {
            const [key, value] = Object.entries(curr)[0];
            prev[key] = value;
            return prev;
          }, {});
        /**
         * Transform answers to Webform format
         */
        const submissionType = uuid ? "monitoring" : "registration";
        const initialValue = questions
          .map((q) => {
            let value = Object.keys(cascadeValues).includes(`${q?.id}`)
              ? cascadeValues[q.id]
              : transformValue(q?.type, answers?.[q.id]);
            // set default answer by default_value for new_or_monitoring question
            if (
              q?.default_value &&
              q?.default_value?.submission_type?.monitoring
            ) {
              value = q.default_value.submission_type.monitoring;
            }
            // EOL set default answer by default_value for new_or_monitoring question

            // remove hidden question init value
            if (
              q?.hidden?.submission_type &&
              !isEmpty(q?.hidden?.submission_type) &&
              q.hidden.submission_type.includes(submissionType)
            ) {
              return false;
            }
            // EOL remove hidden question init value

            return {
              question: q?.id,
              value: value,
            };
          })
          .filter((x) => x);
        store.update((s) => {
          s.initialValue = initialValue;
        });
      } catch (error) {
        Modal.error({
          title: text.updateDataError,
          content: String(error),
        });
      }
    },
    [getCascadeAnswerId, uuid, text.updateDataError]
  );

  useEffect(() => {
    if (isEmpty(forms) && formId) {
      api.get(`/form/web/${formId}`).then((res) => {
        let defaultValues = [];
        const submissionType = uuid ? "monitoring" : "registration";
        const questionGroups = res.data.question_group.map((qg) => {
          const questions = qg.question
            .map((q) => {
              let qVal = { ...q };
              // set initial value for new_or_monitoring question
              if (
                q?.default_value &&
                q?.default_value?.submission_type?.registration &&
                !uuid
              ) {
                defaultValues = [
                  ...defaultValues,
                  {
                    question: q.id,
                    value: q.default_value.submission_type.registration,
                  },
                ];
              }
              if (!uuid && q?.meta_uuid) {
                defaultValues = [
                  ...defaultValues,
                  {
                    question: q.id,
                    value: uuidv4(),
                  },
                ];
              }
              // eol set initial value for new_or_monitoring question

              // set disabled new_or_monitoring question
              if (
                q?.default_value &&
                !isEmpty(q?.default_value?.submission_type)
              ) {
                qVal = {
                  ...qVal,
                  disabled: true,
                };
              }
              // eol set disabled new_or_monitoring question

              // support disabled question by submission type
              if (
                q?.disabled?.submission_type &&
                !isEmpty(q?.disabled?.submission_type)
              ) {
                qVal = {
                  ...qVal,
                  disabled: q.disabled.submission_type.includes(submissionType),
                };
              }
              // EOL support disabled question by submission type

              // support hidden question by submission type
              if (
                q?.hidden?.submission_type &&
                !isEmpty(q?.hidden?.submission_type)
              ) {
                const hidden =
                  q.hidden.submission_type.includes(submissionType);
                if (hidden) {
                  setHiddenQIds((prev) => [...new Set([...prev, q.id])]);
                }
                qVal = {
                  ...qVal,
                  hidden: hidden,
                };
              }
              // EOL support hidden question by submission type

              if (q?.extra) {
                delete qVal.extra;
                qVal = {
                  ...qVal,
                  ...q.extra,
                };
                if (q.extra?.allowOther) {
                  qVal = {
                    ...qVal,
                    allowOtherText: "Enter any OTHER value",
                  };
                }
                if (qVal?.type === "entity") {
                  qVal = {
                    ...qVal,
                    type: "cascade",
                    extra: q?.extra,
                  };
                }
              }
              return qVal;
            })
            .filter((x) => !x?.hidden); // filter out hidden questions
          return {
            ...qg,
            question: questions,
          };
        });
        setForms({ ...res.data, question_group: questionGroups });
        // INITIAL VALUE FOR NEW DATA
        if (defaultValues.length) {
          setTimeout(() => {
            store.update((s) => {
              s.initialValue = defaultValues;
            });
          }, 1000);
        }
        // INITIAL VALUE FOR MONITORING
        if (uuid) {
          fetchInitialMonitoringData(res);
        }
        // EOL INITIAL VALUE FOR MONITORING
        setLoading(false);
      });
    }
    if (uuid && window?.localStorage?.getItem("submitted")) {
      /**
       * Redirect to the list when localStorage already has submitted item
       */
      window.localStorage.removeItem("submitted");
      navigate("/control-center/data");
    }
    if (
      typeof webformRef?.current === "undefined" &&
      uuid &&
      initialValue?.length &&
      !loading
    ) {
      setPreload(true);
      setLoading(true);
    }

    if (
      webformRef?.current &&
      typeof webformRef?.current?.getFieldsValue()?.[0] === "undefined" &&
      uuid &&
      initialValue?.length
    ) {
      setTimeout(() => {
        initialValue.forEach((v) => {
          webformRef.current.setFieldsValue({ [v?.question]: v?.value });
        });
      }, 1000);
    }
  }, [
    formId,
    uuid,
    forms,
    loading,
    initialValue,
    navigate,
    fetchInitialMonitoringData,
  ]);

  const handleOnClearForm = useCallback((preload, initialValue) => {
    if (
      preload &&
      initialValue.length === 0 &&
      typeof webformRef?.current?.resetFields === "function"
    ) {
      setPreload(false);
      webformRef.current.resetFields();
      webformRef.current;
    }
  }, []);

  useEffect(() => {
    handleOnClearForm(preload, initialValue);
  }, [handleOnClearForm, preload, initialValue]);

  return (
    <div id="form">
      <div className="description-container">
        <Row justify="center" gutter={[16, 16]}>
          <Col span={24} className="webform">
            <Space>
              <Breadcrumbs
                pagePath={pagePath}
                description={text.formDescription}
              />
            </Space>
            <DescriptionPanel description={text.formDescription} />
          </Col>
        </Row>
      </div>

      <div className="table-section">
        <div className="table-wrapper">
          {loading || isEmpty(forms) ? (
            <PageLoader message={text.fetchingForm} />
          ) : (
            !showSuccess && (
              <Webform
                formRef={webformRef}
                forms={forms}
                onFinish={onFinish}
                onCompleteFailed={onFinishFailed}
                onChange={onChange}
                submitButtonSetting={{ loading: submit }}
                languagesDropdownSetting={{
                  showLanguageDropdown: false,
                }}
                initialValue={initialValue}
              />
            )
          )}
          {(!loading || !isEmpty(forms)) && !showSuccess && (
            <Progress className="progress-bar" percent={percentage} />
          )}
          {!loading && showSuccess && (
            <Result
              status="success"
              title={text?.formSuccessTitle}
              subTitle={
                redirectToBatch
                  ? text?.formSuccessSubTitle
                  : text?.formSuccessSubTitleForAdmin
              }
              extra={[
                <Button
                  type="primary"
                  key="back-button"
                  onClick={() => setShowSuccess(false)}
                >
                  {text.newSubmissionBtn}
                </Button>,
                !redirectToBatch ? (
                  <Button
                    key="manage-button"
                    onClick={() => navigate("/control-center/data")}
                  >
                    {text.finishSubmissionBtn}
                  </Button>
                ) : (
                  <Button
                    key="batch-button"
                    onClick={() => navigate("/control-center/data/submissions")}
                  >
                    {text.finishSubmissionBatchBtn}
                  </Button>
                ),
              ]}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Forms;
