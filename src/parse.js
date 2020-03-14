export default (xmlData) => {
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
