import isEqual from 'lodash/isEqual';
import * as yup from 'yup';

const schema = yup.string().url();

const errorMessages = {
  url: {
    valid: 'validation.valid',
    addedBefore: 'validation.addedBefore',
    empty: 'validation.empty',
  },
};

const validate = (fields) => {
  const errors = {};
  const wasAddedBefore = !!fields.feeds
    .find(({ url }) => url.toLowerCase() === fields.url.toLowerCase());
  if (wasAddedBefore) {
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

export default (fields) => {
  const errors = validate(fields, errorMessages);
  const valid = isEqual(errors, {});
  return { errors, valid };
};
