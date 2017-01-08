document.querySelector('#cogbutton').addEventListener('click', function() {
  document.querySelector('#settingspanel').classList.toggle('show');
});
// also on blur, or on document.body when target isn't in the settingspanel

function Line(doc, text, index) {
  this.element = document.createElement('div');
  this.element.classList.add('line');
  this.element.setAttribute('contenteditable', '');
  this.contentelement = document.createElement('div');
  this.contentelement.classList.add('linecontent');
  this.element.appendChild(this.contentelement);
  this.contentelement.appendChild(document.createTextNode(text || ''));
  if(index !== undefined && doc.lines[index]) {
    doc.editor.insertBefore(this.element, doc.lines[index].element);
    doc.lines.splice(index, 0, this);
  } else {
    doc.editor.appendChild(this.element);
    doc.lines.push(this);
  }
  doc.lineCountChanged();
  
  this.setText = function(_text) {
    this.contentelement.textContent = _text;
  }
  this.getText = function() {
    return this.contentelement.textContent;
  }
  this.getNextLine = function() {
    return doc.lines[this.getIndex() + 1];
  }
  this.getPreviousLine = function() {
    return doc.lines[this.getIndex() - 1];
  }
  this.getIndex = function() {
    return doc.lines.indexOf(this);
  }
  this.remove = function() {
    doc.editor.removeChild(this.element);
    doc.lines.splice(this.getIndex(), 1);
    doc.lineCountChanged();
  }
  this.getLength = function() {
    return this.getText().length;
  }
  this.getCaretPos = function() {
    return window.getSelection().anchorOffset;
  }
  
  var line = this;
  
  this.element.addEventListener('paste', function(e) {
    if(e.clipboardData.types.indexOf('text/plain') > -1) {
        var data = e.clipboardData.getData('text/plain');
        //split at caret
        var oldcontent = [
          line.getText().substring(0, line.getCaretPos()),
          line.getText().substring(line.getCaretPos())
        ];
        var split = data.split('\n');
        var caret = split[split.length - 1].length;
        if(split.length == 1) caret += oldcontent[0].length;
        console.log(split)
        split[0] = oldcontent[0] + split[0];
        split[split.length - 1] = split[split.length - 1] + oldcontent[1];
        var currentline = line;
        var index = line.getIndex();
        currentline.setText(split[0]);
        for(let i = 1; i < split.length; i++) {
          currentline = new Line(doc, split[i], ++index);
        }
        doc.setSelect(currentline.contentelement, caret)
    }
    e.preventDefault();
  });
  
  this.element.addEventListener('keydown', function(e) {
    console.log(e)
    switch (e.code) {
      case 'Backspace': {
        // this logic should be different for selections, esp. multiline
        if(line.getCaretPos() === 0) {
          let prev = line.getPreviousLine();
          if(!prev) {
            e.preventDefault();
            return false;
          }
          let oldprevlength = prev.getLength();
          prev.setText(prev.getText() + line.getText());
          doc.setSelect(prev.contentelement, oldprevlength);
          line.remove();
          e.preventDefault();
          return false;
        } else {
          return true;
        }
      }
      case 'Enter': {
        let text = line.getText();
        let caret = line.getCaretPos();
        line.setText(text.substring(0,caret));
        let newline = new Line(doc, text.substring(caret) , line.getIndex() + 1);
        doc.setSelect(newline.contentelement, 0);
        e.preventDefault();
        return false;
      }
      case 'ArrowUp': {
        if(line.getIndex() !== 0) {
          var caret = line.getCaretPos();
          var prev = line.getPreviousLine();
          if(caret > prev.getLength()) {
            doc.setSelect(prev.contentelement, prev.getLength());
          } else {
            doc.setSelect(prev.contentelement, caret);
          }
          e.preventDefault();
          return false;
        } else {
          return true;
        }
      }
      case 'ArrowDown': {
        if(line.getIndex() < doc.lines.length - 1) {
          var caret = line.getCaretPos();
          var next = line.getNextLine();
          if(caret > next.getLength()) {
            doc.setSelect(next.contentelement, next.getLength());
          } else {
            doc.setSelect(next.contentelement, caret);
          }
          e.preventDefault();
          return false;
        } else {
          return true;
        }
      }
      case 'ArrowLeft': {
        if(line.getIndex() !== 0 && line.getCaretPos() === 0) {
          var prev = line.getPreviousLine();
          doc.setSelect(prev.contentelement, prev.getLength());
          e.preventDefault();
          return false;
        } else {
          return true;
        }
      }
      case 'ArrowRight': {
        if((line.getIndex() < doc.lines.length - 1) && line.getCaretPos() === line.getLength()) {
          var next = line.getNextLine();
          doc.setSelect(next.contentelement, 0);
          e.preventDefault();
          return false;
        } else {
          return true;
        }
      }
    }
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
  this.editor = document.querySelector('#editor');
  
  this.setSelect = function(elem1, index1, elem2, index2) {
    
    var getTextElement = function(contentelement) {
      if(contentelement.children.length != 1) {
        let text = contentelement.textContent;
        while (contentelement.firstChild) {
          contentelement.removeChild(contentelement.firstChild);
        }
        let textnode = document.createTextNode(text);
        contentelement.appendChild(textnode);
        return textnode;
      } else {
        return contentelement.firstChild;
      }
    }
    
    var range = document.createRange();
    var sel = window.getSelection();
    range.setStart(getTextElement(elem1), index1);
    if(elem2) {
      range.setEnd(getTextElement(elem2), index2);
    } else {
      range.collapse();
    }
    sel.removeAllRanges();
    sel.addRange(range);
  }
  
  if(text === undefined) text = '';
  var split = text.split('\n');
  for(let i = 0; i < split.length; i++) {
    new Line(this, split[i]);
  }
  
  var lastLine = this.lines[this.lines.length - 1]
  this.setSelect(lastLine.contentelement, lastLine.getLength());
}

// Initialize
(function() {
  window.editor = new Document(`document.addEventListener('copy', function(e){
    e.clipboardData.setData('text/plain', 'Hello, world!');
    e.clipboardData.setData('text/html', '<b>Hello, world!</b>');
    e.preventDefault(); // We want our data, not data from any selection, to be written to the clipboard
});`);
})();
