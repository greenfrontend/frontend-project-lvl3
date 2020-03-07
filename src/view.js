import { watch } from 'melanke-watchjs';
import _ from 'lodash';

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


export default (state, elements) => {
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
