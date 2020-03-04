// реализовать добавление rss потока

// валидировать по мере набора текста (красная рамка, кнопка disabled):
// - валидность адреса
// - дубли (если урл уже есть в списке фидов, то он не проходит валидацию)

// состояния:
// 'ввод'
// 'поток добавлен' (форма принимает первоначальный вид (очищается инпут), а в список потоков добавляется новый)

// список (выводится заголовок (title) и описание (description) из RSS)
// Кроме того, на странице должен быть список постов, загруженных из каждого потока.
// Он заполняется после успешного добавления нового потока.
// Каждый элемент в этом списке представляет из себя ссылку на пост, где текст ссылки - название поста.

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

// https://www.smashingmagazine.com/feed

import axios from 'axios';
import * as yup from 'yup'
const schema = yup.string().url();
import { watch } from 'melanke-watchjs';

// validateUrl(feedUrl).then(c => console.log(c))
const validateUrl = (url) => schema.isValid(url);

// const wasAddedBefore = !!state.lists.find(({ name }) => name.toLowerCase() === value.toLowerCase());
const validateFeed = (feeds, feed) => feeds.includes(feed);

const parse = (xmlData) => {
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(xmlData, 'text/xml');

  const feedTitleNode = doc.querySelector('title');
  const feedTitle = feedTitleNode.textContent;

  const feedDescriptionNode = doc.querySelector('description');
  const feedDescription = feedDescriptionNode.textContent;

  const extractPostData = (post) => {
    const titleNode = post.querySelector('title');
    const linkNode = post.querySelector('link');

    return {
      title: titleNode.textContent,
      link: linkNode.textContent,
    }
  };

  const postsNodes = doc.querySelectorAll('item');
  const posts = [...postsNodes].map(extractPostData);

  const result = {
    feedTitle,
    feedDescription,
    posts
  };

  return result;
};

export default () => {
  const corsApi = 'https://cors-anywhere.herokuapp.com/';
  const feedUrl = 'https://www.smashingmagazine.com/feed';

  axios.get(`${corsApi}${feedUrl}`)
    .then((resp) => {
      console.log(parse(resp.data))
    })
};

// Возникает событие => Меняется состояние => Обновляется DOM
// TODO: make spinner!

const state = {
  processState: 'waiting',  //  waiting | filling | processing
  validationState: 'valid', //  valid   | invalid
  errors: [],
  inputValue: '',
  feedList: [],
  feedData: {},
};

watch(state, 'processState', () => {
  console.log(state.processState)
  switch (state.processState) {
    case 'waiting': {
      elements.button.disabled = true;
      break;
    }
    case 'filling': {
      if (state.validationState === 'valid') {
        elements.input.classList.add('is-valid');
      } else {
        elements.input.classList.add('is-invalid');
      }
      elements.button.disabled = state.validationState === 'invalid';
      break;
    }
    case 'processing': {
      elements.button.disabled = true;
      break;
    }
    default:
      throw new Error(`Unknown state: ${state.processState}`);
  }
});

const elements = {
  input: document.getElementById('rss'),
  button: document.getElementById('submitButton'),
  form: document.getElementById('form')
};

elements.input.addEventListener('input', (e) => {
  const url = e.target.value.trim();
  if (url.length > 0) {
    state.processState = 'filling';
    validateUrl(url).then((result) => {
      if (result) {
        state.validationState = 'valid'
      } else {
        state.validationState = 'invalid'
      }
    })
  } else {
    state.processState = 'waiting';
  }
});
