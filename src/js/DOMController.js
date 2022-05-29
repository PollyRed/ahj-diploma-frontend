import DOMElementsCreator from './DOMElementsCreator';

export default class DOMController {
  constructor() {
    this.chaosContent = document.querySelector('.chaos-content');
    this.fileInput = document.querySelector('.file-input');
    this.addFileButton = document.querySelector('.chaos-control__create-post-add');
    this.addGeolocationButton = document.querySelector('.chaos-control__create-post-geo');
    this.dragArea = document.querySelector('.drag__area');
    this.dragEventListener = this.dragEventListener.bind(this);
    this.lastLoadedPostId = null;
    this.isStartLoad = true;
    this.isOnlineMode = true;
    this.geolocation = null;

    this.ws = new WebSocket('ws://ahj22-diploma-backend.herokuapp.com'); // 'ws://localhost:7070');
  }

  init() {
    this.addListeners();
  }

  addListeners() {
    this.addSendButtonListener();
    this.addFileAddButtonListener();
    this.addGeolocationButtonListener();
    this.addDragoverEventListener();
    this.addDropEventListener();
    this.addScrollEventListener();

    this.addWSOpenEventListener();
    this.addWSMessageEventListener();
    this.addWSErrorEventListener();
  }

  addScrollEventListener() {
    this.chaosContent.addEventListener('scroll', this.scrollEventListener.bind(this));
  }

  addWSOpenEventListener() {
    this.ws.addEventListener('open', () => {
      this.getAllPosts();
    });
  }

  addWSMessageEventListener() {
    this.ws.addEventListener('message', (event) => {
      this.restoreAllPosts(event.data);
    });
  }

  addWSErrorEventListener() {
    this.ws.addEventListener('error', () => {
      this.isOnlineMode = false;
    });
  }

  addDragoverEventListener() {
    document.addEventListener('dragover', this.dragEventListener);
  }

  addDropEventListener() {
    this.dragArea.addEventListener('drop', this.dragEventListener);
  }

  static downloadEventListener(event) {
    const post = event.target.closest('.post');
    const mediaContent = post.querySelector('.media');
    const link = document.createElement('a');
    link.href = mediaContent.src || mediaContent.href;
    link.download = mediaContent.dataset.name;
    link.click();
  }

  scrollEventListener() {
    this.getAdditionalPosts();
  }

  dragEventListener(event) {
    const { type } = event;
    event.preventDefault();
    const dragWrapper = this.dragArea.parentElement;
    if (type === 'dragover') {
      dragWrapper.classList.remove('hidden');
      dragWrapper.addEventListener('dragleave', this.drag);
      return;
    }

    if (type === 'dragleave') {
      dragWrapper.removeEventListener('dragleave', this.drag);
      dragWrapper.classList.add('hidden');
      return;
    }

    if (type === 'drop') {
      dragWrapper.removeEventListener('dragleave', this.drag);
      dragWrapper.classList.add('hidden');

      const file = event.dataTransfer.files[0];
      this.addFileElement(file);
      this.sendFilePost(file);
    }
  }

  addFileAddButtonListener() {
    this.addFileButton.addEventListener('click', (event) => {
      event.preventDefault();
      this.fileInput.dispatchEvent(new MouseEvent('click'));
      this.fileInput.addEventListener('change', (changeEvent) => {
        const { target } = changeEvent;

        const file = target.files.item(0);
        this.addFileElement(file);
        this.sendFilePost(file);
      });
    });
  }

  geolocationButtonListener(event) {
    event.preventDefault();
    const textArea = document.querySelector('.chaos-control__create-post-text');

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.geolocation = `Latitude: ${position.coords.latitude.toFixed(4)}, Longitude: ${position.coords.longitude.toFixed(4)}`;
          textArea.value += this.geolocation;
        },
        (error) => {
          alert(`Невозможно определить местоположение! Причина: ${error.message}`);
        },
      );
    } else {
      alert('Невозможно определить местоположение!');
    }
  }

  addGeolocationButtonListener() {
    this.addGeolocationButton.addEventListener('click', this.geolocationButtonListener.bind(this));
  }

  addFileElement(file) {
    const fileElement = DOMElementsCreator.createPostElement(
      {
        type: file.type,
        dateString: DOMElementsCreator.getCurrentDateTime(),
        file: URL.createObjectURL(file),
        name: file.name,
      },
    );

    fileElement.querySelector('.download-file')
      .addEventListener('click', DOMController.downloadEventListener);

    this.chaosContent.append(fileElement);
    this.chaosContent.scrollTop = this.chaosContent.scrollHeight;
  }

  addSendButtonListener() {
    const textArea = document.querySelector('.chaos-control__create-post-text');
    const sendButton = document.querySelector('.chaos-control__send-message');

    sendButton.addEventListener('click', (event) => {
      event.preventDefault();
      const textAreaValue = textArea.value;

      if (textAreaValue) {
        const currentDateString = DOMElementsCreator.getCurrentDateTime();

        this.chaosContent.append(DOMElementsCreator.createPostElement(
          {
            type: 'text',
            dateString: currentDateString,
            message: textAreaValue,
          },
        ));
        this.chaosContent.scrollTop = this.chaosContent.scrollHeight;
        textArea.value = '';

        this.sendTextPost(textAreaValue, currentDateString);
      }
    });

    textArea.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        sendButton.click();
        event.preventDefault();
      }
    });
  }

  sendTextPost(message, dateString) {
    this.ws.send(JSON.stringify(
      {
        event: 'addPost',
        post: {
          type: 'text',
          dateString,
          message,
        },
      },
    ));
  }

  getAllPosts() {
    const request = JSON.stringify(
      {
        event: 'getAllPosts',
        count: 10,
        lastId: this.lastLoadedPostId,
      },
    );

    this.ws.send(request);
  }

  getAdditionalPosts() {
    const lastPost = this.chaosContent.firstChild;
    const relativeTop = lastPost.getBoundingClientRect().top;

    if (relativeTop >= 0) {
      this.getAllPosts();
    }
  }

  restoreAllPosts(data) {
    const response = JSON.parse(data);
    const initialPosts = response.allPosts;

    if (response.event.match('botResponse')) {
      this.chaosContent.append(DOMElementsCreator.createPostElement(initialPosts[0]));
      this.chaosContent.scrollTop = this.chaosContent.scrollHeight;
      return;
    }

    this.lastLoadedPostId = initialPosts[0].id;
    for (const initialPost of initialPosts.reverse()) {
      try {
        const postElement = DOMElementsCreator.createPostElement(initialPost);
        this.chaosContent.prepend(postElement);

        const downloadButton = postElement.querySelector('.download-file');
        if (downloadButton !== null) {
          downloadButton.addEventListener('click', DOMController.downloadEventListener);
        }
      } catch (exception) {
        // skip post
      }
    }

    if (this.isStartLoad) {
      this.isStartLoad = false;
      this.chaosContent.scrollTop = this.chaosContent.scrollHeight;
    }
  }

  sendFilePost(file) {
    if (!file) return;
    let fileFormated = null;
    const fileType = file.type;

    const fr = new FileReader();
    fr.readAsDataURL(file);

    fr.onload = () => {
      fileFormated = fr.result;

      const sendingFilePost = JSON.stringify(
        {
          event: 'addFilePost',
          post: {
            dateString: DOMElementsCreator.getCurrentDateTime(),
            file: fileFormated,
            type: fileType,
            name: file.name,
          },
        },
      );

      this.ws.send(sendingFilePost);
    };
  }
}
