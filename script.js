document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = window.location.origin;

    // ----- Mobile Menu -----
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
            if (navLinks.style.display === 'flex') {
                navLinks.style.flexDirection = 'column';
                navLinks.style.position = 'absolute';
                navLinks.style.top = '70px';
                navLinks.style.left = '0';
                navLinks.style.width = '100%';
                navLinks.style.backgroundColor = 'white';
                navLinks.style.padding = '1rem';
                navLinks.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }
        });
    }

    // ----- Toast notifications -----
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 4000);
    }

    // ----- Submit lead to backend -----
    async function submitLead(payload) {
        const res = await fetch(`${API_BASE}/api/leads`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            throw new Error(data.error || 'Submission failed.');
        }
        return data;
    }

    // ----- Modal form -----
    const modal = document.getElementById('expertModal');
    const closeBtn = document.querySelector('.close-modal');
    const expertForm = document.getElementById('expertModalForm');

    if (expertForm) {
        expertForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = form.querySelector('button[type="submit"]');
            const fullName = form.fullName?.value?.trim();
            const mobile = form.mobile?.value?.trim();
            const location = form.location?.value?.trim();
            if (!fullName || !mobile || !location) {
                showToast('Please fill all required fields.', 'error');
                return;
            }
            btn.disabled = true;
            btn.textContent = 'Submitting...';
            try {
                await submitLead({ fullName, mobile, location, source: 'modal' });
                showToast('Thank you! We will contact you shortly.', 'success');
                form.reset();
                if (modal) modal.style.display = 'none';
            } catch (err) {
                showToast(err.message || 'Something went wrong. Please try again.', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = 'Start Your Construction';
            }
        });
    }

    // Open modal after 5 seconds
    setTimeout(() => {
        if (modal) modal.style.display = 'block';
    }, 5000);

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
        });
    }
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // ----- Footer contact form -----
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const btn = form.querySelector('button[type="submit"]');
            const fullName = form.fullName?.value?.trim();
            const mobile = form.mobile?.value?.trim();
            const location = form.location?.value?.trim();
            const message = form.message?.value?.trim() || '';
            if (!fullName || !mobile || !location) {
                showToast('Please fill name, mobile and location.', 'error');
                return;
            }
            btn.disabled = true;
            const originalText = btn.textContent;
            btn.textContent = 'Submitting...';
            try {
                await submitLead({ fullName, mobile, location, message, source: 'footer' });
                showToast('Thank you! We will contact you shortly.', 'success');
                form.reset();
            } catch (err) {
                showToast(err.message || 'Something went wrong. Please try again.', 'error');
            } finally {
                btn.disabled = false;
                btn.textContent = originalText;
            }
        });
    }

    // ----- Smooth scrolling -----
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
                if (window.innerWidth <= 768 && navLinks) navLinks.style.display = 'none';
            }
        });
    });

    // ----- Package pricing by city -----
    const citySelect = document.getElementById('city-select');
    const packageCards = document.querySelectorAll('.package-card[data-package]');

    function updatePackagePrices(packages) {
        if (!packages) return;
        packageCards.forEach(card => {
            const key = card.getAttribute('data-package');
            const p = packages[key];
            const el = card.querySelector('.price-value');
            if (p && el) el.textContent = p.label;
        });
    }

    async function loadPackagesForCity(city) {
        const q = city ? `?city=${encodeURIComponent(city)}` : '';
        try {
            const res = await fetch(`${API_BASE}/api/packages${q}`);
            const data = await res.json();
            if (data.success && data.packages) updatePackagePrices(data.packages);
        } catch (_) {
            // Keep default prices on error
        }
    }

    if (citySelect) {
        citySelect.addEventListener('change', () => {
            loadPackagesForCity(citySelect.value);
        });
        loadPackagesForCity(citySelect.value);
    }

    // ----- Scroll reveal -----
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    }, { root: null, threshold: 0.15, rootMargin: '0px 0px -50px 0px' });
    revealElements.forEach(el => revealObserver.observe(el));

    // ----- Expandable Package Features -----
    const expandableFeatures = document.querySelectorAll('.expandable-feature');
    expandableFeatures.forEach(feature => {
        const header = feature.querySelector('.feature-header');
        if (header) {
            header.addEventListener('click', () => {
                // Close other features in the same package card
                const parentCard = feature.closest('.package-card');
                const siblings = parentCard.querySelectorAll('.expandable-feature');
                siblings.forEach(sibling => {
                    if (sibling !== feature) {
                        sibling.classList.remove('active');
                    }
                });

                // Toggle current feature
                feature.classList.toggle('active');
            });
        }
    });
});
