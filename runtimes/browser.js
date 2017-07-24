(function() {
'use strict';
var log = window.log = function(msg) {
  if (!window.top) {
	return;
  }
  try {
  var p = top.document.createElement('p');
  p.innerText = msg;
  top.document.body.appendChild(p);
  } catch (err) {}
};

// The global $ binding will be removed if the `shortName` option is in use.
// Maintain a function-scoped binding for internal use.
var $ = window.$ = {
  global: this,
  // Because the source text of this file is used as the "replaceValue" of
  // `String.prototype.replace`, care must be taken to avoid character
  // sequences which have special meaning in that context (notably the "dollar
  // sign" character followed immediately by the "single quotation mark"
  // character).
  shortName: '$ '[0],
  createRealm: function (options) {
	log('createRealm 1');
    options = options || {};
    const globals = options.globals || {};

    var frame = document.createElement('iframe');
    document.body.appendChild(frame);
    var fwin = frame.contentWindow;
    var fdoc = fwin.document;

	log('createRealm 2');
    // The following is a workaround for a bug in Chromium related to reporting
    // errors produced from evaluating code using `eval`.
    // https://bugs.chromium.org/p/chromium/issues/detail?id=746564
    fdoc.write('<body>');

    var fscript = fdoc.createElement('script');

	log('createRealm 3');
    fscript.textContent = this.source;
    fdoc.body.appendChild(fscript);
    var f$ = fwin.$;
    delete fwin.$;
    fwin[$.shortName] = f$;
    f$.source = this.source;
    f$.socket = this.socket;

	log('createRealm 4');
    for(var glob in globals) {
      fwin[glob] = globals[glob];
    }

    f$.destroy = function () {
	  log('createRealm - destroy 1');
      document.body.removeChild(frame);
	  log('createRealm - destroy 2');

      if (options.destroy) {
        options.destroy();
      }
    }

    return f$;
  },
  evalScript: function (code, options) {
	log('evalScript 1');
    options = options || {};

    var s = document.createElement('script');
    s.textContent = code;
    var error = null;
	log('evalScript 2');
    window.onerror = function (msg, file, row, col, err) {
      if (!err) {
        // make up some error for Edge.
        err = {
          name: 'UnknownESHostError',
          message: msg
        };
      }

      error = err;
    }
	log('evalScript 3');
    document.body.appendChild(s);
	log('evalScript 4');
    if (window) {
      window.onerror = null;
    }

    if (error) {
	  log('evalScript 5a');
      return { type: 'throw', value: error };
    } else {
	  log('evalScript 5b');
      return { type: 'normal', value: undefined };
    }
  },
  getGlobal: function (name) {
    return this.global[name];
  },
  setGlobal: function (name, value) {
    this.global[name] = value;
  },
  destroy: function() {
    $.socket.emit('destroy')
  },
  source: $SOURCE
};

function print(str) {
  $.socket.emit('print', str);
}

window.print = print;
}.call(this));
