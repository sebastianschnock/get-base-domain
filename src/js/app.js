import getBaseDomain from './get-base-domain';

(() => {

	let inputElem = document.querySelector('.get-base-domain__input');
	let formElem = document.querySelector('.get-base-domain__form');
	let executeElem = document.querySelector('.get-base-domain__execute-search');
	let resultElem = document.querySelector('.get-base-domain__result');
	let durationElem = document.querySelector('.get-base-domain__duration');

	let preventSubmit = false;

	formElem.addEventListener('submit', (event) => {
		event.preventDefault();
		if(preventSubmit) return false;
		const t1 = window.performance.now();
		const url = inputElem.value;
		executeElem.disabled = true;
		preventSubmit = true;
		getBaseDomain(url, (baseDomain) => {
			const t2 = window.performance.now();
			const duration = (t2-t1).toFixed(2);
			resultElem.textContent = `The base domain of ${url} is ${baseDomain}`;
			durationElem.textContent = `executed in ${duration}ms`
			executeElem.disabled = false;
			preventSubmit = false;
		});
	});

})(document);