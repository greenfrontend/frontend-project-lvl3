import i18next from 'i18next';
import axios from 'axios';
import differenceBy from 'lodash/differenceBy';
import view from './view';
import parse from './parse';
import updateValidationState from './validation';
import resources from './locales';

const corsApi = 'https://cors-anywhere.herokuapp.com/';

const getNewPosts = (newPosts, oldPosts) => differenceBy(newPosts, oldPosts, 'link');
const addIdToPost = (id) => (post) => ({ ...post, feedId: id });
const makeFeed = (url, parsedData) => ({
  url,
  id: url,
  title: parsedData.title,
  description: parsedData.description,
});

export default () => {
  i18next.init({
    lng: 'en',
    resources,
  });

  const state = {
    form: {
      fields: {
        url: '',
      },
      processState: 'filling',
      valid: false,
      errors: {},
    },
    feeds: [],
    posts: [],
  };

  const makeUpdates = () => {
    const feedsUrls = state.feeds.map(({ url }) => `${corsApi}${url}`);
    const promises = feedsUrls.map(axios.get);

    Promise.all(promises).then((responses) => {
      const newData = responses.map((resp) => parse(resp.data));

      newData.forEach((newFeed, index) => {
        const oldFeed = state.feeds[index];
        const oldPosts = state.posts.filter(({ feedId }) => feedId === oldFeed.id);

        const newPosts = getNewPosts(newFeed.posts, oldPosts)
          .map(addIdToPost(oldFeed.id));

        state.posts = newPosts.concat(state.posts);
      });

      setTimeout(() => {
        makeUpdates();
      }, 5000);
    });
  };

  const planUpdates = () => makeUpdates();

  const validate = () => {
    const { errors, valid } = updateValidationState({
      ...state.form.fields,
      feeds: state.feeds,
    });
    state.form.errors = errors;
    state.form.valid = valid;
  };

  const elements = {
    input: document.getElementById('url'),
    button: document.getElementById('submitButton'),
    form: document.getElementById('form'),
    rssHelp: document.getElementById('rssHelp'),
    feeds: document.getElementById('feeds'),
  };

  elements.rssHelp.addEventListener('click', (e) => {
    e.preventDefault();
    state.form.processState = 'filling';
    state.form.fields.url = e.target.href;
    validate();
  });

  elements.input.addEventListener('input', (e) => {
    state.form.processState = 'filling';
    const url = e.target.value.trim();
    state.form.fields.url = url;
    validate();
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.form.processState = 'processing';
    const { url } = state.form.fields;

    axios.get(`${corsApi}${url}`)
      .then((resp) => {
        const parsedData = parse(resp.data);
        const feed = makeFeed(url, parsedData);
        state.feeds.push(feed);
        const feedPosts = parsedData.posts.map(addIdToPost(feed.id));
        state.posts.push(...feedPosts);

        state.form.processState = 'finished';
        state.form.fields.url = '';
        state.form.valid = false;

        const isUpdatesAlreadyPlanned = state.feeds.length < 2;
        if (isUpdatesAlreadyPlanned) {
          setTimeout(() => planUpdates(), 5000);
        }
      })
      .catch((err) => {
        state.form.errors = {
          network: 'errors.network',
        };
        state.form.processState = 'filling';
        throw err;
      });
  });

  view(state, elements);
};
