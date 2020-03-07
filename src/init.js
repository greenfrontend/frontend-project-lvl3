// реализовать добавление rss потока

// валидировать по мере набора текста (красная рамка, кнопка disabled):
// - валидность адреса
// - дубли (если урл уже есть в списке фидов, то он не проходит валидацию)

// состояния:
// 'ввод'
// 'поток добавлен' (форма принимает первоначальный вид (очищается инпут),
// а в список потоков добавляется новый)

// список (выводится заголовок (title) и описание (description) из RSS)
// Кроме того, на странице должен быть список постов, загруженных из каждого потока.
// Он заполняется после успешного добавления нового потока.
// Каждый элемент в этом списке представляет из себя ссылку на пост,
// где текст ссылки - название поста.

// Domain data — данные приложения, которые нужно отображать, использовать и модифицировать.
// Например, список пользователей, загруженный с сервера.
// App state — данные, определяющие поведение приложения. Например, текущий открытый URL.
// UI state — данные, определяющие то, как выглядит UI. Например, вывод списка в плиточном виде.

// обработчики это то место, где выполняются AJAX-запросы

// функция render, которая принимает на вход состояние и меняет DOM на его основе.
// Этот момент ключевой. Изменение DOM может происходить только внутри функции render.
// Весь остальной код может менять только состояние.

// Изменение активности кнопки, блокирование элементов,
// отображение спиннеров — всё это следствия каких-то процессов.
// Возникает событие => Меняется состояние => Обновляется DOM

import axios from 'axios';
import * as yup from 'yup';
import { watch } from 'melanke-watchjs';
import _ from 'lodash';

const schema = yup.string().url();

const corsApi = 'https://cors-anywhere.herokuapp.com/';
const exampleUrl = 'https://www.smashingmagazine.com/feed';

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

const updateValidationState = (state) => {
  const errors = validate(state.form.fields, state.feedList);
  // eslint-disable-next-line no-param-reassign
  state.form.errors = errors;
  // eslint-disable-next-line no-param-reassign
  state.form.valid = _.isEqual(errors, {});
};

const parse = (xmlData) => {
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(xmlData, 'text/xml');

  const feedTitleNode = doc.querySelector('title');
  const title = feedTitleNode.textContent;

  const feedDescriptionNode = doc.querySelector('description');
  const description = feedDescriptionNode.textContent;

  const extractPostData = (post) => {
    const titleNode = post.querySelector('title');
    const linkNode = post.querySelector('link');

    return {
      title: titleNode.textContent,
      link: linkNode.textContent,
    };
  };

  const postsNodes = doc.querySelectorAll('item');
  const posts = [...postsNodes].map(extractPostData);

  const result = {
    title,
    description,
    posts,
  };

  return result;
};

const createPost = (title, href) => {
  const li = document.createElement('li');
  const a = document.createElement('a');
  const linkText = document.createTextNode(title);
  a.setAttribute('href', href);
  a.setAttribute('target', '_blank');
  a.appendChild(linkText);
  li.appendChild(a);
  return li;
};

const createPosts = (posts) => {
  if (posts.lenght === 0) {
    return '';
  }
  const ul = document.createElement('ul');
  ul.classList.add('list-unstyled');
  posts.forEach(({ title, link }) => {
    const post = createPost(title, link);
    ul.appendChild(post);
  });
  return ul;
};

const createFeed = ({ title, description, posts }) => {
  const section = document.createElement('section');
  const titleElement = document.createElement('h3');
  titleElement.textContent = title;
  const descriptionElement = document.createElement('small');
  descriptionElement.classList.add('text-muted');
  descriptionElement.textContent = description;
  titleElement.appendChild(descriptionElement);
  const postsElement = createPosts(posts);
  section.appendChild(titleElement);
  section.appendChild(postsElement);
  return section;
};

export default () => {
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

  elements.rssHelp.addEventListener('click', () => {
    state.form.fields.url = exampleUrl;
    state.form.processState = 'filling';
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
        const id = _.uniqueId('feed');
        state.feedList = [...state.feedList, { id, url }];
        state.feedData = {
          ...state.feedData,
          [id]: { id, url, ...parsedData },
        };
        state.form.processState = 'finished';
        state.form.fields.url = '';
      })
      .catch((err) => {
        state.form.errors = {
          network: 'Network Problems. Try again later.',
        };
        state.form.processState = 'filling';
        throw err;
      });
  });

  watch(state, 'feedData', () => {
    elements.feeds.innerHTML = '';
    const feeds = Object.keys(state.feedData);
    feeds.forEach((id) => {
      const feed = createFeed(state.feedData[id]);
      elements.feeds.appendChild(feed);
    });
  });

  watch(state.form.fields, 'url', () => {
    elements.input.value = state.form.fields.url;
    elements.input.classList.remove('is-invalid');
  });

  watch(state.form, 'errors', () => {
    const { url } = state.form.fields;
    const urlErrorMessages = Object.values(state.form.errors);
    const errorMessage = _.head(urlErrorMessages);
    const errorElement = elements.input.nextElementSibling;
    if (errorElement) {
      elements.input.classList.remove('is-invalid');
      errorElement.remove();
    }
    if (!errorMessage || url === '') {
      return;
    }
    const feedbackElement = document.createElement('div');
    feedbackElement.classList.add('invalid-feedback');
    feedbackElement.innerHTML = errorMessage;
    elements.input.classList.add('is-invalid');
    elements.input.after(feedbackElement);
  });

  watch(state.form, 'valid', () => {
    const { valid } = state.form;
    elements.button.disabled = !valid;
    if (valid) {
      elements.input.classList.add('is-valid');
    } else {
      elements.input.classList.remove('is-valid');
    }
  });

  watch(state.form, 'processState', () => {
    const { processState } = state.form;
    switch (processState) {
      case 'filling': {
        elements.button.disabled = false;
        break;
      }
      case 'processing': {
        elements.button.disabled = true;
        break;
      }
      case 'finished': {
        elements.input.value = '';
        elements.input.classList.remove('is-valid');
        break;
      }
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  });
};
