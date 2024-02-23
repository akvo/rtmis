import * as Yup from 'yup';
import { i18n } from '../../lib';

const intersection = (array1, array2) => {
  const set1 = new Set(array1);
  const result = [];
  for (const item of array2) {
    if (set1.has(item)) {
      result.push(item);
    }
  }
  return result;
};

const getDependencyAncestors = (questions, current, dependencies) => {
  const ids = dependencies.map((x) => x.id);
  const ancestors = questions.filter((q) => ids.includes(q.id)).filter((q) => q?.dependency);
  if (ancestors.length) {
    dependencies = ancestors.map((x) => x.dependency);
    current = [current, ...dependencies].flatMap((x) => x);
    ancestors.forEach((a) => {
      if (a?.dependency) {
        current = getDependencyAncestors(questions, current, a.dependency);
      }
    });
  }
  return current;
};

export const transformForm = (forms, lang = 'en', filterMonitoring = false) => {
  const nonEnglish = lang !== 'en';
  if (nonEnglish) {
    forms = i18n.transform(lang, forms);
  }

  const questions = forms.question_group
    .map((x) => {
      return x.question;
    })
    .flatMap((q) => q)
    .map((q) => (nonEnglish ? i18n.transform(lang, q) : q))
    .map((q) => {
      if (q.type === 'option' || q.type === 'multiple_option') {
        const options = q.option.map((o) => {
          return nonEnglish ? i18n.transform(lang, o) : o;
        });
        return {
          ...q,
          option: options.sort((a, b) => a.order - b.order),
        };
      }
      if (q?.tooltip) {
        const transTooltip = nonEnglish ? i18n.transform(lang, q.tooltip) : q.tooltip;
        return {
          ...q,
          tooltip: transTooltip,
        };
      }
      return q;
    });

  const filteredQuestions = filterMonitoring ? questions.filter((q) => q.monitoring) : questions;

  const transformed = filteredQuestions.map((x) => {
    let requiredSignTemp = x?.requiredSign || null;
    if (x?.required && !x?.requiredSign) {
      requiredSignTemp = '*';
    }
    if (x?.dependency) {
      return {
        ...x,
        requiredSign: requiredSignTemp,
        dependency: getDependencyAncestors(filteredQuestions, x.dependency, x.dependency),
      };
    }
    return {
      ...x,
      requiredSign: requiredSignTemp,
    };
  });

  return {
    ...forms,
    question_group: forms.question_group
      .sort((a, b) => a.order - b.order)
      .map((qg, qgi) => {
        let repeat = {};
        let repeats = {};
        if (qg?.repeatable) {
          repeat = { repeat: 1 };
          repeats = { repeats: [0] };
        }
        const translatedQg = nonEnglish ? i18n.transform(lang, qg) : qg;
        const transformedQuestions = qg.question
          ?.sort((a, b) => a.order - b.order)
          ?.map((q) => {
            return transformed.find((t) => t.id === q.id);
          })
          .filter((q) => q);

        if (transformedQuestions.length > 0) {
          return {
            ...translatedQg,
            ...repeat,
            ...repeats,
            id: qg?.id || qgi,
            question: transformedQuestions,
          };
        }
        return undefined;
      })
      .filter((qg) => qg),
  };
};

export const modifyDependency = ({ question }, { dependency }, repeat) => {
  const questions = question.map((q) => q.id);
  return dependency.map((d) => {
    if (questions.includes(d.id) && repeat) {
      return { ...d, id: `${d.id}-${repeat}` };
    }
    return d;
  });
};

export const validateDependency = (dependency, value) => {
  if (dependency?.options && typeof value !== 'undefined') {
    if (typeof value === 'string') {
      value = [value];
    }
    return intersection(dependency.options, value)?.length > 0;
  }
  let valid = false;
  if (dependency?.min) {
    valid = value >= dependency.min;
  }
  if (dependency?.max) {
    valid = value <= dependency.max;
  }
  if (dependency?.equal) {
    valid = value === dependency.equal;
  }
  if (dependency?.notEqual) {
    valid = value !== dependency.notEqual && !!value;
  }
  return valid;
};

export const generateValidationSchemaFieldLevel = async (currentValue, field) => {
  const { label, type, required, rule, hidden } = field;
  let yupType;
  switch (type) {
    case 'number':
      // number rules
      const isEmpyCurrentValue = currentValue === '';
      yupType = isEmpyCurrentValue ? Yup.string() : Yup.number();
      if (!isEmpyCurrentValue && rule?.min) {
        yupType = yupType.min(rule.min);
      }
      if (!isEmpyCurrentValue && rule?.max) {
        yupType = yupType.max(rule.max);
      }
      if (!isEmpyCurrentValue && !rule?.allowDecimal) {
        // by default decimal is allowed
        yupType = yupType.integer();
      }
      break;
    case 'date':
      yupType = Yup.date();
      break;
    case 'option':
      yupType = Yup.array();
      break;
    case 'multiple_option':
      yupType = Yup.array();
      break;
    case 'cascade':
      yupType = Yup.array();
      break;
    case 'geo':
      yupType = Yup.array();
      break;
    default:
      yupType = Yup.string();
      break;
  }
  if (required && !hidden) {
    const requiredError = `${label} is required.`;
    yupType = yupType.required(requiredError);
  }
  try {
    await yupType.validateSync(currentValue);
    return {
      [field?.id]: true,
    };
  } catch (error) {
    return {
      [field?.id]: error.message,
    };
  }
};

export const generateDataPointName = (forms, currentValues, cascades = {}) => {
  const dataPointNameValues = forms?.question_group?.length
    ? forms.question_group
        .filter((qg) => !qg?.repeatable)
        .flatMap((qg) => qg.question.filter((q) => q?.meta))
        ?.map((q) => {
          const defaultValue = currentValues?.[q.id] || null;
          const value = q.type === 'cascade' ? cascades?.[q.id] || defaultValue : defaultValue;
          return { id: q.id, type: q.type, value };
        })
    : [];

  const dpName = dataPointNameValues
    .filter((d) => d.type !== 'geo' && (d.value || d.value === 0))
    .map((x) => x.value)
    .join(' - ');
  const [lat, lng] = dataPointNameValues.find((d) => d.type === 'geo')?.value || [];
  const dpGeo = lat && lng ? `${lat}|${lng}` : null;
  return { dpName, dpGeo };
};

export const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

export const getDurationInMinutes = (startTime) => {
  // Get the current timestamp in seconds
  const endTime = getCurrentTimestamp();
  // Calculate the duration in seconds
  const durationInSeconds = endTime - startTime;

  return Math.floor(durationInSeconds / 60);
};

export const onFilterDependency = (currentGroup, values, q) => {
  if (q?.dependency) {
    const modifiedDependency = modifyDependency(currentGroup, q, 0);
    const unmatches = modifiedDependency
      .map((x) => {
        return validateDependency(x, values?.[x.id]);
      })
      .filter((x) => x === false);
    if (unmatches.length) {
      return false;
    }
  }
  return q;
};

export const transformMonitoringData = (formDataJson, inputData) => {
  const formData = JSON.parse(formDataJson.json);
  const isCascadeType = (id) => {
    return formData.question_group.some((group) =>
      group.question.some((question) => question.id === id && question.type === 'cascade'),
    );
  };

  const transformedInputData = {};
  Object.entries(inputData).forEach(([key, value]) => {
    const questionId = parseInt(key, 10);

    if (isCascadeType(questionId)) {
      transformedInputData[key] = Array.isArray(value) ? value : [value];
    } else {
      transformedInputData[key] = typeof value === 'number' ? value.toString() : value;
    }
  });

  return transformedInputData;
};
