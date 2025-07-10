const EMAILJS_CONFIG = {
    publicKey: 'op1ODuHxWDPjHtXBs',
    serviceId: 'service_tv5uufb',
    templateId: 'template_u28djvs'
};

document.addEventListener('DOMContentLoaded', async function () {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_CONFIG.publicKey);
    }

    initializeApp();
    setupEventListeners();
    animateStats();

    await loadBlogPosts();
    loadLearningCourses();
    handleInitialRoute();
});

let blogPosts = [];
let filteredPosts = [];
let currentFilter = 'all';
let learningResources = [];
let filteredLearning = [];
let currentLearningFilter = 'all';

async function loadLearningCourses() {
    try {
        const response = await fetch('https://orbitalconservation.github.io/data/endorsed-learning.json');
        const data = await response.json();
        learningResources = data.courses || [];
        filteredLearning = [...learningResources];
        renderLearningCourses();
    } catch (error) {
        console.error('Error loading learning courses:', error);
        document.getElementById('learningGrid').innerHTML = '<p style="text-align:center; color:var(--text-light);">Unable to load courses at this time.</p>';
    }
}

function renderLearningCourses() {
    const grid = document.getElementById('learningGrid');
    if (!grid) return;
    if (!filteredLearning.length) {
        grid.innerHTML = '<p style="text-align:center; color:var(--text-light);">No resources available for this filter.</p>';
        return;
    }

    grid.innerHTML = filteredLearning.map(resource => {
        const isYoutube = resource.type === 'youtube';
        const typeIcon = isYoutube ? '<i class="fab fa-youtube"></i>' : '<i class="fas fa-graduation-cap"></i>';
        const typeLabel = isYoutube ? 'YouTube' : 'Course';
        const buttonText = isYoutube ? 'Watch Video' : 'View Details';
        const formattedPrice = formatPrice(resource.price);

        return `
              <article class="blog-card ${isYoutube ? 'youtube-video-card' : ''}" ${isYoutube ? `onclick="openVideoModal('${resource.link}', '${resource.name}', '${resource.uploadDate || ''}', '${resource.duration || ''}')"` : `onclick="openCourseModal('${encodeURIComponent(JSON.stringify(resource))}')"`}>
                  <div class="blog-card-header">
                      <div class="blog-meta" style="margin-bottom: 1rem;">
                          <span style="display: flex; align-items: center; gap: 0.5rem; color: var(--accent-color); font-weight: 600;">
                              ${typeIcon} ${typeLabel}
                          </span>
                          ${resource.author ? `<span style="color: var(--text-light); font-size: 0.85rem;"><i class="fas fa-user"></i> ${resource.author}${resource.authorOrganization ? ` (${resource.authorOrganization})` : ''}</span>` : ''}
                          ${isYoutube && resource.uploadDate ? `<span style="color: var(--text-light); font-size: 0.85rem;">Uploaded: ${formatDate(resource.uploadDate)}</span>` : ''}
                          ${isYoutube && resource.duration ? `<span style="color: var(--text-light); font-size: 0.85rem; display: flex; align-items: center; gap: 0.25rem;"><i class="fas fa-clock"></i> ${resource.duration}</span>` : ''}
                      </div>
                      <h3 class="blog-title">${resource.name}</h3>
                      <p class="course-excerpt">${resource.description}</p>
                  </div>
                  <div class="blog-card-footer" style="justify-content: flex-start; align-items: flex-start; flex-direction: column; gap: 1rem;">
                      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center;">
                          ${isYoutube ?
                `<button class="btn btn-primary" onclick="event.stopPropagation(); openVideoModal('${resource.link}', '${resource.name}', '${resource.uploadDate || ''}', '${resource.duration || ''}')">${buttonText}</button>` :
                `<button class="btn btn-primary" onclick="event.stopPropagation(); openCourseModal('${encodeURIComponent(JSON.stringify(resource))}')">${buttonText}</button>`
            }
                          ${!isYoutube ? `<span class="tag" style="background:${resource.free ? 'var(--success-color)' : 'var(--danger-color)'};">${resource.free ? 'Free' : 'Paid'}</span>` : ''}
                          ${!isYoutube && !resource.free && resource.price ? `<span class="tag" style="background:var(--warning-color);">${formattedPrice}</span>` : ''}
                      </div>
                      ${resource.tags && resource.tags.length > 0 ? `
                          <div class="blog-tags" style="margin-top: 0.5rem;">
                              ${resource.tags.map(tag => `<span class="tag" style="background: #6B7280; color: white;">${tag}</span>`).join('')}
                          </div>
                      ` : ''}
                  </div>
              </article>
          `;
    }).join('');
}

function filterLearningResources(type) {
    currentLearningFilter = type;
    if (type === 'all') {
        filteredLearning = [...learningResources];
    } else {
        filteredLearning = learningResources.filter(resource => resource.type === type);
    }
    renderLearningCourses();
}

function updateActiveLearningFilter(activeBtn) {
    document.querySelectorAll('.learning-filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
}

function initializeApp() {
    setupRouting();
}

function setupRouting() {
    window.addEventListener('hashchange', handleRouteChange);
}

function handleInitialRoute() {
    handleRouteChange();
}

function handleRouteChange() {
    const hash = window.location.hash.slice(1) || 'home';

    if (hash.startsWith('articles/')) {
        const articleSlug = hash.split('/')[1];
        showSection('articles');
        updateActiveSection('articles');

        const openArticleWhenReady = () => {
            if (blogPosts && blogPosts.length > 0) {
                setTimeout(() => {
                    openBlogModalBySlug(articleSlug);
                }, 100);
            } else {
                const checkArticles = setInterval(() => {
                    if (blogPosts && blogPosts.length > 0) {
                        clearInterval(checkArticles);
                        setTimeout(() => {
                            openBlogModalBySlug(articleSlug);
                        }, 50);
                    }
                }, 100);

                setTimeout(() => {
                    clearInterval(checkArticles);
                    console.warn('Timeout waiting for articles to load');
                }, 10000);
            }
        };

        openArticleWhenReady();
    } else {
        showSection(hash);
        updateActiveSection(hash);
        if (hash === 'insight') {
            loadLearningCourses();
        }
    }
}

function navigateToSection(sectionName) {
    window.location.hash = sectionName;
}

function setupEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function (e) {
        });
    });

    document.querySelectorAll('.footer-links a[href^="#"]').forEach(link => {
        link.addEventListener('click', function (e) {
        });
    });

    document.querySelectorAll('.btn[href^="#"]').forEach(btn => {
        btn.addEventListener('click', function (e) {
        });
    });

    document.getElementById('mobileMenuToggle').addEventListener('click', function () {
        document.getElementById('nav').classList.toggle('open');
    });

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const category = this.dataset.category;
            filterBlogPosts(category);
            updateActiveFilter(this);
        });
    });

    document.querySelectorAll('.learning-filter-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const type = this.dataset.type;
            filterLearningResources(type);
            updateActiveLearningFilter(this);
        });
    });

    document.getElementById('modalClose').addEventListener('click', closeBlogModal);
    document.getElementById('blogModal').addEventListener('click', function (e) {
        if (e.target === this) closeBlogModal();
    });

    document.getElementById('videoModalClose').addEventListener('click', closeVideoModal);
    document.getElementById('videoModal').addEventListener('click', function (e) {
        if (e.target === this) closeVideoModal();
    });

    document.getElementById('courseModalClose').addEventListener('click', closeCourseModal);
    document.getElementById('courseModal').addEventListener('click', function (e) {
        if (e.target === this) closeCourseModal();
    });

    document.getElementById('contactForm').addEventListener('submit', handleContactForm);

    document.addEventListener('click', function (e) {
        const nav = document.getElementById('nav');
        const toggle = document.getElementById('mobileMenuToggle');
        if (!nav.contains(e.target) && !toggle.contains(e.target)) {
            nav.classList.remove('open');
        }
    });

    window.addEventListener('hashchange', function () {
        document.getElementById('nav').classList.remove('open');
    });
} function showSection(sectionName) {
    const validSections = ['home', 'about', 'articles', 'insight', 'team', 'contact'];
    if (!validSections.includes(sectionName)) {
        sectionName = 'home';
        window.location.hash = 'home';
    }

    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    const targetSection = document.getElementById(sectionName);
    if (targetSection) {
        targetSection.classList.add('active');
    }

    updatePageTitle(sectionName);

    window.scrollTo(0, 0);
}

function updateActiveSection(sectionName) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const linkHash = link.getAttribute('href').slice(1);
        if (linkHash === sectionName) {
            link.classList.add('active');
        }
    });
}

function updatePageTitle(sectionName) {
    const titles = {
        'home': 'OCI | Orbital Conservation Institute',
        'about': 'OCI | About',
        'articles': 'OCI | Articles',
        'insight': 'OCI | Insight',
        'team': 'OCI | Our Team',
        'contact': 'OCI | Contact Us'
    };
    document.title = titles[sectionName] || titles['home'];
}

async function loadBlogPosts() {
    try {
        const response = await fetch('https://orbitalconservation.github.io/data/articles.json');
        const data = await response.json();
        blogPosts = data.posts || [];
        filteredPosts = [...blogPosts];
        renderBlogPosts();
    } catch (error) {
        console.error('Error loading blog posts:', error);
        document.getElementById('blogLoading').innerHTML = '<p>Error loading blog posts. Please try again later.</p>';
    }
}

function renderBlogPosts() {
    const blogGrid = document.getElementById('blogGrid');
    const loading = document.getElementById('blogLoading');

    loading.style.display = 'none';

    if (filteredPosts.length === 0) {
        blogGrid.innerHTML = '<p style="text-align: center; grid-column: 1 / -1; color: var(--text-light);">No posts found for this category.</p>';
        return;
    }

    blogGrid.innerHTML = filteredPosts.map(post => {
        const slug = post.slug || post.id;
        return `
                      <article class="blog-card ${post.featured ? 'featured' : ''}" onclick="openBlogModalBySlug('${slug}')">
                          <div class="blog-card-header">
                              <div class="blog-meta">
                                  <span>By ${post.author}</span>
                                  <span>${formatDate(post.publishDate)}</span>
                                  <span class="read-time">${post.readTime} min read</span>
                              </div>
                              <h3 class="blog-title">${post.title}</h3>
                              <p class="blog-excerpt">${post.excerpt}</p>
                          </div>
                          <div class="blog-card-footer">
                              <div class="blog-tags">
                                  ${post.tags.slice(0, 2).map(tag => `<span class="tag">${tag}</span>`).join('')}
                              </div>
                              <div class="read-time">${post.category}</div>
                          </div>
                      </article>
                  `;
    }).join('');
}

function filterBlogPosts(category) {
    currentFilter = category;
    if (category === 'all') {
        filteredPosts = [...blogPosts];
    } else {
        filteredPosts = blogPosts.filter(post => post.category === category);
    }
    renderBlogPosts();
}

function updateActiveFilter(activeBtn) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
} function openBlogModalBySlug(slug) {
    const decodedSlug = decodeURIComponent(slug);

    let post = blogPosts.find(p => p.slug === decodedSlug);
    if (!post) {
        post = blogPosts.find(p => p.id === decodedSlug);
    }

    if (!post) {
        console.warn('Article not found with slug or id:', decodedSlug);
        window.history.replaceState(null, null, '#articles');
        return;
    }

    const actualSlug = post.slug || post.id;
    const currentHash = window.location.hash;
    const newHash = `#articles/${actualSlug}`;
    if (currentHash !== newHash) {
        window.history.replaceState(null, null, newHash);
    }

    displayArticleModal(post);
}

function displayArticleModal(post) {
    const modalTitle = document.getElementById('modalTitle');
    const modalMeta = document.getElementById('modalMeta');
    const modalBody = document.getElementById('modalBody');
    const blogModal = document.getElementById('blogModal');

    if (!modalTitle || !modalMeta || !modalBody || !blogModal) {
        console.error('Modal elements not found in DOM');
        return;
    }

    modalTitle.textContent = post.title;
    modalMeta.innerHTML = `
                  <span><strong>Author:</strong> ${post.author} (${post.authorRole})</span>
                  <span><strong>Published:</strong> ${formatDate(post.publishDate)}</span>
                  <span><strong>Category:</strong> ${post.category}</span>
                  <span><strong>Read Time:</strong> ${post.readTime} minutes</span>
              `;

    let modalContent = post.content.split('\n\n').map(p => `<p>${p}</p>`).join('');

    const shareSlug = post.slug || post.id;
    modalContent += `
                  <div style="background: var(--bg-light); padding: 1.5rem; border-radius: var(--border-radius); margin: 2rem 0; border-left: 4px solid var(--accent-color);">
                      <h4 style="color: var(--primary-color); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                          <i class="fas fa-share-alt"></i> Share this Article
                      </h4>
                      <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
                          <button onclick="copyArticleLink('${shareSlug}')" class="btn btn-primary" style="gap: 0.5em; font-size: 0.9rem; padding: 0.5rem 1rem;">
                              <i class="fas fa-copy"></i> Copy Link
                          </button>
                          <button onclick="shareOnTwitter('${shareSlug}')" class="btn btn-secondary" style="gap: 0.5em; font-size: 0.9rem; padding: 0.5rem 1rem; background: #1da1f2; color: white; border: none;">
                              <i class="fab fa-twitter"></i> Twitter
                          </button>
                          <button onclick="shareOnLinkedIn('${shareSlug}')" class="btn btn-secondary" style="gap: 0.5em; font-size: 0.9rem; padding: 0.5rem 1rem; background: #0077b5; color: white; border: none;">
                              <i class="fab fa-linkedin"></i> LinkedIn
                          </button>
                          <span id="copyStatus-${shareSlug}" style="color: var(--success-color); font-weight: 600; display: none;">Link copied!</span>
                      </div>
                  </div>
              `;

    if (post.citations && post.citations.length > 0) {
        modalContent += `
                      <div class="citations-section">
                          <h3 class="citations-title">
                              <i class="fas fa-bookmark"></i>
                              References & Sources
                          </h3>
                          <ol class="citations-list">
                              ${post.citations.map((citation, index) => formatCitation(citation, index + 1)).join('')}
                          </ol>
                      </div>
                  `;
    }

    modalBody.innerHTML = modalContent;
    blogModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function formatCitation(citation, number) {
    if (typeof citation === 'string') {
        return `
                      <li class="citation-item">
                          <span class="citation-number">${number}</span>
                          <span class="citation-content">${citation}</span>
                      </li>
                  `;
    } else if (typeof citation === 'object') {
        let citationHtml = `
                      <li class="citation-item">
                          <span class="citation-number">${number}</span>
                          <span class="citation-content">
                  `;

        if (citation.authors) {
            if (Array.isArray(citation.authors)) {
                citationHtml += `<strong>${citation.authors.join(', ')}</strong>. `;
            } else {
                citationHtml += `<strong>${citation.authors}</strong>. `;
            }
        }

        if (citation.title) {
            if (citation.url) {
                citationHtml += `<a href="${citation.url}" class="citation-link" target="_blank" rel="noopener">"${citation.title}"</a>. `;
            } else {
                citationHtml += `"${citation.title}". `;
            }
        }

        if (citation.publication) {
            citationHtml += `<em>${citation.publication}</em>`;
            if (citation.year) {
                citationHtml += ` (Published: ${citation.year})`;
            }
            citationHtml += '. ';
        }

        if (citation.doi) {
            citationHtml += `DOI: <a href="https://doi.org/${citation.doi}" class="citation-link" target="_blank" rel="noopener">${citation.doi}</a>. `;
        }

        if (citation.url && !citation.title) {
            citationHtml += `Available at: <a href="${citation.url}" class="citation-link" target="_blank" rel="noopener">${citation.url}</a>. `;
        }

        if (citation.accessDate) {
            citationHtml += `<br><span class="citation-access-date">[Enacted: ${formatDate(citation.accessDate)}]</span>`;
        }

        citationHtml += `
                          </span>
                      </li>
                  `;

        return citationHtml;
    }

    return `
                  <li class="citation-item">
                      <span class="citation-number">${number}</span>
                      <span class="citation-content">${citation}</span>
                  </li>
              `;
}

function closeBlogModal() {
    document.getElementById('blogModal').classList.remove('active');
    document.body.style.overflow = 'auto';

    if (window.location.hash.startsWith('#articles/')) {
        window.history.pushState(null, null, '#articles');
    }
}

function openVideoModal(videoUrl, title, uploadDate, duration) {
    const videoId = extractYouTubeVideoId(videoUrl);
    if (!videoId) {
        console.error('Could not extract YouTube video ID from URL:', videoUrl);
        return;
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;

    document.getElementById('videoModalTitle').textContent = title;

    let metaInfo = '';
    if (uploadDate) {
        metaInfo += `<span><i class="fas fa-calendar"></i> Uploaded: ${formatDate(uploadDate)}</span>`;
    }
    if (duration) {
        metaInfo += `${metaInfo ? ' • ' : ''}<span><i class="fas fa-clock"></i> ${duration}</span>`;
    }
    document.getElementById('videoModalMeta').innerHTML = metaInfo;

    document.getElementById('videoIframe').src = embedUrl;
    document.getElementById('videoModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    document.getElementById('videoModal').classList.remove('active');
    document.getElementById('videoIframe').src = ''; // Stop video playback
    document.body.style.overflow = 'auto';
}

function extractYouTubeVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

function openCourseModal(encodedCourseData) {
    try {
        const course = JSON.parse(decodeURIComponent(encodedCourseData));

        document.getElementById('courseModalTitle').textContent = course.name;

        let metaInfo = '';
        if (course.author) {
            metaInfo += `<span><i class="fas fa-user"></i> ${course.author}${course.authorOrganization ? ` (${course.authorOrganization})` : ''}</span>`;
        }
        if (course.duration) {
            metaInfo += `${metaInfo ? ' • ' : ''}<span><i class="fas fa-clock"></i> ${course.duration}</span>`;
        }
        if (course.level) {
            metaInfo += `${metaInfo ? ' • ' : ''}<span><i class="fas fa-chart-line"></i> ${course.level}</span>`;
        }
        document.getElementById('courseModalMeta').innerHTML = metaInfo;

        let pricingInfo = '';
        if (course.free) {
            pricingInfo = '<span class="pricing-badge free"><i class="fas fa-gift"></i> Free</span>';
        } else {
            pricingInfo = '<span class="pricing-badge paid"><i class="fas fa-credit-card"></i> Paid</span>';
            if (course.price) {
                pricingInfo += `<span class="price-display"><i class="fas fa-tag"></i> ${formatPrice(course.price)}</span>`;
            }
        }
        document.getElementById('courseModalPricing').innerHTML = pricingInfo;

        const description = course.fullDescription || course.description || 'No detailed description available.';
        document.getElementById('courseModalBody').innerHTML = `
                      <p>${description}</p>
                      ${course.learningOutcomes ? `
                          <h4 style="color: var(--primary-color); margin-top: 2rem; margin-bottom: 1rem;">What You'll Learn:</h4>
                          <ul style="color: var(--text-light); line-height: 1.8;">
                              ${course.learningOutcomes.map(outcome => `<li>${outcome}</li>`).join('')}
                          </ul>
                      ` : ''}
                      ${course.prerequisites ? `
                          <h4 style="color: var(--primary-color); margin-top: 2rem; margin-bottom: 1rem;">Prerequisites:</h4>
                          <ul style="color: var(--text-light); line-height: 1.8;">
                              ${course.prerequisites.map(prereq => `<li>${prereq}</li>`).join('')}
                          </ul>
                      ` : ''}
                  `;

        let actionsHtml = `<a href="${course.link}" class="btn btn-primary" target="_blank" rel="noopener">
                      <i class="fas fa-external-link-alt" style="margin-right: 10px;"></i> Go to Course
                  </a>`;

        if (course.tags && course.tags.length > 0) {
            actionsHtml += `
                          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-left: auto;">
                              ${course.tags.map(tag => `<span class="tag" style="background: #6B7280; color: white;">${tag}</span>`).join('')}
                          </div>
                      `;
        }

        document.getElementById('courseModalActions').innerHTML = actionsHtml;

        document.getElementById('courseModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    } catch (error) {
        console.error('Error opening course modal:', error);
    }
}

function closeCourseModal() {
    document.getElementById('courseModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

function formatPrice(price) {
    if (!price) return '';

    if (/[£$€¥]/.test(price)) {
        return price;
    }

    const numericPrice = parseFloat(price.toString().replace(/[^\d.-]/g, ''));
    if (isNaN(numericPrice)) {
        return price;
    }

    if (price.toString().toLowerCase().includes('usd') || price.toString().includes('$')) {
        return `$${numericPrice.toFixed(2)}`;
    } else if (price.toString().toLowerCase().includes('gbp') || price.toString().includes('£')) {
        return `£${numericPrice.toFixed(2)}`;
    } else if (price.toString().toLowerCase().includes('eur') || price.toString().includes('€')) {
        return `€${numericPrice.toFixed(2)}`;
    } else {
        return `$${numericPrice.toFixed(2)}`;
    }
}

function handleContactForm(e) {
    e.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const submitText = document.getElementById('submitText');
    const submitSpinner = document.getElementById('submitSpinner');
    const statusDiv = document.getElementById('contactFormStatus');

    submitBtn.disabled = true;
    submitText.style.display = 'none';
    submitSpinner.style.display = 'inline';
    statusDiv.style.display = 'none';

    const formData = new FormData(e.target);
    const data = {
        from_name: formData.get('name'),
        from_email: formData.get('email'),
        organization: formData.get('organization') || 'Not specified',
        subject: formData.get('subject'),
        message: formData.get('message'),
        consent: formData.get('consent')
    };

    if (!data.from_name || !data.from_email || !data.subject || !data.message || !data.consent) {
        showFormStatus('error', 'Please fill in all required fields and accept the consent checkbox.');
        resetSubmitButton();
        return;
    }

    const emailContent = `
  New Contact Form Submission from OCI Website
  
  Name: ${data.from_name}
  Email: ${data.from_email}
  Organization: ${data.organization}
  Subject: ${data.subject}
  
  Message:
  ${data.message}
  
  ---
  This message was sent from the OCI website contact form.
  Timestamp: ${new Date().toISOString()}
              `.trim();

    if (typeof emailjs !== 'undefined' && EMAILJS_CONFIG.publicKey !== 'YOUR_PUBLIC_KEY') {
        const templateParams = {
            from_name: data.from_name,
            from_email: data.from_email,
            organization: data.organization,
            subject: data.subject,
            message: data.message,
            to_email: 'orbitalconservation@gmail.com',
            reply_to: data.from_email
        };

        emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, templateParams)
            .then((response) => {
                console.log('Email sent successfully:', response);
                showFormStatus('success', 'Thank you for your message! We will get back to you within 24-48 hours.');
                e.target.reset();
            })
            .catch((error) => {
                console.error('EmailJS error:', error);

                let errorMessage = 'There was an error sending your message. ';

                if (error.status === 400) {
                    errorMessage += 'Please check your form data and try again.';
                } else if (error.status === 401) {
                    errorMessage += 'Email service authentication failed. Please try the direct email option below.';
                } else if (error.status === 402) {
                    errorMessage += 'Email service quota exceeded. Please try again later or use the direct email option.';
                } else {
                    errorMessage += 'Please try again or contact us directly at orbitalconservation@gmail.com';
                }

                showFormStatus('error', errorMessage);

                setTimeout(() => {
                    if (confirm('Would you like to open your email client to send the message directly?')) {
                        const mailtoLink = `mailto:orbitalconservation@gmail.com?subject=Contact Form: ${encodeURIComponent(data.subject)}&body=${encodeURIComponent(emailContent)}`;
                        window.location.href = mailtoLink;
                    }
                }, 2000);
            })
            .finally(() => {
                resetSubmitButton();
            });
    } else {
        console.log('EmailJS not configured, using mailto fallback');

        setTimeout(() => {
            const mailtoLink = `mailto:orbitalconservation@gmail.com?subject=Contact Form: ${encodeURIComponent(data.subject)}&body=${encodeURIComponent(emailContent)}`;
            window.location.href = mailtoLink;
            showFormStatus('success', 'Your email client should open now. If not, please send your message directly to orbitalconservation@gmail.com');
            resetSubmitButton();
        }, 500);
    }

    function showFormStatus(type, message) {
        statusDiv.className = `form-status ${type}`;
        statusDiv.textContent = message;
        statusDiv.style.display = 'block';

        statusDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 10000);
        }
    }

    function resetSubmitButton() {
        submitBtn.disabled = false;
        submitText.style.display = 'inline';
        submitSpinner.style.display = 'none';
    }
}

function animateStats() {
    const stats = [
        { id: 'debrisTracked', target: 130000000, suffix: 'M+' },
        { id: 'satellitesMonitored', target: 8500, suffix: '+' },
        { id: 'countriesParticipating', target: 47, suffix: '' },
        { id: 'collisionsAvoided', target: 2340, suffix: '' }
    ];

    stats.forEach(stat => {
        animateCounter(stat.id, stat.target, stat.suffix);
    });
}

function animateCounter(id, target, suffix) {
    const element = document.getElementById(id);
    if (!element) return;

    let current = 0;
    const increment = target / 100;
    const duration = 2000; // 2 seconds
    const stepTime = duration / 100;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }

        let displayValue;
        if (suffix === 'M+') {
            displayValue = (current / 1000000).toFixed(0) + 'M+';
        } else if (suffix === '+') {
            displayValue = Math.floor(current).toLocaleString() + '+';
        } else {
            displayValue = Math.floor(current).toLocaleString();
        }

        element.textContent = displayValue;
    }, stepTime);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function copyArticleLink(articleSlug) {
    const url = `${window.location.origin}${window.location.pathname}#articles/${articleSlug}`;
    navigator.clipboard.writeText(url).then(() => {
        const statusElement = document.getElementById(`copyStatus-${articleSlug}`);
        if (statusElement) {
            statusElement.style.display = 'inline';
            setTimeout(() => {
                statusElement.style.display = 'none';
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy link:', err);
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            const statusElement = document.getElementById(`copyStatus-${articleSlug}`);
            if (statusElement) {
                statusElement.style.display = 'inline';
                setTimeout(() => {
                    statusElement.style.display = 'none';
                }, 2000);
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
        }
        document.body.removeChild(textArea);
    });
}

function shareOnTwitter(articleSlug) {
    let post = blogPosts.find(p => p.slug === articleSlug);
    if (!post) {
        post = blogPosts.find(p => p.id === articleSlug);
    }
    if (!post) return;

    const url = `${window.location.origin}${window.location.pathname}#articles/${articleSlug}`;
    const text = `Check out this article: "${post.title}" by ${post.author} @OrbitalConservation`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitterUrl, '_blank');
}

function shareOnLinkedIn(articleSlug) {
    let post = blogPosts.find(p => p.slug === articleSlug);
    if (!post) {
        post = blogPosts.find(p => p.id === articleSlug);
    }
    if (!post) return;

    const url = `${window.location.origin}${window.location.pathname}#articles/${articleSlug}`;
    const title = post.title;
    const summary = post.excerpt;
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(summary)}`;
    window.open(linkedInUrl, '_blank');
}

document.querySelectorAll('a[href^="#"]:not([href="#home"]):not([href="#about"]):not([href="#articles"]):not([href="#insight"]):not([href="#team"]):not([href="#contact"])').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeBlogModal();
        closeVideoModal();
        closeCourseModal();
    }

    if (e.altKey) {
        const sections = ['home', 'about', 'articles', 'insight', 'team', 'contact'];
        const currentSection = window.location.hash.slice(1) || 'home';
        const currentIndex = sections.indexOf(currentSection);

        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            window.location.hash = sections[currentIndex - 1];
        } else if (e.key === 'ArrowRight' && currentIndex < sections.length - 1) {
            window.location.hash = sections[currentIndex + 1];
        }
    }
});

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

document.querySelectorAll('.blog-card, .about-card, .team-card, .stat-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

window.addEventListener('popstate', function (e) {
    handleRouteChange();
});
