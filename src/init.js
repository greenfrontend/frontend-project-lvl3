import Example from './Example';

export default () => {
  const element = document.getElementById('app');
  const obj = new Example(element);
  obj.init();
};
