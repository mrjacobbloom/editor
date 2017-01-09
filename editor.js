document.querySelector('#cogbutton').addEventListener('click', function() {
  document.querySelector('#settingspanel').classList.toggle('show');
});
// also on blur, or on document.body when target isn't in the settingspanel

function Char(doc, line, char, index) {
  this.char = char;
  this.toString = function() {
    return this.char;
  }
  this.element = document.createElement('span');
  this.element.classList.add('char');
  this.element.textContent = this.char;
  this.line = line;
  if(index !== undefined && line.getLength()) {
    this.line.contentelement.insertBefore(this.element, this.line.chars[index].element);
    this.line.chars.splice(index, 0, this);
  } else {
    this.line.contentelement.appendChild(this.element);
    this.line.chars.push(this);
  }
  this.getIndex = function() {
    return this.line.chars.indexOf(this);
  }
  this.getNextChar = function() {
    return this.line.chars[this.getIndex() + 1];
  }
  this.getPreviousChar = function() {
    return this.line.chars[this.getIndex() - 1];
  }
  this.remove = function() {
    this.line.contentelement.removeChild(this.element);
    this.line.chars.splice(this.getIndex(), 1);
  }
  
  var self = this;
  this.element.addEventListener('click', function(e) {
    doc.setSelect(self.line, self.getIndex() + 1);
    doc.column = doc.getColumn();
  });
}

function Line(doc, text, index) {
  this.element = document.createElement('div');
  this.element.classList.add('line');
  //this.element.setAttribute('contenteditable', '');
  this.contentelement = document.createElement('div');
  this.contentelement.classList.add('linecontent');
  this.element.appendChild(this.contentelement);
  if(index !== undefined && doc.lines[index]) {
    doc.editor.insertBefore(this.element, doc.lines[index].element);
    doc.lines.splice(index, 0, this);
  } else {
    doc.editor.appendChild(this.element);
    doc.lines.push(this);
  }
  doc.lineCountChanged();
  this.chars = [];
  
  var line = this;
  
  // an empty span that can act as caret for the 0th index
  this.startcaret = {
    startcaret: true,
    element: document.createElement('span'),
    line: line
  }
  this.startcaret.element.classList.add('startcaret');
  this.contentelement.appendChild(this.startcaret.element);
  
  this.setText = function(_text) {
    while(this.chars.length) {
      this.chars[0].remove()
    }
    for(let i = 0; i < _text.length; i++) {
      console.log(new Char(doc, this, _text[i]));
    }
  }
  this.setText(text || '');
  this.getText = function() {
    return this.chars.join('');
  }
  this.toString = this.getText;
  this.getIndex = function() {
    return doc.lines.indexOf(this);
  }
  this.getNextLine = function() {
    return doc.lines[this.getIndex() + 1];
  }
  this.getPreviousLine = function() {
    return doc.lines[this.getIndex() - 1];
  }
  this.remove = function() {
    doc.editor.removeChild(this.element);
    doc.lines.splice(this.getIndex(), 1);
    doc.lineCountChanged();
  }
  this.getLength = function() {
    return this.chars.length;
  }
  this.getCaretPos = function() {
    return window.getSelection().anchorOffset;
  }
  
  this.insertAtCaret = function(data) {
    var oldcontent = [
      line.getText().substring(0, doc.getColumn()),
      line.getText().substring(doc.getColumn())
    ];
    var split = data.split('\n');
    var caret = split[split.length - 1].length;
    if(split.length == 1) caret += oldcontent[0].length;
    split[0] = oldcontent[0] + split[0];
    split[split.length - 1] = split[split.length - 1] + oldcontent[1];
    var currentline = line;
    var index = line.getIndex();
    currentline.setText(split[0]);
    for(let i = 1; i < split.length; i++) {
      currentline = new Line(doc, split[i], ++index);
    }
    doc.setSelect(currentline, caret)
    doc.column = doc.getColumn();
  }
  
  this.element.addEventListener('paste', function(e) {
    if(e.clipboardData.types.indexOf('text/plain') > -1) {
        var data = e.clipboardData.getData('text/plain');
        //split at caret
        line.insertAtCaret(data);
    }
    e.preventDefault();
  });
}

function Document(text) {
  this.lines = [];
  
  this.style = document.createElement('style');
  document.head.append(this.style);
  var doc = this;
  this.lineCountChanged = function() {
    // make sure line numbers are all the same width
    if(doc.lines.length) {
      setTimeout(function() {
        doc.style.innerHTML = `.line::before { width: ${doc.lines.length.toString().length + 1}ex; }`;
      });
    }
  }
  
  this.tab = '    ';
  
  this.editor = document.querySelector('#editor');
  
  this.caret = null;
  this.setSelect = function(line, index, isRange) {
    if(doc.caret) {
      doc.caret.element.classList.remove('caret');
    }
    if (index > line.getLength()) index = line.getLength();
    if(index == 0) {
      doc.caret = line.startcaret;
    } else {
      doc.caret = line.chars[index - 1];
    }
    doc.caret.element.classList.add('caret');
  }
  
  if(text === undefined) text = '';
  var split = text.split('\n');
  for(let i = 0; i < split.length; i++) {
    new Line(this, split[i]);
  }
  
  var lastLine = this.lines[this.lines.length - 1]
  this.setSelect(lastLine, lastLine.getLength());
  this.column = lastLine.getLength();
  
  this.getColumn = function() {
    if(this.caret.startcaret) {
      return 0;
    } else {
    return this.caret.getIndex() + 1;
    }
  }
  
  document.body.addEventListener('keydown', function(e) {
    console.log(e)
    var line = doc.caret.line;
    switch (e.code) {
      case 'Backspace': {
        // this logic should be different for selections, esp. multiline
        if(doc.getColumn() === 0) {
          let prev = line.getPreviousLine();
          if(!prev) {
            e.preventDefault();
            return false;
          }
          let oldprevlength = prev.getLength();
          prev.setText(prev.getText() + line.getText());
          doc.setSelect(prev, oldprevlength);
          line.remove();
        } else {
          var index = doc.getColumn();
          doc.caret.remove()
          doc.setSelect(line, index - 1);
        }
        e.preventDefault();
        return false;
      }
      case 'Enter': {
        line.insertAtCaret('\n');
        e.preventDefault();
        return false;
      }
      case 'ArrowUp': {
        if(line.getIndex() !== 0) {
          let prev = line.getPreviousLine();
          if(doc.column > prev.getLength()) {
            doc.setSelect(prev, prev.getLength());
          } else {
            doc.setSelect(prev, doc.column);
          }
        } else {
          doc.setSelect(line, 0);
          doc.column = doc.getColumn();
        }
        e.preventDefault();
        return false;
      }
      case 'ArrowDown': {
        if(line.getIndex() < doc.lines.length - 1) {
          let next = line.getNextLine();
          if(doc.column > next.getLength()) {
            doc.setSelect(next, next.getLength());
          } else {
            doc.setSelect(next, doc.column);
          }
        } else {
          doc.setSelect(line, line.getLength());
          doc.column = doc.getColumn();
        }
        e.preventDefault();
        return false;
      }
      case 'ArrowLeft': {
        if(doc.getColumn() === 0) {
          if(line.getIndex() !== 0) {
            let prev = line.getPreviousLine();
            doc.setSelect(prev, prev.getLength());
            doc.column = prev.getLength();
          }
        } else {
          doc.setSelect(line, doc.column - 1);
          doc.column = doc.getColumn();
        }
        e.preventDefault();
        return false;
      }
      case 'ArrowRight': {
        if((line.getIndex() < doc.lines.length - 1) && doc.getColumn() === line.getLength()) {
          let next = line.getNextLine();
          doc.setSelect(next, 0);
          doc.column = 0;
        } else {
          doc.setSelect(line, doc.column + 1);
          doc.column = doc.getColumn();
        }
        e.preventDefault();
        return false;
      }
      case 'Tab': {
        line.insertAtCaret(doc.tab);
        e.preventDefault();
        return false;
      }
      default: {
        if(e.key.length == 1) {
          line.insertAtCaret(e.key);
          e.preventDefault();
          return false;
        } else {
          return true;
        }
      }
    }
  });
}

// Initialize
(function() {
  window.editor = new Document(`document.addEventListener('copy', function(e){
    e.clipboardData.setData('text/plain', 'Hello, world!');
    e.clipboardData.setData('text/html', '<b>Hello, world!</b>');
    e.preventDefault(); // We want our data, not data from any selection, to be written to the clipboard
});`);
})();
