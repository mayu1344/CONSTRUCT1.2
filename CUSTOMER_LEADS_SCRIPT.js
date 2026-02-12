// Customer leads management JavaScript for admin.html
// This script should be inserted into admin.html after the logout button handler

// Tab switching logic
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;

        // Update active tab button
        tabBtns.forEach(b => {
            if (b === btn) {
                b.style.background = 'var(--primary-color)';
                b.style.color = 'white';
                b.classList.add('active');
            } else {
                b.style.background = '#f0f0f0';
                b.style.color = 'var(--secondary-color)';
                b.classList.remove('active');
            }
        });

        // Show/hide sections
        if (tab === 'customers') {
            customersSection.style.display = 'block';
            projectsSection.style.display = 'none';
        } else if (tab === 'projects') {
            customersSection.style.display = 'none';
            projectsSection.style.display = 'block';
        }
    });
});

// Load customer leads
function loadLeads() {
    const secret = sessionStorage.getItem(STORAGE_KEY);
    if (!secret) return;

    fetch(API + '/api/leads', {
        headers: { 'X-Admin-Secret': secret }
    })
        .then(r => r.json())
        .then(data => {
            if (!data.success || !data.leads) {
                leadsTable.innerHTML = '<p>No customer leads yet.</p>';
                return;
            }

            if (data.leads.length === 0) {
                leadsTable.innerHTML = '<p style="color: var(--text-light); padding: 2rem; text-align: center;">No customer inquiries yet. Leads will appear here when customers fill out the contact forms.</p>';
                return;
            }

            // Sort leads by date (newest first)
            const leads = data.leads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            leadsTable.innerHTML = `
                <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <thead>
                        <tr style="background: var(--primary-color); color: white;">
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Name</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Mobile</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Location</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Source</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Message</th>
                            <th style="padding: 1rem; text-align: left; font-weight: 600;">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leads.map((lead, index) => `
                            <tr style="border-bottom: 1px solid #f0f0f0; ${index % 2 === 0 ? 'background: #fafafa;' : ''}">
                                <td style="padding: 1rem; font-weight: 500;">${escapeHtml(lead.name || 'N/A')}</td>
                                <td style="padding: 1rem;">${escapeHtml(lead.mobile || 'N/A')}</td>
                                <td style="padding: 1rem;">${escapeHtml(lead.location || 'N/A')}</td>
                                <td style="padding: 1rem;"><span style="background: #e8f5e9; color: #2e7d32; padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.85rem; font-weight: 500;">${escapeHtml(lead.source || 'Website')}</span></td>
                                <td style="padding: 1rem; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${escapeHtml(lead.message || '')}">${escapeHtml(lead.message || '-')}</td>
                                <td style="padding: 1rem; color: var(--text-light); font-size: 0.9rem;">${formatDate(lead.timestamp)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        })
        .catch(err => {
            console.error('Error loading leads:', err);
            leadsTable.innerHTML = '<p style="color: red;">Failed to load customer leads.</p>';
        });
}

// Format date helper
function formatDate(timestamp) {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-IN', options);
}

// Refresh leads button
if (refreshLeadsBtn) {
    refreshLeadsBtn.addEventListener('click', loadLeads);
}
