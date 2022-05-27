import DOMElementsCreator from './DOMElementsCreator';

export default class DOMController {
  constructor() {
    this.chaosContent = document.querySelector('.chaos-content');
    this.fileInput = document.querySelector('.file-input');
    this.addFileButton = document.querySelector('.chaos-control__create-post-add');
    this.dragArea = document.querySelector('.drag__area');
    this.dragEventListener = this.dragEventListener.bind(this);

    this.ws = new WebSocket('ws://ahj22-diploma-backend.herokuapp.com');
  }

  init() {
    this.addListeners();
  }

  addListeners() {
    this.addSendButtonListener();
    this.addFileAddButtonListener();
    this.addDragoverEventListener();
    this.addDropEventListener();
    this.addWSOpenEventListener();
    this.addWSMessageEventListener();
  }

  addWSOpenEventListener() {
    this.ws.addEventListener('open', () => {
      this.askForAllPosts();
    });
  }

  addWSMessageEventListener() {
    this.ws.addEventListener('message', (event) => {
      this.restoreAllPosts(event.data);
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
      this.sendFile(file);
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
        this.sendFile(file);
      });
    });
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

  askForAllPosts() {
    const request = JSON.stringify(
      { event: 'getAllPosts' },
    );

    this.ws.send(request);
  }

  restoreAllPosts(data) {
    const initialPosts = JSON.parse(data).allPosts;

    for (const initialPost of initialPosts) {
      try {
        const postElement = DOMElementsCreator.createPostElement(initialPost);
        this.chaosContent.append(postElement);
      } catch (exception) {
        console.log(exception);
      }
    }

    const downloadButtons = Array.from(document.querySelectorAll('.download-file'));
    for (const downloadButton of downloadButtons) {
      downloadButton.addEventListener('click', DOMController.downloadEventListener);
    }
    this.chaosContent.scrollTop = this.chaosContent.scrollHeight;
  }

  sendFile(file) {
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
