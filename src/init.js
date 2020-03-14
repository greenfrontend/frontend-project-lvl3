import i18next from 'i18next';
import axios from 'axios';
import differenceBy from 'lodash/differenceBy';
import view from './view';
import parse from './parse';
import updateValidationState from './validation';
import resources from './locales';

const corsApi = 'https://cors-anywhere.herokuapp.com/';

const getNewPosts = (newPosts, oldPosts) => differenceBy(newPosts, oldPosts, 'link');

let timeoutID = null;

const planUpdates = (appState) => {
  if (timeoutID) {
    clearTimeout(timeoutID);
  }

  timeoutID = setTimeout(() => makeUpdates(appState), 5000);
};

const makeUpdates = (appState) => {
  const feedsUrls = appState.feedList.map((feed) => `${corsApi}${feed}`);
  const promises = feedsUrls.map(axios.get);
  Promise.all(promises).then((responses) => {
    const newData = responses.map((resp) => parse(resp.data));
    newData.forEach((newFeed, index) => {
      const oldFeed = appState.feedData[appState.feedList[index]];
      const newPosts = getNewPosts(newFeed.posts, oldFeed.posts);
      appState.feedData[oldFeed.url].posts = [
        ...newPosts,
        ...oldFeed.posts,
      ];
    });
    planUpdates(appState);
  });
};

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
    feedList: [],
    feedData: {},
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
    state.form.valid = true;
    updateValidationState(state);
  });

  elements.input.addEventListener('input', (e) => {
    state.form.processState = 'filling';
    const url = e.target.value.trim();
    state.form.fields.url = url;
    updateValidationState(state);
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    state.form.processState = 'processing';
    const { url } = state.form.fields;

    axios.get(`${corsApi}${url}`)
      .then((resp) => {
        const parsedData = parse(resp.data);

        state.feedList = [...state.feedList, url];
        state.feedData = {
          ...state.feedData,
          [url]: { url, ...parsedData },
        };

        state.form.processState = 'finished';
        state.form.fields.url = '';
        state.form.valid = false;

        planUpdates(state);
      })
      .catch((err) => {
        state.form.errors = {
          network: i18next.t('errors.network'),
        };
        state.form.processState = 'filling';
        throw err;
      });
  });

  view(state, elements);
};
