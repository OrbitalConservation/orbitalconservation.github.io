const VALID_SECTIONS = ['home', 'architecture', 'papers', 'roadmap', 'related'];

document.addEventListener('DOMContentLoaded', () => {
	renderPrinciples();
	renderArchitecture();
	renderPaperList();
	renderTimeline();
	renderRelated();
	setupEventListeners();
	handleRouteChange();
	document.getElementById('year').textContent = new Date().getFullYear();
});

window.addEventListener('hashchange', handleRouteChange);

function setupEventListeners() {
	document.getElementById('mobileMenuToggle').addEventListener('click', () => {
		document.getElementById('nav').classList.toggle('open');
	});

	document.addEventListener('click', (event) => {
		const nav = document.getElementById('nav');
		const toggle = document.getElementById('mobileMenuToggle');
		if (!nav.contains(event.target) && !toggle.contains(event.target)) {
			nav.classList.remove('open');
		}
	});
}

function handleRouteChange() {
	const route = window.location.hash.slice(1) || 'home';
	const [section, itemId] = route.split('/');

	const safeSection = VALID_SECTIONS.includes(section) ? section : 'home';
	showSection(safeSection);

	if (safeSection === 'papers') {
		const targetPaperId = itemId || OESA_DATA.papers[0].id;
		renderPaperViewer(targetPaperId);
	}
}

function showSection(sectionName) {
	document.querySelectorAll('.content-section').forEach((section) => {
		section.classList.remove('active');
	});

	const activeSection = document.getElementById(sectionName);
	if (activeSection) {
		activeSection.classList.add('active');
	}

	document.querySelectorAll('.nav-link').forEach((link) => {
		link.classList.remove('active');
		if (link.getAttribute('href') === `#${sectionName}`) {
			link.classList.add('active');
		}
	});

	const titles = {
		home: 'OCI | OESA',
		architecture: 'OCI | OESA Architecture',
		papers: 'OCI | OESA White Papers',
		roadmap: 'OCI | OESA Roadmap',
		related: 'OCI | OESA Related Reading'
	};
	document.title = titles[sectionName] || titles.home;

	window.scrollTo(0, 0);
}

function renderPrinciples() {
	const el = document.getElementById('principlesGrid');
	el.innerHTML = OESA_DATA.principles.map((item) => createFeatureCard(item)).join('');
}

function renderArchitecture() {
	const el = document.getElementById('architectureGrid');
	el.innerHTML = OESA_DATA.architecture.map((item) => createFeatureCard(item)).join('');
}

function renderRelated() {
	const el = document.getElementById('relatedGrid');
	el.innerHTML = OESA_DATA.related.map((item) => createFeatureCard(item)).join('');
}

function createFeatureCard(item) {
	return `
		<article class="feature-card">
			<h3>${item.title}</h3>
			<p>${item.body}</p>
		</article>
	`;
}

function renderPaperList() {
	const listEl = document.getElementById('paperList');
	listEl.innerHTML = OESA_DATA.papers.map((paper) => {
		return `
			<article class="paper-card" data-paper-id="${paper.id}">
				<span class="paper-status">${paper.status}</span>
				<h3>${paper.number}</h3>
				<p>${paper.title}</p>
			</article>
		`;
	}).join('');

	listEl.querySelectorAll('.paper-card').forEach((card) => {
		card.addEventListener('click', () => {
			const paperId = card.dataset.paperId;
			window.location.hash = `papers/${paperId}`;
		});
	});
}

function renderPaperViewer(paperId) {
	const paper = OESA_DATA.papers.find((entry) => entry.id === paperId) || OESA_DATA.papers[0];
	const viewer = document.getElementById('paperViewer');
	const scopeList = (paper.scope || []).map((item) => `<li>${item}</li>`).join('');
	const markdownLink = paper.relatedFile ? `<a href="${paper.relatedFile}">Open source markdown</a>` : '';

	viewer.innerHTML = `
		<h3>${paper.number}: ${paper.title}</h3>
		<p class="paper-meta">Status: ${paper.status}${paper.date ? ` | Date: ${paper.date}` : ''}${paper.author ? ` | Author: ${paper.author}` : ''}${paper.version ? ` | Version: ${paper.version}` : ''}</p>
		<p><i>${paper.summary}</i></p>
        ${paper.content || ''}
	`;

	document.querySelectorAll('.paper-card').forEach((card) => {
		card.classList.toggle('active', card.dataset.paperId === paper.id);
	});
}

function renderTimeline() {
	const el = document.getElementById('timeline');
	el.innerHTML = OESA_DATA.timeline.map((item) => {
		return `
			<article class="timeline-item">
				<strong>${item.stage}</strong>
				<p>${item.detail}</p>
			</article>
		`;
	}).join('');
}