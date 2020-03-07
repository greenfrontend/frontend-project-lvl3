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
import _ from 'lodash';
import view from './view';
import parse from './parse';
import updateValidationState from './validation';

const corsApi = 'https://cors-anywhere.herokuapp.com/';
const exampleUrl = 'https://www.smashingmagazine.com/feed';

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

  view(state, elements);
};
