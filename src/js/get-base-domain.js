/**
 * Implementation notes
 * 
 * This module uses the list of public domain suffixes from https://publicsuffix.org. To avoid
 * going through the whole list for every request, the list is loaded once and then parsed to build
 * a search tree of the form described below.
 * 
 * As an example we take the following lines from the list:
 * 
 * org
 * za.org
 * eu.org
 * de.eu.org
 * fr.eu.org
 * 
 * After parsing the search would look like this:
 * 
 *          org
 *         /   \
 *       eu    za
 *      /  \
 *     de  fr
 *
 * Suppose we want to find the base domain for the following url:
 * 
 * http://sub1.sub2.domain.fr.eu.org/path1/path2
 * 
 * After stripping the url from scheme (http://) and path (/path1/path2) we would reverse the url
 * and split it into its parts, ending up with this:
 * 
 * org eu fr domain sub2 sub1
 * 
 * Going through this list of tokens we would traverse the search tree and find the longest
 * possible path that matches:
 * 
 * org eu fr
 * 
 * Then we add the next token to the result, reverse the result and join it again with periods:
 * 
 * domain.fr.eu.org
 * 
 * 
 * Performance notes:
 * The performance depends a lot on the number of different entry points at the first level of the
 * search tree (eg: org, com, net). On the current list (Feb 2016) we have round about 1.1k first-
 * level entries, which is roughly 10% of the list.
 * A further optimization could be to sort the list alphabetically to enable a better heuristic for
 * going through the tree. But that also raises the question of how to sort unicode characters and
 * the like.
 * One thing to note is that the very first exection of the getBaseDomain function is much longer
 * than consecutive calls, since on this first call the list is loaded from internet, parsed and
 * the search tree is build.
 */

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

	// remove scheme and path from url string
	let host = url.trim().match(/^(?:.*:\/\/)?(.[^\/]*)/)[1];

	// split url into domain labels
	let labels = host.split('.').reverse();

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