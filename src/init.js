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


// https://www.smashingmagazine.com/feed

// import axios from 'axios';
import * as yup from 'yup';
import { watch } from 'melanke-watchjs';
import _ from 'lodash';

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

  if (fields.url.length === 0) {
    errors.empty = errorMessages.url.empty;
  }
  if (feeds.includes(fields.url)) {
    errors.addedBefore = errorMessages.url.addedBefore;
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

// const wasAddedBefore = !!state.lists.find(({ name })
// => name.toLowerCase() === value.toLowerCase());

// const validateFeed = (feeds, feed) => feeds.includes(feed);

// const parse = (xmlData) => {
//   const domParser = new DOMParser();
//   const doc = domParser.parseFromString(xmlData, 'text/xml');
//
//   const feedTitleNode = doc.querySelector('title');
//   const feedTitle = feedTitleNode.textContent;
//
//   const feedDescriptionNode = doc.querySelector('description');
//   const feedDescription = feedDescriptionNode.textContent;
//
//   const extractPostData = (post) => {
//     const titleNode = post.querySelector('title');
//     const linkNode = post.querySelector('link');
//
//     return {
//       title: titleNode.textContent,
//       link: linkNode.textContent,
//     };
//   };
//
//   const postsNodes = doc.querySelectorAll('item');
//   const posts = [...postsNodes].map(extractPostData);
//
//   const result = {
//     feedTitle,
//     feedDescription,
//     posts,
//   };
//
//   return result;
// };

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
  };

  elements.input.addEventListener('input', (e) => {
    const url = e.target.value.trim();
    state.form.fields.url = url;
    updateValidationState(state);
  });

  // const corsApi = 'https://cors-anywhere.herokuapp.com/';
  // const feedUrl = 'https://www.smashingmagazine.com/feed';
  //
  // axios.get(`${corsApi}${feedUrl}`)
  //   .then((resp) => {
  //     console.log(parse(resp.data));
  //   });

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
      default:
        throw new Error(`Unknown state: ${processState}`);
    }
  });
};
