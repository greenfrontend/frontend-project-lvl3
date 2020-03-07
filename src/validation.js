import _ from 'lodash';
import * as yup from 'yup';

const schema = yup.string().url();

const errorMessages = {
  url: {
    valid: 'Value is not a valid url',
    addedBefore: 'URL was added before',
    empty: 'URL cannot be empty',
  },
};

const validate = (fields, feeds = []) => {
  const errors = {};
  const wasAddedBefore = !!feeds
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

export default (state) => {
  const errors = validate(state.form.fields, state.feedList);
  state.form.errors = errors;
  state.form.valid = _.isEqual(errors, {});
};
