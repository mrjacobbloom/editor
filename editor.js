document.querySelector('#cogbutton').addEventListener('click', function() {
  document.querySelector('#settingspanel').classList.toggle('show');
});
// also on blur, or on document.body when target isn't in the settingspanel

var lines = [];

function setSelect(elem1, index1, elem2, index2) {
  var range = document.createRange();
  var sel = window.getSelection();
  while(elem1.nodeType != 3) elem1 = elem1.firstChild;
  range.setStart(elem1, index1);
  if(elem2) {
    while(elem2.nodeType != 3) elem1 = elem2.firstChild;
    range.setEnd(elem2, index2);
  } else {
    range.collapse();
  }
  sel.removeAllRanges();
  sel.addRange(range);
}
/*function getParentLine(node) {;
  while(true) {
    if(node == document.body || !node.parentElement) return null;
    if(node.matches && node.matches('.line')) break;
    node = node.parentElement;
  }
  return node
}
function getCurrentLine() {
  var selection = window.getSelection();
  return getParentLine(selection.focusNode);
}*/

var editor = document.querySelector('#editor');
function Line(text, index) {
  this.element = document.createElement('div');
  this.element.classList.add('line');
  this.element.setAttribute('contenteditable', '');
  this.contentelement = document.createElement('div');
  this.contentelement.classList.add('linecontent');
  this.element.appendChild(this.contentelement);
  this.textnode = document.createTextNode(text || '')
  this.contentelement.appendChild(this.textnode);
  if(index !== undefined && lines[index]) {
    editor.insertBefore(this.element, lines[index].element);
    lines.splice(index, 0, this);
  } else {
    editor.appendChild(this.element);
    lines.push(this);
  }
  
  this.getNextLine = function() {
    return lines[this.getIndex() + 1];
  }
  this.getPreviousLine = function() {
    return lines[this.getIndex() - 1];
  }
  this.getIndex = function() {
    return lines.indexOf(this);
  }
  this.remove = function() {
    editor.removeChild(this.element);
    lines.splice(this.getIndex(), 1);
  }
  this.getLength = function() {
    return this.element.textContent.length;
  }
  this.getCaretPos = function() {
    return window.getSelection().anchorOffset;
  }
  
  var self = this;
  
  this.element.addEventListener('keydown', function(e) {
    console.log(e)
    switch (e.code) {
      case 'Backspace': {
        // this logic should be different for selections, esp. multiline
        if(self.getLength() === 0) {
          let prev = self.getPreviousLine();
          if(!prev) return false;
          setSelect(prev.textnode, prev.getLength());
          self.remove();
          e.preventDefault();
          return false;
        } else {
          return true;
        }
      }
      case 'Enter': {
        if(self.getCaretPos() == self.getLength()) {
          let line = new Line('', self.getIndex() + 1);
          setSelect(line.textnode, 0);
        } else {
          console.log('ok')
        }
        e.preventDefault();
        return false;
      }
    }
  });
}

new Line('foo');
new Line('bar');
new Line('baz');
