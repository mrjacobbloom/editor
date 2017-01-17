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
  this.prettyPos = function() {
    return `${this.line.getIndex()}:${this.getIndex()}`
  }
  
  var self = this;
  this.element.addEventListener('mousedown', function(e) {
    if(doc.command) return;
    doc.dragging = true;
    if(e.clientX > self.element.getBoundingClientRect().left + (self.element.offsetWidth/2)) {
      doc.caret.setSelect(self.line, self.getIndex() + 1);
    } else {
      doc.caret.setSelect(self.line, self.getIndex());
    }
    doc.caret.column = doc.caret.index;
  });
  this.element.addEventListener('mousemove', function(e) {
    if(doc.command) return;
    if(doc.dragging) {
      if(e.clientX > self.element.getBoundingClientRect().left + (self.element.offsetWidth/2)) {
        doc.caret.setSelect(self.line, self.getIndex() + 1, true);
      } else {
        doc.caret.setSelect(self.line, self.getIndex(), true);
      }
      doc.caret.column = doc.caret.index;
    }
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
  
  this.setText = function(_text) {
    while(this.chars.length) {
      this.chars[0].remove()
    }
    for(let i = 0; i < _text.length; i++) {
      new Char(doc, this, _text[i]);
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
  this.element.addEventListener('mousedown', function(e) {
    if(doc.command) return;
    doc.dragging = true;
    if(e.target == line.element || e.target == line.contentelement) {
      doc.caret.setSelect(line, line.getLength());
    }
  });
}

function Caret(doc, isAnchor) {
  this.element = document.createElement('div');
  this.element.classList.add('caret');
  this.blinker = document.createElement('div');
  if(!isAnchor) {
      this.blinker.classList.add('caret-blinker');
  }
  this.element.appendChild(this.blinker);
  
  function newRange() {
    return {
      isRange: false, // !collapsed if this were a real range
      chars: [],
      anchor: null, // the start char
      focus: null, // the movable char
      start: null
    }
  }
  
  this.range = newRange();
  this.column = 0;
  this.index = 0;
  this.line = null;
  var caret = this;
  this.remove = function() {
    this.line.contentelement.removeChild(this.element);
  }
  this.prettyPos = function() {
    return `${this.line.getIndex()}:${this.index}`
  }
  this.setSelect = function(line, index, isRange) {
    var oldPosition = [caret.line, caret.index];
    
    if(index < line.getLength()) {
      line.contentelement.insertBefore(caret.element, line.chars[index].element);
      caret.index = index;
    } else {
      line.contentelement.appendChild(caret.element);
      caret.index = line.getLength();
    }
    caret.line = line;
    
    if(caret.range) while(caret.range.chars.length) caret.range.chars.pop().element.classList.remove('select');
    
    if(caret.range.anchor && caret.prettyPos() == caret.range.anchor.prettyPos()) isRange = false;
    
    if(isRange) {
      if(!caret.range.isRange) {
        caret.range.anchor = new Caret(doc, true);
        caret.range.anchor.setSelect(oldPosition[0], oldPosition[1], false);
      }
      caret.range.isRange = true;
      
      var start, end;
      if(caret.range.anchor.line.getIndex() < caret.line.getIndex()
      || (caret.range.anchor.line == caret.line
          && caret.range.anchor.index < caret.index)) {
        start = caret.range.anchor;
        end = caret;
        
      } else {
        start = caret;
        end = caret.range.anchor;
        
      }
      caret.range.start = start;
      caret.range.chars = [];
      
      if(start.getNextChar()) {
        step = start.getNextChar();
      } else {
        let currentline = start.line;
        do {
          if(currentline && currentline.getNextLine) {
            currentline = currentline.getNextLine();
          }
          if(currentline) {
            step = currentline.chars[0];
          } else {
            break;
          }
        } while (currentline && !currentline.chars[0]);
      }
      while(end.prettyPos() != step.prettyPos()
        && step.line.getIndex() <= end.line.getIndex()) {
        caret.range.chars.push(step);
        step.element.classList.add('select');
        if(step.getNextChar && step.getNextChar()) {
          step = step.getNextChar();
        } else {
          let currentline = step.line;
          do {
            if(currentline && currentline.getNextLine) {
              currentline = currentline.getNextLine();
            }
            if(currentline) {
              step = currentline.chars[0];
            } else {
              step = false;
            }
          } while (currentline && !currentline.chars[0]);
          if(!step) break;
        }
      }
    } else {
      if(caret.range.anchor) caret.range.anchor.remove();
      caret.range = newRange();
    }
  }
  this.getNextChar = function() {
    if(this.index < caret.line.getLength()) {
      return caret.line.chars[this.index];
    } else {
      return null;
    }
  }
  this.getPreviousChar = function() {
    if(this.index > 0) {
      return caret.line.chars[this.index - 1];
    } else {
      return null;
    }
  }
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
  this.dragging = false;
  this.editor = document.querySelector('#editor');
  this.command = false;
  this.commandinput = editor.querySelector('#commandinput');
  this.setCommand = function(command) {
    if(command) {
      this.command = true;
      this.commandinput.innerHTML = '';
      doc.editor.classList.add('command');
    } else {
      this.command = false;
      doc.editor.classList.remove('command');
    }
  }
  
  //this.caret = null;
  this.caret = new Caret(doc);
  
  if(text === undefined) text = '';
  var split = text.split('\n');
  for(let i = 0; i < split.length; i++) {
    new Line(this, split[i]);
  }
  
  var lastLine = this.lines[this.lines.length - 1]
  this.caret.setSelect(lastLine, lastLine.getLength());
  this.caret.column = lastLine.getLength();
  
  this.deleteSelection = function() {
    if(!doc.caret.range.isRange) return;
    
    //get previous content of start's line
    var start = doc.caret.range.chars[0];
    var end = doc.caret.range.chars[doc.caret.range.chars.length - 1];
    var prev = start.line.chars.slice(0, start.getIndex()).join('');
    var next = end.line.chars.slice(end.getIndex() + 1).join('');
    var newtext = prev + next;
    
    var startindex = start.line.getIndex();
    var linesToRemove = doc.lines.slice(startindex, end.line.getIndex() + 1)
    for(let i = 0; i < linesToRemove.length; i++) {
      linesToRemove[i].remove();
    }
    var line = new Line(doc, newtext, startindex);
    doc.caret.setSelect(line, prev.length);
  }
  
  this.insertAtCaret = function(data) {
    var line = doc.caret.line;
    var oldcontent = [
      line.getText().substring(0, doc.caret.index),
      line.getText().substring(doc.caret.index)
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
    doc.caret.setSelect(currentline, caret)
    doc.caret.column = doc.caret.index;
  }
  
  this.editor.addEventListener('mouseup', function(e) {
    doc.dragging = false;
  });
  
  document.body.addEventListener('paste', function(e) {
    if(e.clipboardData.types.indexOf('text/plain') > -1) {
        var data = e.clipboardData.getData('text/plain');
        doc.insertAtCaret(data);
    }
    e.preventDefault();
  });
  
  this.getSelectionAsPlainText = function() {
    if(!doc.caret.range.isRange) return '';
    var exportedText = '';
    var currentline = doc.caret.range.chars[0].line;
    for(let i = 0; i < doc.caret.range.chars.length; i++) {
      if(doc.caret.range.chars[i].line != currentline) {
        currentline = doc.caret.range.chars[i].line;
        exportedText += '\n';
      }
      exportedText += doc.caret.range.chars[i].char;
    }
    return exportedText;
  }
  
  document.addEventListener('copy', function (e) {
    e.clipboardData.setData('text/plain', doc.getSelectionAsPlainText());
    e.preventDefault();
  });
  document.addEventListener('cut', function(e) {
    e.clipboardData.setData('text/plain', doc.getSelectionAsPlainText());
    doc.deleteSelection();
    e.preventDefault();
    // do backspace-y things
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
