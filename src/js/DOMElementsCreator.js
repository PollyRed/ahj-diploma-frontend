export default class DOMElementsCreator {
  static createDateElement(dateString) {
    const dateElement = document.createElement('div');
    dateElement.classList.add('post-date');
    dateElement.textContent = (dateString !== undefined)
      ? dateString
      : DOMElementsCreator.getCurrentDateTime();

    return dateElement;
  }

  static createDownloadElement() {
    const downloadElement = document.createElement('div');
    downloadElement.classList.add('download-file');
    downloadElement.classList.add('icon');

    return downloadElement;
  }

  static createImageElement(file, name) {
    const imageElement = document.createElement('img');
    imageElement.classList.add('post-image');
    imageElement.classList.add('media');
    imageElement.src = file;
    imageElement.textContent = name;
    imageElement.dataset.name = name;

    return imageElement;
  }

  static createVideoElement(file, name) {
    const videoElement = document.createElement('video');
    videoElement.classList.add('post-video');
    videoElement.classList.add('media');
    videoElement.src = file;
    videoElement.controls = 'controls';
    videoElement.textContent = name;
    videoElement.dataset.name = name;

    return videoElement;
  }

  static createAudioElement(file, name) {
    const audioElement = document.createElement('audio');
    audioElement.classList.add('post-audio');
    audioElement.classList.add('media');
    audioElement.src = file;
    audioElement.controls = 'controls';
    audioElement.textContent = name;
    audioElement.dataset.name = name;

    return audioElement;
  }

  static createTextElement(text) {
    const textElement = document.createElement('div');
    textElement.classList.add('post-text');
    textElement.innerHTML = DOMElementsCreator.makeClickableLinks(text.replace(/\n/g, '<br />'));

    return textElement;
  }

  static createPostElement(postData) {
    const postElement = document.createElement('div');
    postElement.classList.add('post');
    postElement.append(this.createDateElement(postData.dateString));

    let postContentElement = null;

    if (postData.type.match(/image/)) {
      postContentElement = DOMElementsCreator.createImageElement(postData.file, postData.name);
      postElement.append(DOMElementsCreator.createDownloadElement());
    } else if (postData.type.match(/video/)) {
      postContentElement = DOMElementsCreator.createVideoElement(postData.file, postData.name);
      postElement.append(DOMElementsCreator.createDownloadElement());
    } else if (postData.type.match(/audio/)) {
      postContentElement = DOMElementsCreator.createAudioElement(postData.file, postData.name);
      postElement.append(DOMElementsCreator.createDownloadElement());
    } else {
      postContentElement = DOMElementsCreator.createTextElement(postData.message);
    }

    postElement.append(postContentElement);

    return postElement;
  }

  static getCurrentDateTime() {
    const date = new Date();
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString().slice(0, -3)}`;
  }

  static makeClickableLinks(text) {
    return text.replace(/(https?:\/\/[^\s]+)/g, "<a href='$1'>$1</a>");
  }
}
