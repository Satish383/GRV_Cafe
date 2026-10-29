/* ============================================
   GRV Cafe and Restaurant — Custom JavaScript
   ============================================ */

(function () {
    'use strict';

    /* ---------- Helpers ---------- */
    const $ = (selector, context = document) => context.querySelector(selector);
    const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

    /* ---------- Dynamic Copyright Year ---------- */
    const yearEl = $('#year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    /* ---------- Navbar Scroll Effect ---------- */
    const navbar = $('#mainNav');
    const handleNavbarScroll = () => {
        if (!navbar) return;
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleNavbarScroll, { passive: true });
    handleNavbarScroll();

    /* ---------- Mobile Menu Close on Link Click ---------- */
    const navCollapse = $('#navbarNav');
    if (navCollapse) {
        const bsCollapse = new bootstrap.Collapse(navCollapse, { toggle: false });
        const navLinks = $$('.navbar-nav .nav-link', navCollapse);
        const callBtn = $('.btn-call', navCollapse);

        const closeMenu = () => {
            if (navCollapse.classList.contains('show')) {
                bsCollapse.hide();
            }
        };

        navLinks.forEach(link => link.addEventListener('click', closeMenu));
        if (callBtn) callBtn.addEventListener('click', closeMenu);

        // Close when clicking outside on mobile
        document.addEventListener('click', (e) => {
            if (
                navCollapse.classList.contains('show') &&
                !navCollapse.contains(e.target) &&
                !navbar.contains(e.target) &&
                !e.target.closest('.navbar-toggler')
            ) {
                bsCollapse.hide();
            }
        });
    }

    /* ---------- Smooth Scrolling for Anchor Links ---------- */
    $$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (!href || href === '#' || href.length < 2) return;

            const target = document.querySelector(href);
            if (!target) return;

            e.preventDefault();

            const navHeight = navbar ? navbar.offsetHeight : 0;
            const targetTop = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 8;

            window.scrollTo({
                top: targetTop,
                behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
            });

            // Update URL hash without jumping
            if (history.replaceState) {
                history.replaceState(null, '', href);
            }
        });
    });

    /* ---------- Active Nav Link on Scroll ---------- */
    const sections = $$('section[id]');
    const navLinks = $$('.navbar-nav .nav-link');

    const updateActiveLink = () => {
        if (!sections.length) return;
        const scrollPos = window.scrollY + (navbar ? navbar.offsetHeight : 0) + 120;
        let currentId = 'home';

        sections.forEach(section => {
            if (scrollPos >= section.offsetTop) {
                currentId = section.id;
            }
        });

        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            link.classList.toggle('active', href === `#${currentId}`);
            if (href === `#${currentId}`) {
                link.setAttribute('aria-current', 'page');
            } else {
                link.removeAttribute('aria-current');
            }
        });
    };

    window.addEventListener('scroll', updateActiveLink, { passive: true });
    updateActiveLink();

    /* ---------- IntersectionObserver Scroll Reveal ---------- */
    const revealEls = $$('.reveal');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (revealEls.length) {
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            revealEls.forEach(el => el.classList.add('revealed'));
        } else {
            const revealObserver = new IntersectionObserver(
                (entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('revealed');
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
            );
            revealEls.forEach(el => revealObserver.observe(el));
        }
    }

    /* ---------- Menu Category Filtering ---------- */
    const filterButtons = $$('#menuFilters .btn-filter');
    const menuItems = $$('#menuGrid .menu-item');

    if (filterButtons.length && menuItems.length) {
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');

                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                menuItems.forEach(item => {
                    const category = item.getAttribute('data-category');
                    const show = filter === 'all' || category === filter;
                    item.classList.toggle('hidden', !show);

                    if (show) {
                        // Re-trigger a subtle entrance animation
                        item.classList.remove('revealed');
                        // eslint-disable-next-line no-unused-expressions
                        void item.offsetWidth;
                        item.classList.add('revealed');
                    }
                });
            });
        });
    }

    /* ---------- Gallery Lightbox (Modal with prev/next) ---------- */
    const galleryModalEl = $('#galleryModal');
    const modalImage = $('#modalImage');
    const prevBtn = $('#prevBtn');
    const nextBtn = $('#nextBtn');

    if (galleryModalEl && modalImage && window.bootstrap) {
        const galleryItems = $$('.gallery-item');
        let currentIndex = 0;
        const galleryModal = new bootstrap.Modal(galleryModalEl);

        const showImage = (index) => {
            if (!galleryItems.length) return;
            currentIndex = (index + galleryItems.length) % galleryItems.length;
            const item = galleryItems[currentIndex];
            const imgSrc = item.getAttribute('data-img');
            const imgAlt = item.getAttribute('data-alt') || 'Gallery image';

            modalImage.src = imgSrc;
            modalImage.alt = imgAlt;
        };

        galleryItems.forEach((item, index) => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                showImage(index);
                galleryModal.show();
            });
        });

        if (prevBtn) {
            prevBtn.addEventListener('click', () => showImage(currentIndex - 1));
        }
        if (nextBtn) {
            nextBtn.addEventListener('click', () => showImage(currentIndex + 1));
        }

        // Keyboard navigation
        galleryModalEl.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                showImage(currentIndex - 1);
            } else if (e.key === 'ArrowRight') {
                showImage(currentIndex + 1);
            }
        });
    }

    /* ---------- Opening Hours: Highlight Today + Open/Closed Indicator ---------- */
    const hoursItems = $$('#hoursList .list-group-item');
    const openStatusEl = $('#openStatus');

    const OPEN_HOUR = 9;   // 9:00 AM
    const CLOSE_HOUR = 23; // 11:00 PM

    const updateHours = () => {
        const now = new Date();
        const today = now.getDay(); // 0 = Sunday, 1 = Monday ...

        // Highlight today's row
        hoursItems.forEach(item => {
            const day = Number(item.getAttribute('data-day'));
            item.classList.toggle('today', day === today);
        });

        // Determine open/closed based on visitor's local time
        if (openStatusEl) {
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            // Convert to decimal hours for precision
            const decimalHour = currentHour + currentMinutes / 60;

            const isOpen = decimalHour >= OPEN_HOUR && decimalHour < CLOSE_HOUR;

            openStatusEl.textContent = isOpen ? 'Open now' : 'Closed now';
            openStatusEl.classList.remove('status-open', 'status-closed');
            openStatusEl.classList.add(isOpen ? 'status-open' : 'status-closed');
        }
    };

    if (hoursItems.length) {
        updateHours();
        // Refresh every minute
        setInterval(updateHours, 60 * 1000);
    }

    /* ---------- Back to Top Button ---------- */
    const backToTopBtn = $('#backToTop');

    const toggleBackToTop = () => {
        if (!backToTopBtn) return;
        backToTopBtn.classList.toggle('show', window.scrollY > 400);
    };

    if (backToTopBtn) {
        window.addEventListener('scroll', toggleBackToTop, { passive: true });
        toggleBackToTop();

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: prefersReducedMotion ? 'auto' : 'smooth'
            });
        });
    }

    /* ---------- Copy Address Button ---------- */
    const copyAddressBtn = $('#copyAddressBtn');
    const FULL_ADDRESS = 'GRV Cafe and Restaurant, Raja Bazar, Konhwa More, Gopalganj, Bihar 841505, India';

    if (copyAddressBtn) {
        copyAddressBtn.addEventListener('click', async () => {
            const originalHTML = copyAddressBtn.innerHTML;
            try {
                if (navigator.clipboard && window.isSecureContext) {
                    await navigator.clipboard.writeText(FULL_ADDRESS);
                } else {
                    // Fallback for non-secure contexts
                    const textarea = document.createElement('textarea');
                    textarea.value = FULL_ADDRESS;
                    textarea.style.position = 'fixed';
                    textarea.style.opacity = '0';
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                }
                copyAddressBtn.innerHTML = '<i class="bi bi-check2 me-1"></i>Copied!';
                copyAddressBtn.classList.add('btn-success');
                copyAddressBtn.classList.remove('btn-outline-secondary');

                setTimeout(() => {
                    copyAddressBtn.innerHTML = originalHTML;
                    copyAddressBtn.classList.remove('btn-success');
                    copyAddressBtn.classList.add('btn-outline-secondary');
                }, 2200);
            } catch (err) {
                copyAddressBtn.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Copy failed';
                setTimeout(() => {
                    copyAddressBtn.innerHTML = originalHTML;
                }, 2200);
            }
        });
    }

    /* ---------- Graceful Image Fallback ---------- */
    const FALLBACK_IMAGE =
        'data:image/svg+xml;charset=UTF-8,' +
        encodeURIComponent(
            '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">' +
            '<rect width="600" height="400" fill="#F3E5D5"/>' +
            '<text x="50%" y="48%" font-family="Playfair Display, Georgia, serif" font-size="28" fill="#8B5E3C" text-anchor="middle">GRV Cafe</text>' +
            '<text x="50%" y="58%" font-family="Poppins, Arial, sans-serif" font-size="15" fill="#75665D" text-anchor="middle">Image unavailable</text>' +
            '</svg>'
        );

    $$('img').forEach(img => {
        img.addEventListener(
            'error',
            function () {
                if (this.dataset.fallbackApplied) return;
                this.dataset.fallbackApplied = 'true';
                this.src = FALLBACK_IMAGE;
            },
            { once: true }
        );
    });

    /* ---------- Hero Background Fallback ---------- */
    const heroSection = $('.hero-section');
    if (heroSection) {
        const heroImageUrl =
            'https://images.unsplash.com/photo-1552566626-52f8b828add9?q=80&w=1600&auto=format';
        const probe = new Image();
        probe.onerror = () => {
            heroSection.style.backgroundImage =
                'linear-gradient(135deg, #5B3427 0%, #8B5E3C 100%)';
        };
        probe.src = heroImageUrl;
    }

    /* ---------- CTA Background Fallback ---------- */
    const ctaSection = $('.cta-section');
    if (ctaSection) {
        const ctaImageUrl =
            'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=1600&auto=format';
        const probe = new Image();
        probe.onerror = () => {
            ctaSection.style.backgroundImage =
                'linear-gradient(135deg, #29221E 0%, #5B3427 100%)';
        };
        probe.src = ctaImageUrl;
    }
})();