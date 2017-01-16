(function() {
var doc = window.editor;
var KEYBINDINGS = {
  'EDIT': {},
  'NEDIT': {
    'CTRL': {
      'KeyA':
        function(e) {
          doc.caret.setSelect(doc.lines[0], 0);
          let lastLine = doc.lines[doc.lines.length - 1];
          doc.caret.setSelect(lastLine, lastLine.getLength(), true);
        },
    },
    'SHIFT': {},
    'CTRLSHIFT': {},
    'NONE': {
      'ArrowUp':
        function(e) {
          if(doc.caret.line.getIndex() !== 0) {
            let prev = doc.caret.line.getPreviousLine();
            if(doc.caret.column > prev.getLength()) {
              doc.caret.setSelect(prev, prev.getLength(), e.shiftKey);
            } else {
              doc.caret.setSelect(prev, doc.caret.column, e.shiftKey);
            }
          } else {
            doc.caret.setSelect(doc.caret.line, 0);
            doc.caret.column = doc.caret.index;
          }
        },
      'ArrowDown':
        function(e) {
          if(doc.caret.line.getIndex() < doc.lines.length - 1) {
            let next = doc.caret.line.getNextLine();
            if(doc.caret.column > next.getLength()) {
              doc.caret.setSelect(next, next.getLength(), e.shiftKey);
            } else {
              doc.caret.setSelect(next, doc.caret.column, e.shiftKey);
            }
          } else {
            doc.caret.setSelect(doc.caret.line, doc.caret.line.getLength());
            doc.caret.column = doc.caret.index;
          }
        },
      'ArrowLeft':
        function(e) {
          if(doc.caret.index === 0) {
            if(doc.caret.line.getIndex() !== 0) {
              let prev = doc.caret.line.getPreviousLine();
              doc.caret.setSelect(prev, prev.getLength(), e.shiftKey);
              doc.caret.column = prev.getLength();
            }
          } else {
            doc.caret.setSelect(doc.caret.line, doc.caret.column - 1, e.shiftKey);
            doc.caret.column = doc.caret.index;
          }
        },
      'ArrowRight':
        function(e) {
          if((doc.caret.line.getIndex() < doc.lines.length - 1) && doc.caret.index === doc.caret.line.getLength()) {
            let next = doc.caret.line.getNextLine();
            doc.caret.setSelect(next, 0, e.shiftKey);
            doc.caret.column = 0;
          } else {
            doc.caret.setSelect(doc.caret.line, doc.caret.column + 1, e.shiftKey);
            doc.caret.column = doc.caret.index;
          }
        },
      'Backspace':
        function(e) {
          if(doc.caret.range.isRange) {
            doc.deleteSelection();
          } else {
            if(doc.caret.index === 0) {
              let prev = doc.caret.line.getPreviousLine();
              if(!prev) {
                return;
              }
              let oldprevlength = prev.getLength();
              prev.setText(prev.getText() + doc.caret.line.getText());
              doc.caret.setSelect(prev, oldprevlength);
              doc.caret.line.remove();
            } else {
              var index = doc.caret.index;
              doc.caret.getPreviousChar().remove();
              doc.caret.setSelect(doc.caret.line, index - 1);
            }
          }
        },
      'Enter':
        function(e) {
          doc.insertAtCaret('\n');
        },
      'Tab':
        function(e) {
          doc.deleteSelection();
          doc.insertAtCaret(doc.tab);
        },
      'DEFAULT':
        function(e) {
          if(e.key.length == 1) {
            doc.deleteSelection();
            doc.insertAtCaret(e.key);
          }
        },
    }
  }
};

document.body.addEventListener('keydown', function(e) {
  console.log(e);
  var func = false;
  var edit = 'NEDIT';
  if(e.metaKey || e.ctrlKey) {
    func =
        ((e.shiftKey) ? KEYBINDINGS[edit]['CTRLSHIFT'][e.code] : false)
        || KEYBINDINGS[edit]['CTRL'][e.code]
        || false;
  } else {
    func = 
        ((e.shiftKey) ? KEYBINDINGS[edit]['SHIFT'][e.code] : false)
        || KEYBINDINGS[edit]['NONE'][e.code]
        || KEYBINDINGS[edit]['NONE']['DEFAULT'];
  }
  if(func) {
    func(e);
    console.log(func.name)
    e.preventDefault();
    return false;
  } else {
    return true;
  }
});

})();
