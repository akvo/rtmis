import uiText from './ui-text';

const DEFAULT_LANG = 'en';

const transform = (lang, data) => {
  const {
    translations: transOption,
    label: labelText,
    name: nameText,
    form: formText,
    text: textValue,
  } = data || {};
  if (transOption) {
    const ft = transOption.find((t) => t?.language === lang);
    if (formText && ft) {
      return {
        ...data,
        form: ft.name,
      };
    }
    if (labelText && ft) {
      return {
        ...data,
        label: ft.name,
      };
    }
    if (!labelText && nameText && ft) {
      return {
        ...data,
        name: ft.name,
      };
    }
    if (textValue && ft) {
      return {
        ...data,
        text: ft.name,
      };
    }
  }
  return data;
};

const text = (lang) => uiText?.[lang] || uiText[DEFAULT_LANG];

const i18n = {
  transform,
  text,
};

export default i18n;
