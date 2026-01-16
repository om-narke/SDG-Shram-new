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
    const card = document.getElementById(`user-${userId}`);
    const userName = card ? card.querySelector('h4')?.textContent : 'User';

    btn.disabled = true;
    btn.textContent = 'Sending...';

    const result = await apiFetch(`/users/connect/${userId}`, { method: 'POST' });
    if (result.success) {
        btn.textContent = '✓ Connected';
        btn.classList.add('sent');
        btn.style.background = 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
        btn.style.color = 'white';
        btn.style.border = 'none';

        // Add message button after successful connection
        const messageBtn = document.createElement('button');
        messageBtn.className = 'connect-btn';
        messageBtn.style.marginTop = '8px';
        messageBtn.style.background = 'linear-gradient(135deg, #0f4c81 0%, #1a6cb5 100%)';
        messageBtn.style.color = 'white';
        messageBtn.style.border = 'none';
        messageBtn.textContent = '💬 Message';
        messageBtn.onclick = () => {
            if (window.MessagingSystem) {
                MessagingSystem.startConversation(userId, userName);
            }
        };
        btn.parentElement.appendChild(messageBtn);

        // Automatically open the chat after a brief delay
        setTimeout(() => {
            if (window.MessagingSystem) {
                MessagingSystem.startConversation(userId, userName);
            }
        }, 500);
    } else {
        alert(result.error);
        btn.disabled = false;
        btn.textContent = 'Connect';
    }
}

async function joinCommunity(communityId, communityName = 'Community') {
    // Get community name from the card if available
    const cards = document.querySelectorAll('.community-card');
    cards.forEach(card => {
        const btn = card.querySelector('.join-btn');
        if (btn && btn.getAttribute('onclick')?.includes(communityId)) {
            communityName = card.querySelector('h4')?.textContent || communityName;
        }
    });

    const result = await apiFetch(`/communities/${communityId}/join`, { method: 'POST' });
    if (result.success) {
        // Show success message
        const successMsg = document.createElement('div');
        successMsg.innerHTML = `
            <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
                        background: white; padding: 30px 40px; border-radius: 16px; 
                        box-shadow: 0 20px 60px rgba(0,0,0,0.3); z-index: 3000; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 15px;">🎉</div>
                <h3 style="color: #0f4c81; margin-bottom: 10px;">Welcome to ${communityName}!</h3>
                <p style="color: #666; margin-bottom: 20px;">You've successfully joined the community.</p>
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: linear-gradient(135deg, #0f4c81, #1a6cb5); color: white; 
                               border: none; padding: 12px 30px; border-radius: 25px; cursor: pointer;
                               font-weight: 600;">Start Chatting</button>
            </div>
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
                        background: rgba(0,0,0,0.5); z-index: 2999;" 
                 onclick="this.parentElement.remove()"></div>
        `;
        document.body.appendChild(successMsg);

        // Open community chat automatically after a delay
        setTimeout(() => {
            if (window.MessagingSystem) {
                MessagingSystem.openCommunityChat(communityId, communityName);
            }
            successMsg.remove();
        }, 2000);
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
        <div class="request-card" id="request-${user._id}" data-username="${name}">
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
    const requestCard = document.getElementById(`request-${userId}`);
    const userName = requestCard ? requestCard.dataset.username : 'User';

    const result = await apiFetch(`/users/connect/accept/${userId}`, { method: 'PUT' });
    if (result.success) {
        // Show connected animation
        requestCard.innerHTML = `
            <div style="display: flex; align-items: center; gap: 15px; padding: 10px;">
                <div style="color: #2ecc71; font-size: 1.5rem;">✓</div>
                <div>
                    <strong style="color: #2ecc71;">Connected with ${userName}!</strong>
                    <p style="color: #666; font-size: 0.85rem; margin-top: 4px;">Opening chat...</p>
                </div>
            </div>
        `;

        // Open chat after accepting connection
        setTimeout(() => {
            if (window.MessagingSystem) {
                MessagingSystem.startConversation(userId, userName);
            }
            requestCard.remove();
            checkRequestsVisibility();
        }, 1500);
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
