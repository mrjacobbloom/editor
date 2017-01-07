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
    if(node.matches('.line')) break;
    node = node.parentElement;
  }
  return node
}

var editor = document.querySelector('#editor');
editor.addEventListener('keydown', function(e) {
  console.log(e)
  if(e.code == 'ArrowUp') {
    e.preventDefault();
    if(e.shiftKey) {
      // change selection
    } else {
      // if not top line, move cursor
    }
    return false;
  }
});
