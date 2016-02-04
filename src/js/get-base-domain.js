let rootNode = undefined;

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

	if(rootNode === undefined) {
		// loadSuffixList(() => done(findBaseDomain(url)))	;
		rootNode = { children: [] };
		loadSuffixList(list => {
			const t1 = window.performance.now();
			parseSuffixList(list, rootNode);
			const t2 = window.performance.now();
			console.log('time to build suffix tree:', t2-t1, 'ms');
			let baseDomain = findBaseDomain(url, rootNode);
			const t3 = window.performance.now();
			console.log('time to find base domain:', t3-t2, 'ms');
			done(baseDomain);
		});
	}
	else {
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
	let httpRequest = new XMLHttpRequest();
	httpRequest.onreadystatechange = () => {
		if(httpRequest.readyState === XMLHttpRequest.DONE) {
			// parse the list and store it in a tree-form
			done(httpRequest.responseText);
		}
	}
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

	for(let line of list.split('\n')) {
		line = line.trim();
		// skip comments and empty lines
		if(!line.startsWith('//') && !(line.length === 0)) {
			let labels = line.split('.').reverse();
			insertLabels(labels, node);
		}
	}
}

function insertLabels(labels, node) {

	// split labels list into head and tail
	let head = labels.splice(0, 1)[0];

	// check if head is already in the tree
	for(let child of node.children) {
		// head is in tree, add tail to it
		if(child.label == head) return insertLabels(labels, child);
	}

	// head is new, add new child to tree
	let newChild = { label: head, children: [] };
	node.children.push(newChild);

	// insert tail into new child node
	if(labels.length > 0) insertLabels(labels, newChild);
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

	let result = [];
	let lookFurther = true;
	let head;

	// split url into domain labels
	let labels = url.trim().split('.').reverse();

	while(lookFurther) {

		lookFurther = false;

		head = labels.splice(0, 1)[0];

		// look for the head label in the tree
		for(let child of node.children) {
			if(child.label === head) {
				// head label found! continue traversing the tree
				result.push(head);
				node = child;
				lookFurther = true;
				break;
			}
		}
	}

	result.push(head);

	return result.reverse().join('.');
}

export default getBaseDomain;