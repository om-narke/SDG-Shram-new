const API_URL = '/api';

// Helper to get token
const getToken = () => localStorage.getItem('token');

// Helper to fetch data
async function apiFetch(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    return response.json();
}

// Render User Card
function createUserCard(user) {
    const name = (user.individual?.fullName || user.ngo?.ngoName || user.business?.companyName || user.institution?.institutionName || 'SDG Member').toString();
    const stakeholderType = user.stakeholderType || 'member';
    const type = stakeholderType.charAt(0).toUpperCase() + stakeholderType.slice(1);
    const initial = name.charAt(0).toUpperCase();
    const focus = user.ngo?.missionFocusAreas || user.individual?.skills || 'SDG Impact';

    return `
        <div class="user-card" id="user-${user._id}">
            <div class="card-avatar">${initial}</div>
            <div class="card-info">
                <h4>${name}</h4>
                <p class="user-type">${type}</p>
                <p class="user-focus">Focus: ${focus}</p>
            </div>
            <button class="connect-btn" onclick="sendConnectRequest('${user._id}')">Connect</button>
        </div>
    `;
}

// Render Community Card
function createCommunityCard(community) {
    return `
        <div class="community-card">
            <div class="community-info">
                <h4>${community.name}</h4>
                <p class="community-desc">${community.description}</p>
                <div class="community-meta">
                    <span class="sdg-tag">SDG ${community.sdg}</span>
                    <span class="member-count">${community.memberCount} members</span>
                </div>
            </div>
            <button class="join-btn" onclick="joinCommunity('${community._id}')">Join Community</button>
        </div>
    `;
}

// Actions
async function sendConnectRequest(userId) {
    const btn = document.querySelector(`#user-${userId} .connect-btn`);
    btn.disabled = true;
    btn.textContent = 'Sending...';

    const result = await apiFetch(`/users/connect/${userId}`, { method: 'POST' });
    if (result.success) {
        btn.textContent = 'Request Sent';
        btn.classList.add('sent');
    } else {
        alert(result.error);
        btn.disabled = false;
        btn.textContent = 'Connect';
    }
}

async function joinCommunity(communityId) {
    const result = await apiFetch(`/communities/${communityId}/join`, { method: 'POST' });
    if (result.success) {
        alert('Joined successfully!');
        location.reload();
    } else {
        alert(result.error);
    }
}

async function createCommunity(communityData) {
    return await apiFetch('/communities', {
        method: 'POST',
        body: JSON.stringify(communityData)
    });
}

// Render Connection Request Card
function createRequestCard(request) {
    const user = request.requester;
    const name = (user.individual?.fullName || user.ngo?.ngoName || user.business?.companyName || user.institution?.institutionName || 'SDG Member').toString();
    const initial = name.charAt(0).toUpperCase();
    const stakeholderType = user.stakeholderType || 'member';
    const type = stakeholderType.charAt(0).toUpperCase() + stakeholderType.slice(1);

    return `
        <div class="request-card" id="request-${user._id}">
            <div class="request-user">
                <div class="request-avatar">${initial}</div>
                <div class="request-info">
                    <strong>${name}</strong>
                    <span>${type} wants to connect</span>
                </div>
            </div>
            <div class="request-actions">
                <button class="accept-btn" onclick="acceptConnection('${user._id}')">Accept</button>
                <button class="reject-btn" onclick="rejectConnection('${user._id}')">Ignore</button>
            </div>
        </div>
    `;
}

async function acceptConnection(userId) {
    const result = await apiFetch(`/users/connect/accept/${userId}`, { method: 'PUT' });
    if (result.success) {
        document.getElementById(`request-${userId}`).remove();
        checkRequestsVisibility();
    } else {
        alert(result.error);
    }
}

async function rejectConnection(userId) {
    const result = await apiFetch(`/users/connect/reject/${userId}`, { method: 'PUT' });
    if (result.success) {
        document.getElementById(`request-${userId}`).remove();
        checkRequestsVisibility();
    } else {
        alert(result.error);
    }
}

function checkRequestsVisibility() {
    const grid = document.getElementById('requestsGrid');
    const section = document.getElementById('requestsSection');
    if (grid && section) {
        if (grid.children.length === 0) {
            section.style.display = 'none';
        } else {
            section.style.display = 'block';
        }
    }
}
