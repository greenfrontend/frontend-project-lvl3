import isEqual from 'lodash/isEqual';
import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales';

i18next.init({
  lng: 'en',
  resources,
});

const schema = yup.string().url();

const errorMessages = {
  url: {
    valid: i18next.t('validation.valid'),
    addedBefore: i18next.t('validation.addedBefore'),
    empty: i18next.t('validation.empty'),
  },
};

const validate = (fields, feeds = []) => {
  const errors = {};
  if (feeds.includes(fields.url)) {
    errors.addedBefore = errorMessages.url.addedBefore;
  }
  if (fields.url.length === 0) {
    errors.empty = errorMessages.url.empty;
  }
  if (!schema.isValidSync(fields.url)) {
    errors.valid = errorMessages.url.valid;
  }
  return errors;
};

export default (state) => {
  const errors = validate(state.form.fields, state.feedList);
  state.form.errors = errors;
  state.form.valid = isEqual(errors, {});
};
