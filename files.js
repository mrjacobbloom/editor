var title = document.querySelector('#title')
var titleDisabled = document.querySelector('#title-disabled');

(function() {
var doc = window.editor;

function FileSystem(doc) {
  
  var savestatus = document.querySelector('#savestatus');
  
  var dataString = localStorage.getItem('docsData');
  if(dataString) {
    this.docsData = JSON.parse(dataString);
    console.log(this.docsData)
  } else {
    this.docsData = [];
  }
  
  var fs = this;
  
  this.open = function(file) {
    title.value = file.title
    titleDisabled.value = file.title + file.extension;
    doc.setText(file.content);
    fs.openFile = file;
  }
  this.save = function(force) {
    if(force || fs.openFile.content != doc.getDocumentAsPlainText()
      || fs.openFile.title != title.value) {
      fs.openFile.content = doc.getDocumentAsPlainText();
      fs.openFile.title = title.value;
      localStorage.setItem('docsData', JSON.stringify(fs.docsData));
      console.log('Document saved to localStorage');
    } else {
      console.log('Document not saved to localStorage since nothing changed');
    }
    var date = new Date();
    savestatus.innerHTML = `Saved at ${(date.getHours() > 12 ? date.getHours() - 12 : date.getHours())}:${date.getMinutes()} ${(date.getHours() > 12) ? 'PM' : 'AM'}`;
    console.log(fs.docsData);
  }
  this.new = function(text) {
    var newfile = {
      'title': 'untitled',
      'extension': '.txt',
      'content': text || ''
    };
    this.docsData.push(newfile);
    this.open(newfile);
    this.save(true);
  }
  
  if(this.docsData[0]) {
    this.open(this.docsData[0]);
  } else {
    this.new('document.addEventListener(\'copy\', function(e) {\n    e.clipboardData.setData(\'text/plain\', \'Hello, world!\');\n    e.clipboardData.setData(\'text/html\', \'<b>Hello, world!</b>\');\n    e.preventDefault(); // We want our data, not data from any selection, to be written to the clipboard\n});');
  }
  
  this.saveTimer = {
    interval: 3000,
    timer: null,
    reset: function() {
      if(fs.saveTimer.timer) fs.saveTimer.timer = clearTimeout(fs.saveTimer.timer);
      fs.saveTimer.timer = setTimeout(fs.save, fs.saveTimer.interval);
      console.log(`Save timer reset to ${fs.saveTimer.interval}ms`);
      savestatus.innerHTML = 'Waiting to save';
    }
  }
  
  title.addEventListener('input', function(e) {
    titleDisabled.value = title.value + fs.openFile.extension;
    fs.save();
  });
  
  var file = document.querySelector('#file');
  file.querySelector('.button').addEventListener('click', function(e) {
    if(file.classList.contains('open')) {
      file.classList.remove('open');
    } else {
      let menu = file.querySelector('.menu');
      while(menu.firstChild) {
        menu.removeChild(menu.firstChild);
      }
      for(let i = 0; i < fs.docsData.length; i++) {
        let li = document.createElement('li');
        let icon = document.createElement('img');
        icon.setAttribute('src', 'icons/file.svg')
        li.appendChild(icon);
        li.appendChild(document.createTextNode(fs.docsData[i].title));
        let ext = document.createElement('span');
        ext.appendChild(document.createTextNode(fs.docsData[i].extension));
        li.appendChild(ext);
        menu.appendChild(li);
        li.addEventListener('click', function(e) {
          fs.save();
          fs.open(fs.docsData[i]);
          file.classList.remove('open');
        });
        
        if(fs.docsData[i] == fs.openFile) {
          li.classList.add('openFile');
        }
      }
      
      let li = document.createElement('li');
      let icon = document.createElement('img');
      icon.setAttribute('src', 'icons/plus.svg')
      li.appendChild(icon);
      li.appendChild(document.createTextNode('New'));
      menu.appendChild(li);
      li.addEventListener('click', function(e) {
        fs.new()
        file.classList.remove('open');
      });
      
      file.classList.add('open');
    }
  });
  document.querySelector('#delete').addEventListener('click', function(e) {
    var index = fs.docsData.indexOf(fs.openFile);
    fs.docsData.splice(index, 1);
    fs.save(true);
    if(fs.docsData.length) {
      fs.open(fs.docsData[0]);
    } else {
      fs.new();
    }
  });
  
  document.querySelector('#download').addEventListener('click', function(e) {
    // from http://stackoverflow.com/a/30832210
    var  a = document.createElement("a"),
      file = new Blob([doc.getDocumentAsPlainText()], {type: 'text/plain'}),
       url = URL.createObjectURL(file);
    a.href = url;
    a.download = fs.openFile.title + fs.openFile.extension;
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);  
    }, 0);
  });
}

doc.fileSystem = new FileSystem(doc);
})();
