import React, { useEffect, useMemo, useState } from "react";
import SubmissionEditing from "./SubmissionEditing";
import { api, store, uiText } from "../../lib";
import { isEqual, flatten } from "lodash";
import { useNotification } from "../../util/hooks";

const BatchDetail = ({
  expanded,
  setReload,
  deleting,
  handleDelete,
  editedRecord,
  setEditedRecord,
}) => {
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(null);
  const [rawValue, setRawValue] = useState(null);
  const [resetButton, setresetButton] = useState({});
  const { notify } = useNotification();
  const language = store.useState((s) => s.language);
  const { active: activeLang } = language;

  const text = useMemo(() => {
    return uiText[activeLang];
  }, [activeLang]);

  const questionGroups = window.forms
    .find((f) => f.id === expanded.form)
    ?.content?.question_group?.filter(
      (qg) =>
        qg.question?.length ===
        qg.question.filter((q) => !q?.display_only).length
    );

  useEffect(() => {
    if (questionGroups && dataLoading) {
      api
        .get(`pending-data/${expanded.id}`)
        .then((res) => {
          const data = questionGroups.map((qg) => {
            return {
              ...qg,
              question: qg.question
                .filter((item) => !item?.display_only)
                .map((q) => {
                  const findValue = res.data.find(
                    (d) => d.question === q.id
                  )?.value;
                  return {
                    ...q,
                    value: findValue || findValue === 0 ? findValue : null,
                    history:
                      res.data.find((d) => d.question === q.id)?.history ||
                      false,
                  };
                }),
            };
          });
          setRawValue({ ...expanded, data, loading: false });
        })
        .catch((e) => {
          console.error(e);
          setRawValue({ ...expanded, data: [], loading: false });
        })
        .finally(() => {
          setDataLoading(false);
        });
    }
  }, [expanded, questionGroups, dataLoading]);

  const handleSave = (data) => {
    setSaving(data.id);
    const formData = [];
    data.data.map((rd) => {
      rd.question.map((rq) => {
        if (
          (rq.newValue || rq.newValue === 0) &&
          !isEqual(rq.value, rq.newValue)
        ) {
          let value = rq.newValue;
          if (rq.type === "number") {
            value =
              parseFloat(value) % 1 !== 0 ? parseFloat(value) : parseInt(value);
          }
          formData.push({
            question: rq.id,
            value: value,
          });
          delete rq.newValue;
        }
      });
    });
    api
      .put(
        `form-pending-data/${expanded.form}?pending_data_id=${data.id}`,
        formData
      )
      .then(() => {
        setReload(data.id);
        const resetObj = {};
        formData.map((data) => {
          resetObj[data.question] = false;
        });
        setresetButton({ ...resetButton, ...resetObj });
        setEditedRecord({ ...editedRecord, [expanded.id]: false });
        notify({
          type: "success",
          message: text.successDataUpdated,
        });
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        setSaving(null);
      });
  };

  const updateCell = (key, parentId, value) => {
    setresetButton({ ...resetButton, [key]: true });
    let hasEdits = false;
    const data = rawValue.data.map((rd) => ({
      ...rd,
      question: rd.question.map((rq) => {
        if (rq.id === key && expanded.id === parentId) {
          if (isEqual(rq.value, value)) {
            if (rq.newValue) {
              delete rq.newValue;
            }
          } else {
            rq.newValue = value;
          }
          const edited = !isEqual(rq.value, value);
          if (edited && !hasEdits) {
            hasEdits = true;
          }
          return rq;
        }
        if (
          (rq.newValue || rq.newValue === 0) &&
          !isEqual(rq.value, rq.newValue) &&
          !hasEdits
        ) {
          hasEdits = true;
        }
        return rq;
      }),
    }));
    const hasNewValue = data.some((d) => {
      return d.question?.some((q) => {
        return typeof q.newValue !== "undefined";
      });
    });
    setEditedRecord({ ...editedRecord, [expanded.id]: hasNewValue });
    setRawValue({
      ...rawValue,
      data,
      edited: hasEdits,
    });
  };

  const resetCell = (key, parentId) => {
    const prev = JSON.parse(JSON.stringify(rawValue));
    let hasEdits = false;
    const data = prev.data.map((rd) => ({
      ...rd,
      question: rd.question.map((rq) => {
        if (rq.id === key && expanded.id === parentId) {
          delete rq.newValue;
          return rq;
        }
        if (
          (rq.newValue || rq.newValue === 0) &&
          !isEqual(rq.value, rq.newValue) &&
          !hasEdits
        ) {
          hasEdits = true;
        }
        return rq;
      }),
    }));
    /**
     * Check whether it still has newValue or not
     * in all groups of questions
     */
    const hasNewValue = data
      ?.flatMap((d) => d?.question)
      ?.find((q) => q?.newValue);
    setEditedRecord({ ...editedRecord, [expanded.id]: hasNewValue });
    setRawValue({
      ...prev,
      data,
      edited: hasEdits,
    });
  };

  const isEdited = () => {
    return (
      !!flatten(rawValue?.data?.map((g) => g.question))?.filter(
        (d) => (d.newValue || d.newValue === 0) && !isEqual(d.value, d.newValue)
      )?.length || false
    );
  };

  if (!rawValue) {
    return <div>{text.loadingText}</div>;
  }

  return (
    <SubmissionEditing
      expanded={rawValue}
      updateCell={updateCell}
      resetCell={resetCell}
      handleSave={handleSave}
      handleDelete={handleDelete}
      saving={saving}
      dataLoading={dataLoading}
      isEdited={isEdited}
      isEditable={true}
      deleting={deleting}
      resetButton={resetButton}
    />
  );
};

export default BatchDetail;
