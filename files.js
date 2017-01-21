var title = document.querySelector('#title')
var titleDisabled = document.querySelector('#title-disabled');

(function() {
var doc = window.editor;

function FileSystem(doc) {
  
  var dataString = localStorage.getItem('docsData');
  if(dataString) {
    this.docsData = JSON.parse(dataString);
    console.log(this.docsData)
  } else {
    this.docsData = [];
  }
  
  if(this.docsData[0]) {
    this.openFile = this.docsData[0];
  } else {
    this.openFile = {
      'title': 'untitled',
      'extension': '.txt',
      'content': 'document.addEventListener(\'copy\', function(e) {\n    e.clipboardData.setData(\'text/plain\', \'Hello, world!\');\n    e.clipboardData.setData(\'text/html\', \'<b>Hello, world!</b>\');\n    e.preventDefault(); // We want our data, not data from any selection, to be written to the clipboard\n});'
    };
    this.docsData.push(this.openFile);
  }
  title.value = this.openFile.title
  titleDisabled.value = this.openFile.title + this.openFile.extension;
  doc.setText(this.openFile.content);
  
  var fs = this;
  
  this.saveTimer = {
    interval: 3000,
    timer: null,
    reset: function() {
      if(fs.saveTimer.timer) fs.saveTimer.timer = clearTimeout(fs.saveTimer.timer);
      fs.saveTimer.timer = setTimeout(fs.saveTimer.save, fs.saveTimer.interval);
      console.log(`Save timer reset to ${fs.saveTimer.interval}ms`);
    },
    save: function() {
      if(fs.openFile.content != doc.getDocumentAsPlainText()
        || fs.openFile.title != title.value + '.txt') {
        fs.openFile.content = doc.getDocumentAsPlainText();
        fs.openFile.title = title.value + '.txt';
        localStorage.setItem('docsData', JSON.stringify(fs.docsData));
        console.log('Document saved to localStorage');
      } else {
        console.log('Document not saved to localStorage since nothing changed');
      }
      console.log(fs.docsData);
    }
  }
  
  
  title.addEventListener('input', function(e) {
    titleDisabled.value = title.value + this.openFile.extension;
    fs.saveTimer.save();
  });
}

doc.fileSystem = new FileSystem(doc);
})();
