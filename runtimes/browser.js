(function() {
'use strict';
var realmId = new Date().getTime();
// Need to cache this reference because it looks like events are firing within
// iframes after they have been detached from the DOM.
var TOP = top;
var log = window.log = function(msg) {
  var p = TOP.document.createElement('p');
  p.innerText = msg;
  TOP.document.body.appendChild(p);
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
	log('evalScript ' + realmId + ' ' + code);
    options = options || {};

    var s = document.createElement('script');
    s.textContent = code;
    var error = null;
	log('evalScript 2');
    window.onerror = function (msg, file, row, col, err) {
	  log('onerror 1');
      if (!err) {
        // make up some error for Edge.
        err = {
          name: 'UnknownESHostError',
          message: msg
        };
      }
	  log('onerror 2: ' + err.message);

      error = err;
    }
	log('evalScript 3');
	try {
	  log('evalScript 3.1' + s.textContent);
    document.body.appendChild(s);
	  log('evalScript 3.2');
	} catch (err) {
	  log('evalScript 3.3');
	  throw err;
	}
	log('evalScript 4');
    if (window) {
	  log('evalScript 4.1');
	  try {
      window.onerror = null;
	    log('evalScript 4.2');
	  } catch(err) {
	    log('evalScript 4.3');
	  }
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
  log('printing: ' + str);
  $.socket.emit('print', str);
  log('printed!');
}

window.print = print;
}.call(this));
