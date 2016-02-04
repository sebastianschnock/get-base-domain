(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _getBaseDomain = require('./get-base-domain');

var _getBaseDomain2 = _interopRequireDefault(_getBaseDomain);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(function () {

	var inputElem = document.querySelector('.get-base-domain__input');
	var formElem = document.querySelector('.get-base-domain__form');
	var executeElem = document.querySelector('.get-base-domain__execute-search');
	var resultElem = document.querySelector('.get-base-domain__result');
	var durationElem = document.querySelector('.get-base-domain__duration');

	var preventSubmit = false;

	formElem.addEventListener('submit', function (event) {
		event.preventDefault();
		if (preventSubmit) return false;
		var t1 = window.performance.now();
		var url = inputElem.value;
		executeElem.disabled = true;
		preventSubmit = true;
		(0, _getBaseDomain2.default)(url, function (baseDomain) {
			var t2 = window.performance.now();
			var duration = (t2 - t1).toFixed(2);
			resultElem.textContent = 'The base domain of ' + url + ' is ' + baseDomain;
			durationElem.textContent = 'executed in ' + duration + 'ms';
			executeElem.disabled = false;
			preventSubmit = false;
		});
	});
})(document);

},{"./get-base-domain":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
var rootNode = undefined;

/**
 * Calculates the base domain from a given url.
 * The first execution of this function might take a while since the list of public domain suffixes
 * must be loaded and transformed into a searchable format before.
 *
 * @method     getBaseDomain
 * @param      {String}    url     the url
 * @param      {Function}  done    a callback function that is executed when the base domain
 * is calculated. The base domain is passed as a String to the callback function.
 */
function getBaseDomain(url, done) {

	if (rootNode === undefined) {
		// loadSuffixList(() => done(findBaseDomain(url)))	;
		rootNode = { children: [] };
		loadSuffixList(function (list) {
			var t1 = window.performance.now();
			parseSuffixList(list, rootNode);
			var t2 = window.performance.now();
			console.log('time to build suffix tree:', t2 - t1, 'ms');
			var baseDomain = findBaseDomain(url, rootNode);
			var t3 = window.performance.now();
			console.log('time to find base domain:', t3 - t2, 'ms');
			done(baseDomain);
		});
	} else {
		done(findBaseDomain(url, rootNode));
	}
}

/**
 * Loads the lists of public domain suffixes from https://publicsuffix.org/ and stores it internally
 *
 * @method     loadSuffixList
 * @param      {Function}  done    callback to execute when done, with the list as a parameter
 */
function loadSuffixList(done) {

	// load list of public suffixes
	var httpRequest = new XMLHttpRequest();
	httpRequest.onreadystatechange = function () {
		if (httpRequest.readyState === XMLHttpRequest.DONE) {
			// parse the list and store it in a tree-form
			done(httpRequest.responseText);
		}
	};
	httpRequest.open('GET', 'https://publicsuffix.org/list/public_suffix_list.dat');
	httpRequest.send(null);
}

/**
 * Parses the list of public domain suffixes and inserts them into a given search tree.
 *
 * @method     parseSuffixList
 * @param      {String}  list    the list of public domain suffixes
 * @param      {Object}  node    the root node of the search tree
 */
function parseSuffixList(list, node) {
	var _iteratorNormalCompletion = true;
	var _didIteratorError = false;
	var _iteratorError = undefined;

	try {

		for (var _iterator = list.split('\n')[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
			var line = _step.value;

			line = line.trim();
			// skip comments and empty lines
			if (!line.startsWith('//') && !(line.length === 0)) {
				var labels = line.split('.').reverse();
				insertLabels(labels, node);
			}
		}
	} catch (err) {
		_didIteratorError = true;
		_iteratorError = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion && _iterator.return) {
				_iterator.return();
			}
		} finally {
			if (_didIteratorError) {
				throw _iteratorError;
			}
		}
	}
}

function insertLabels(labels, node) {

	// split labels list into head and tail
	var head = labels.splice(0, 1)[0];

	// check if head is already in the tree
	var _iteratorNormalCompletion2 = true;
	var _didIteratorError2 = false;
	var _iteratorError2 = undefined;

	try {
		for (var _iterator2 = node.children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
			var child = _step2.value;

			// head is in tree, add tail to it
			if (child.label == head) return insertLabels(labels, child);
		}

		// head is new, add new child to tree
	} catch (err) {
		_didIteratorError2 = true;
		_iteratorError2 = err;
	} finally {
		try {
			if (!_iteratorNormalCompletion2 && _iterator2.return) {
				_iterator2.return();
			}
		} finally {
			if (_didIteratorError2) {
				throw _iteratorError2;
			}
		}
	}

	var newChild = { label: head, children: [] };
	node.children.push(newChild);

	// insert tail into new child node
	if (labels.length > 0) insertLabels(labels, newChild);
}

/**
 * Finds the base domain from an url, given a search tree of domain suffixes.
 *
 * @method     findBaseDomain
 * @param      {String}  url     the url
 * @param      {Object}  node    the root node of the search tree
 * @return     {String}   the base domain of the url
 */
function findBaseDomain(url, node) {

	var result = [];
	var lookFurther = true;
	var head = undefined;

	// split url into domain labels
	var labels = url.trim().split('.').reverse();

	while (lookFurther) {

		lookFurther = false;

		head = labels.splice(0, 1)[0];

		// look for the head label in the tree
		var _iteratorNormalCompletion3 = true;
		var _didIteratorError3 = false;
		var _iteratorError3 = undefined;

		try {
			for (var _iterator3 = node.children[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
				var child = _step3.value;

				if (child.label === head) {
					// head label found! continue traversing the tree
					result.push(head);
					node = child;
					lookFurther = true;
					break;
				}
			}
		} catch (err) {
			_didIteratorError3 = true;
			_iteratorError3 = err;
		} finally {
			try {
				if (!_iteratorNormalCompletion3 && _iterator3.return) {
					_iterator3.return();
				}
			} finally {
				if (_didIteratorError3) {
					throw _iteratorError3;
				}
			}
		}
	}

	result.push(head);

	return result.reverse().join('.');
}

exports.default = getBaseDomain;

},{}]},{},[1]);
