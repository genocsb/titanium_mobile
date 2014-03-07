(function (global) {

	function InvalidAccessError() {
		Error.prototype.constructor.apply(arguments);
		this.code = 15;
	}
	InvalidAccessError.prototype = Object.create(Error);

	function InvalidStateError() {
		Error.prototype.constructor.apply(arguments);
		this.code = 11;
	}
	InvalidStateError.prototype = Object.create(Error);

	function SecurityError() {
		Error.prototype.constructor.apply(arguments);
		this.code = 11;
	}
	SecurityError.prototype = Object.create(Error);

	function failedToExecute(name, msg) {
		return "Failed to execute '" + name + "' on 'XMLHttpRequest': " + msg;
	}

	function failedToSet(name, msg) {
		return "Failed to set '" + name + "' on 'XMLHttpRequest': " + msg;
	}

	global.XMLHttpRequest = Object.create({
		abort: function () {
			// TODO: terminate the request

			var _ = this._,
				state = _.state,
				onreadystatechange = _.onreadystatechange;

			if ((state < 1 && !_.send) || state == 4) {
				this._changeState(0);
			} else {
				_.send = 0;
				this._changeState(4);
			}
		},

		getAllResponseHeaders: function () {
			var state = this._.state;
			if (state < 2 || this._.error) return ''; // UNSENT OR OPENED

			var rh = this._.responseHeaders,
				key,
				result = '';

			for (key in rh) {
				result = (result ? '\r\n' : '') + key + ': ' + rh[key];
			}

			return result;
		},

		getResponseHeaders: function (header) {
			var state = this._.state;
			if (state < 2 || this._.error) return null; // UNSENT OR OPENED

			var rh = this._.responseHeaders,
				key,
				result = '';

			header = header.toLowerCase();

			for (key in rh) {
				if (key.toLowerCase() == header) {
					result = (result ? ', ' : '') + rh[key];
				}
			}

			return result || null;
		},

		open: function (method, url, async, user, password) {
			var args = arguments.length,
				_ = this._,
				a,
				previousState = _.state;

			if (args < 2) {
				throw new TypeError(failedToExecute('open', "2 arguments required, but only ' + args + ' present."));
			}

			// if already open, abort
			_.state == 1 && this.abort();

			a = document.createElement('a');
			a.href = url;
			a.username || user && (a.username = user);
			a.password || password && (a.password = password);

			if (_.timeout && /^https?\:$/.test(a.protocol)) {
				throw new TypeError(failedToExecute('open', 'Synchronous requests must not set a timeout.'));
			}

			if (typeof method == 'string') {
				var m = method.toUpperCase();
				if (/^CONNECT|DELETE|GET|HEAD|OPTIONS|POST|PUT|TRACE|TRACK$/.test(m)) {
					method = m;
				}

				if (/^CONNECT|TRACE|TRACK$/.test(m)) {
					throw new SecurityError(failedToExecute('open', "'" + method + "' is not a valid HTTP method."));
				}
			}

			_.error = 0;
			_.send = 0;
			_.method = method;
			_.url = a.href;
			_.async = args.length < 3 || !(async === false);

			if (!_.async && _.timeout) {
				throw new InvalidAccessError();
			}

			// if not opened, set state to opened
			if (previousState != 1) {
				this._changeState(1);
			} else {
				this._.state = 1;
			}
		},

		overrideMimeType: function (mime) {
			var state = this._.state;
			if (state == 3 || state == 4) {
				throw new InvalidStateError(failedToExecute('overrideMimeType', "The object's state must be OPENED."));
			}
			this._.mime = mime;
		},

		send: function (data) {
			this._.startFetch = Date.now();

			this._.responseHeaders = null;
			this._.send = 1;

			// timeout??

			// TODO: send request!
			console.log('sending request');
		},

		setRequestHeader: function (header, value) {
			if (arguments.length < 2) {
				throw new TypeError(failedToExecute('setRequestHeader', "2 arguments required, but only ' + arguments.length + ' present."));
			}

			if (this._.state != 1 || this._.send) {
				throw new InvalidStateError(failedToExecute('setRequestHeader', "The object's state must be OPENED."));
			}

			if (header) {
				var rh = this._.requestHeaders || (this._.requestHeaders = {});
				rh[header] = (rh[header] ? rh[header] + ', ' : '') + value;
			}
		}
	}, 
	{
		_: {
			value: {
				error: 0,
				state: 0,
				requestHeaders: null,
				responseHeaders: null,
				send: 0
			}
		},
		UNSENT: {
			enumerable: true,
			value: 0
		},
		OPENED: {
			enumerable: true,
			value: 1
		},
		HEADERS_RECEIVED: {
			enumerable: true,
			value: 2
		},
		LOADING: {
			enumerable: true,
			value: 3
		},
		DONE: {
			enumerable: true,
			value: 4
		},
		_changeState: {
			value: function (newState) {
				this._.state = newState;
				onreadystatechange && onreadystatechange.call(this);
			}
		},
		onreadystatechange: {
			enumerable: true,
			get: function () {
				return this._.onreadystatechange || null;
			},
			set: function (fn) {
				if (fn && typeof fn == 'function') {
					this._.onreadystatechange = fn;
				}
			}
		},
		readyState: {
			enumerable: true,
			get: function () {
				return this._.state;
			}
		},
		responseText: {
			enumerable: true,
			get: function () {
				return this._.responseText || '';
			}
		},
		responseXML: {
			get: function () {
				return this._.responseXML || null;
			}
		},
		status: {
			get: function () {
				return this._.status || 0;
			}
		},
		statusText: {
			get: function () {
				return this._.statusText || '';
			}
		},
		timeout: {
			get: function () {
				return this._.timeout || 0;
			},
			set: function (ms) {
				if (typeof ms == 'number' && (ms = ~~ms) >= 0) {
					if (!this._.async) {
						throw new InvalidAccessError(failedToSet('timeout', 'Timeouts cannot be set for synchronous requests made from a document.'));
					}

					this._.timeout = ms;
				}
			}
		}
	});

}(window));