document.querySelector('#cogbutton').addEventListener('click', function() {
  document.querySelector('#settingspanel').classList.toggle('show');
});
// also on blur, or on document.body when target isn't in the settingspanel

function setSelect(inp, s, e) {
  e = e || s;
  if (inp.createTextRange) {
    var r = inp.createTextRange();
    r.collapse(true);
    r.moveEnd('character', e);
    r.moveStart('character', s);
    r.select();
  } else if(inp.setSelectionRange) {
    inp.focus();
    inp.setSelectionRange(s, e);
  }
}
function getParentLine(node) {;
  while(true) {
    if(node == document.body || !node.parentElement) return null;
    console.log(node)
    if(node.matches && node.matches('.line')) break;
    node = node.parentElement;
  }
  return node
}
function getCurrentLine() {
  var selection = window.getSelection();
  return getParentLine(selection.focusNode);
}

var editor = document.querySelector('#editor');
function Line(text, index) {
  this.element = document.createElement('div');
  this.element.classList.add('line');
  this.element.setAttribute('contenteditable', '');
  this.contentelement = document.createElement('div');
  this.contentelement.classList.add('linecontent');
  this.element.appendChild(this.contentelement);
  this.contentelement.innerHTML = text || '';
  if(index) {
    
  } else {
    editor.appendChild(this.element);
  }
  
  this.element.addEventListener('keydown', function(e) {
    console.log(e)
    switch (e.code) {
      case 'Backspace': {
        var line = getCurrentLine();
        if(line.textContent.length === 0) {
          editor.removeChild(line);
          return false;
        } else {
          return true;
        }
      }
      case 'ArrowUp': {
        e.preventDefault();
        if(e.shiftKey) {
          // change selection
        } else {
          // if not top line, move cursor
        }
        return false;
      }
    }
  });
}

new Line('foo');
new Line('bar');
new Line('baz');
