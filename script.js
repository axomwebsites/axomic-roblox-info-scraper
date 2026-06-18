const proxylist = [
    { prefix: 'https://corsproxy.io/?', encode: true },
    { prefix: 'https://cors-anywhere.herokuapp.com/', encode: false }
];

async function fetchwithretry(url, options = {}) {
    try {
        const resp = await fetch(url, options);
        if (resp.ok) return resp;
        throw new Error('status not ok');
    } catch (e) {
        for (const proxy of proxylist) {
            try {
                let proxyurl;
                if (proxy.encode) {
                    proxyurl = proxy.prefix + encodeURIComponent(url);
                } else {
                    proxyurl = proxy.prefix + url;
                }
                const resp2 = await fetch(proxyurl, options);
                if (resp2.ok) return resp2;
            } catch (e) {}
        }
        throw new Error('all fetch attempts failed');
    }
}

function showloading(show) {
    const overlay = document.getElementById('loadingoverlay');
    if (show) {
        overlay.classList.remove('hidden');
    } else {
        overlay.classList.add('hidden');
    }
}

async function fetchuserdata(username) {
    const status = document.getElementById('statusmsg');
    status.textContent = 'fetching data...';
    status.className = 'statusmsg';
    showloading(true);
    const userid = await getuserid(username);
    if (!userid) {
        status.textContent = `failed to fetch user data for '${username}'. the username may not exist`;
        status.className = 'statusmsg error';
        showloading(false);
        return;
    }
    const data = {};
    data.profile = await getuserprofile(userid);
    data.presence = await getuserpresence([userid]);
    data.friends = await getuserfriends(userid);
    data.followers = await getuserfollowers(userid);
    data.followings = await getuserfollowings(userid);
    data.groups = await getusergroups(userid);
    data.badges = await getuserbadges(userid);
    data.avatar = await getuseravatar(userid);
    data.avatarheadshot = await getuseravatarheadshot(userid);
    data.inventory = await getuserinventory(userid);
    data.usernamehistory = await getusernamehistory(userid);
    data.sociallinks = await getsociallinks(userid);
    data.creatorhub = await getcreatorhubinfo(userid);
    data.frienddetails = await getfrienddetails(userid);
    data.rawpresence = await getrawpresence(userid);
    data.alts = await findpossiblealts(userid, username);
    displayalldata(data, username);
    status.textContent = 'done';
    status.className = 'statusmsg success';
    showloading(false);
}

async function getuserid(username) {
    const urls = [
        'https://users.roblox.com/v1/usernames/users',
        `https://www.roblox.com/api/users/get-by-username?username=${username}`
    ];
    for (const url of urls) {
        try {
            if (url.includes('usernames/users')) {
                const resp = await fetchwithretry(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ usernames: [username] })
                });
                if (resp.ok) {
                    const json = await resp.json();
                    const users = json.data || [];
                    if (users.length) return users[0].id;
                }
            } else {
                const resp = await fetchwithretry(url);
                if (resp.ok) {
                    const json = await resp.json();
                    if (json.Id) return json.Id;
                }
            }
        } catch (e) {}
    }
    try {
        const alturl = `https://api.roblox.com/users/get-by-username?username=${username}`;
        const resp = await fetchwithretry(alturl);
        if (resp.ok) {
            const json = await resp.json();
            if (json.Id) return json.Id;
        }
    } catch (e) {}
    return null;
}

async function getuserprofile(userid) {
    const url = `https://users.roblox.com/v1/users/${userid}`;
    try {
        const resp = await fetchwithretry(url);
        if (resp.ok) return await resp.json();
        else return { error: `http ${resp.status}` };
    } catch (e) {
        return { error: e.message };
    }
}

async function getuserpresence(userids) {
    const url = 'https://presence.roblox.com/v1/presence/users';
    try {
        const resp = await fetchwithretry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userIds: userids })
        });
        if (resp.ok) {
            const json = await resp.json();
            const presences = json.userPresences || [];
            if (presences.length) return presences[0];
            else return { error: 'no presence data' };
        } else {
            return { error: `http ${resp.status}` };
        }
    } catch (e) {
        return { error: e.message };
    }
}

async function getuserfriends(userid) {
    const url = `https://friends.roblox.com/v1/users/${userid}/friends`;
    try {
        const resp = await fetchwithretry(url);
        if (resp.ok) {
            const json = await resp.json();
            return json.data || [];
        }
        return [];
    } catch (e) { return []; }
}

async function getuserfollowers(userid) {
    const url = `https://friends.roblox.com/v1/users/${userid}/followers`;
    try {
        const resp = await fetchwithretry(url);
        if (resp.ok) {
            const json = await resp.json();
            return json.data || [];
        }
        return [];
    } catch (e) { return []; }
}

async function getuserfollowings(userid) {
    const url = `https://friends.roblox.com/v1/users/${userid}/followings`;
    try {
        const resp = await fetchwithretry(url);
        if (resp.ok) {
            const json = await resp.json();
            return json.data || [];
        }
        return [];
    } catch (e) { return []; }
}

async function getusergroups(userid) {
    const url = `https://groups.roblox.com/v1/users/${userid}/groups/roles`;
    try {
        const resp = await fetchwithretry(url);
        if (resp.ok) {
            const json = await resp.json();
            return json.data || [];
        }
        return [];
    } catch (e) { return []; }
}

async function getuserbadges(userid) {
    const url = `https://badges.roblox.com/v1/users/${userid}/badges?limit=100&sortOrder=Asc`;
    try {
        const resp = await fetchwithretry(url);
        if (resp.ok) {
            const json = await resp.json();
            return json.data || [];
        }
        return [];
    } catch (e) { return []; }
}

async function getuseravatar(userid) {
    const url = `https://avatar.roblox.com/v1/users/${userid}/avatar`;
    try {
        const resp = await fetchwithretry(url);
        if (resp.ok) return await resp.json();
        else return { error: `http ${resp.status}` };
    } catch (e) {
        return { error: e.message };
    }
}

async function getuseravatarheadshot(userid) {
    const url = `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userid}&size=420x420&format=Png&isCircular=false`;
    try {
        const resp = await fetchwithretry(url);
        if (resp.ok) {
            const json = await resp.json();
            if (json.data && json.data.length) return json.data[0];
            else return { error: 'no headshot data' };
        } else {
            return { error: `http ${resp.status}` };
        }
    } catch (e) {
        return { error: e.message };
    }
}

async function getuserinventory(userid) {
    const url = `https://inventory.roblox.com/v1/users/${userid}/items/1?limit=10`;
    try {
        const resp = await fetchwithretry(url);
        if (resp.ok) {
            const json = await resp.json();
            return json.data || [];
        }
        return [];
    } catch (e) { return []; }
}

async function getusernamehistory(userid) {
    const url = `https://users.roblox.com/v1/users/${userid}/username-history?limit=10`;
    try {
        const resp = await fetchwithretry(url);
        if (resp.ok) {
            const json = await resp.json();
            return json.data || [];
        }
        return [];
    } catch (e) { return []; }
}

async function getsociallinks(userid) {
    const socials = { youtube: null, twitter: null, discord: null };
    const url = `https://friends.roblox.com/v1/users/${userid}/social-networks`;
    try {
        const resp = await fetchwithretry(url);
        if (resp.ok) {
            const json = await resp.json();
            for (const link of (json.data || [])) {
                const platform = (link.platform || '').toLowerCase();
                if (platform === 'youtube') socials.youtube = link.address;
                else if (platform === 'twitter' || platform === 'x') socials.twitter = link.address;
                else if (platform === 'discord') socials.discord = link.address;
            }
        }
        return socials;
    } catch (e) { return socials; }
}

async function getcreatorhubinfo(userid) {
    try {
        const url = `https://create.roblox.com/v1/creators/${userid}/profile`;
        const resp = await fetchwithretry(url);
        if (resp.ok) return await resp.json();
        else return { error: 'creator hub data unavailable' };
    } catch (e) {
        return { error: 'creator hub data unavailable' };
    }
}

async function getfrienddetails(userid) {
    const friends = await getuserfriends(userid);
    if (!friends.length) return { oldest: [], popular: [] };
    const friendswithfollowers = [];
    for (const friend of friends.slice(0, 50)) {
        const fid = friend.id;
        const fname = friend.name || 'unknown';
        if (fid) {
            const followers = await getuserfollowers(fid);
            friendswithfollowers.push({ id: fid, name: fname, followers: followers.length });
        }
    }
    const sortedbyfollowers = [...friendswithfollowers].sort((a, b) => b.followers - a.followers);
    const oldestfriends = friends.slice(0, 3).map(f => ({ id: f.id || 'unknown', name: f.name || 'unknown' }));
    return { oldest: oldestfriends, popular: sortedbyfollowers.slice(0, 3) };
}

async function getrawpresence(userid) {
    const url = 'https://presence.roblox.com/v1/presence/users';
    const payload = { userIds: [userid] };
    try {
        const resp = await fetchwithretry(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (resp.ok) {
            const json = await resp.json();
            const presences = json.userPresences || [];
            if (presences.length) {
                const p = presences[0];
                const types = { 0: 'offline', 1: 'online', 2: 'in game', 3: 'in studio', 4: 'invisible' };
                return {
                    type: types[p.userPresenceType] || 'unknown',
                    raw: p.userPresenceType,
                    lastonline: p.lastOnline,
                    placeid: p.placeId,
                    universeid: p.universeId
                };
            }
        }
        return { type: 'unknown', raw: null };
    } catch (e) {
        return { type: 'unknown', raw: null };
    }
}

async function findpossiblealts(userid, username) {
    const alts = [];
    try {
        const followers = await getuserfollowers(userid);
        for (const follower of followers.slice(0, 30)) {
            const fname = follower.name || '';
            if (fname.toLowerCase().startsWith(username.toLowerCase() + '_') ||
                fname.toLowerCase().startsWith(username.toLowerCase() + '0') ||
                fname.toLowerCase().startsWith(username.toLowerCase() + '1')) {
                alts.push({ name: fname, id: follower.id, reason: 'similar username (follower)' });
            }
        }
        const following = await getuserfollowings(userid);
        for (const follow of following.slice(0, 30)) {
            const fname = follow.name || '';
            if (fname.toLowerCase().startsWith(username.toLowerCase() + '_') ||
                fname.toLowerCase().startsWith(username.toLowerCase() + '0') ||
                fname.toLowerCase().startsWith(username.toLowerCase() + '1')) {
                if (!alts.some(a => a.id === follow.id)) {
                    alts.push({ name: fname, id: follow.id, reason: 'similar username (following)' });
                }
            }
        }
        if (alts.length < 3) {
            try {
                const possiblealts = [`${username}1`, `${username}2`, `${username}_alt`, `${username}real`, `${username}123`];
                for (const altname of possiblealts) {
                    if (alts.length >= 3) break;
                    const payload = { usernames: [altname] };
                    const resp = await fetchwithretry('https://users.roblox.com/v1/usernames/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (resp.ok) {
                        const json = await resp.json();
                        const users = json.data || [];
                        if (users.length && users[0].id !== userid) {
                            alts.push({ name: altname, id: users[0].id, reason: 'common alt naming pattern' });
                        }
                    }
                }
            } catch (e) {}
        }
        if (alts.length < 3) {
            try {
                const url = `https://groups.roblox.com/v1/users/${userid}/groups/roles`;
                const resp = await fetchwithretry(url);
                if (resp.ok) {
                    const json = await resp.json();
                    const groups = json.data || [];
                    for (const group of groups.slice(0, 10)) {
                        if (alts.length >= 3) break;
                        const groupid = group.group && group.group.id;
                        if (groupid) {
                            const membersurl = `https://groups.roblox.com/v1/groups/${groupid}/users?limit=100`;
                            const membersresp = await fetchwithretry(membersurl);
                            if (membersresp.ok) {
                                const membersjson = await membersresp.json();
                                const members = membersjson.data || [];
                                for (const member of members) {
                                    const membername = (member.user && member.user.username) || '';
                                    const memberid = member.user && member.user.userId;
                                    if (membername.toLowerCase().startsWith(username.toLowerCase()) && memberid !== userid) {
                                        if (!alts.some(a => a.id === memberid)) {
                                            alts.push({ name: membername, id: memberid, reason: 'shared group membership' });
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } catch (e) {}
        }
    } catch (e) {}
    return alts.slice(0, 3);
}

function createsection(title, contenthtml, open = true) {
    const wrap = document.createElement('div');
    wrap.className = 'sectionwrap';
    const header = document.createElement('div');
    header.className = 'sectionheader';
    const span = document.createElement('span');
    span.textContent = title;
    const icon = document.createElement('span');
    icon.className = 'toggleicon' + (open ? '' : ' closed');
    icon.textContent = '▼';
    header.appendChild(span);
    header.appendChild(icon);
    const body = document.createElement('div');
    body.className = 'sectionbody' + (open ? '' : ' closed');
    body.innerHTML = contenthtml;
    header.addEventListener('click', function() {
        const isclosed = body.classList.toggle('closed');
        icon.classList.toggle('closed', isclosed);
    });
    wrap.appendChild(header);
    wrap.appendChild(body);
    return wrap;
}

function displayalldata(data, username) {
    const out = document.getElementById('resultcontent');
    out.innerHTML = '';
    const profile = data.profile;
    const pdate = (s) => {
        try {
            const d = new Date(s);
            return d.toLocaleString();
        } catch (e) { return s; }
    };

    let profilehtml = '';
    if (profile.error) {
        profilehtml += `<div class="errortext">! profile error: ${profile.error}</div>`;
    } else {
        const userid = profile.id || 'unknown';
        profilehtml += `<div class="item"><span class="label">user id:</span> ${userid}</div>`;
        profilehtml += `<div class="item"><span class="label">username:</span> ${profile.name || 'n/a'}</div>`;
        profilehtml += `<div class="item"><span class="label">display name:</span> ${profile.displayName || 'n/a'}</div>`;
        profilehtml += `<div class="item"><span class="label">description:</span> ${(profile.description || 'n/a').slice(0,200)}</div>`;
        const created = profile.created || 'n/a';
        if (created !== 'n/a') {
            profilehtml += `<div class="item"><span class="label">account created:</span> ${pdate(created)}</div>`;
            profilehtml += `<div class="item"><span class="label">creation timestamp raw:</span> ${created}</div>`;
            const age = Math.floor((Date.now() - new Date(created).getTime()) / (1000*60*60*24));
            profilehtml += `<div class="item"><span class="label">account age:</span> ${age} days</div>`;
        }
        profilehtml += `<div class="item"><span class="label">is banned:</span> ${profile.isBanned !== undefined ? profile.isBanned : 'n/a'}</div>`;
        profilehtml += `<div class="item"><span class="label">has verified badge:</span> ${profile.hasVerifiedBadge !== undefined ? profile.hasVerifiedBadge : 'n/a'}</div>`;
    }
    out.appendChild(createsection('profile', profilehtml));

    const presence = data.rawpresence;
    let presencehtml = '';
    presencehtml += `<div class="item"><span class="label">type:</span> ${presence.type || 'unknown'}</div>`;
    if (presence.placeid) presencehtml += `<div class="item"><span class="label">current place id:</span> ${presence.placeid}</div>`;
    if (presence.universeid) presencehtml += `<div class="item"><span class="label">current universe id:</span> ${presence.universeid}</div>`;
    if (presence.lastonline) presencehtml += `<div class="item"><span class="label">last online raw:</span> ${presence.lastonline}</div>`;
    out.appendChild(createsection('presence', presencehtml));

    let historyhtml = '';
    const history = data.usernamehistory || [];
    if (history.length) {
        for (const entry of history) {
            historyhtml += `<div class="item">• ${entry.name || 'unknown'} → changed on ${entry.created || 'unknown'}</div>`;
        }
    } else {
        historyhtml += `<div class="item">• none found</div>`;
    }
    out.appendChild(createsection('previous display names', historyhtml));

    let socialhtml = '';
    const socials = data.sociallinks || {};
    let hassocial = false;
    if (socials.youtube) { hassocial = true; socialhtml += `<div class="item">• youtube: ${socials.youtube}</div>`; }
    if (socials.twitter) { hassocial = true; socialhtml += `<div class="item">• twitter/x: ${socials.twitter}</div>`; }
    if (socials.discord) { hassocial = true; socialhtml += `<div class="item">• discord: ${socials.discord}</div>`; }
    if (!hassocial) socialhtml += `<div class="item">• none found</div>`;
    out.appendChild(createsection('social links', socialhtml));

    let chhtml = '';
    const ch = data.creatorhub || {};
    if (ch.error) {
        chhtml += `<div class="item">• ${ch.error}</div>`;
    } else {
        chhtml += `<div class="item">• creator type: ${ch.creatorType || 'n/a'}</div>`;
        chhtml += `<div class="item">• created items count: ${ch.createdItemsCount !== undefined ? ch.createdItemsCount : 'n/a'}</div>`;
    }
    out.appendChild(createsection('creator hub', chhtml));

    let friendshtml = '';
    const friends = data.friends || [];
    friendshtml += `<div class="item">total friends: ${friends.length}</div>`;
    const frienddetails = data.frienddetails || {};
    const oldest = frienddetails.oldest || [];
    if (oldest.length) {
        friendshtml += `<div class="item">oldest friends (first 3 added):</div>`;
        for (const f of oldest) {
            friendshtml += `<div class="item" style="margin-left:20px;">• ${f.name || 'unknown'} (id: ${f.id || 'unknown'})</div>`;
        }
    }
    const popular = frienddetails.popular || [];
    if (popular.length) {
        friendshtml += `<div class="item">top 3 friends by follower count:</div>`;
        for (const f of popular) {
            friendshtml += `<div class="item" style="margin-left:20px;">• ${f.name || 'unknown'} (id: ${f.id || 'unknown'}) → ${f.followers || 0} followers</div>`;
        }
    }
    const followers = data.followers || [];
    friendshtml += `<div class="item">followers: ${followers.length}</div>`;
    if (followers.length) {
        const names = followers.slice(0,5).map(f => f.name || 'unknown').join(', ');
        friendshtml += `<div class="item" style="margin-left:20px;">recent: ${names}${followers.length > 5 ? ' ...' : ''}</div>`;
    }
    const followings = data.followings || [];
    friendshtml += `<div class="item">following: ${followings.length}</div>`;
    out.appendChild(createsection('friends & connections', friendshtml));

    let altshtml = '';
    const alts = data.alts || [];
    if (alts.length) {
        for (const alt of alts) {
            altshtml += `<div class="item">• ${alt.name || 'unknown'} (id: ${alt.id || 'unknown'}) → ${alt.reason || 'unknown'}</div>`;
        }
    } else {
        altshtml += `<div class="item">• none found</div>`;
    }
    out.appendChild(createsection('possible alternative accounts', altshtml));

    let groupshtml = '';
    const groups = data.groups || [];
    for (const group of groups.slice(0,5)) {
        const ginfo = group.group || {};
        const rinfo = group.role || {};
        groupshtml += `<div class="item">• ${ginfo.name || 'unknown'} (id: ${ginfo.id || 'unknown'}) → ${rinfo.name || 'unknown'} (rank ${rinfo.rank || 'unknown'})</div>`;
    }
    if (groups.length > 5) groupshtml += `<div class="item">... and ${groups.length-5} more groups</div>`;
    out.appendChild(createsection(`groups (${groups.length})`, groupshtml));

    let badgeshtml = '';
    const badges = data.badges || [];
    for (const badge of badges.slice(0,5)) {
        badgeshtml += `<div class="item">• ${badge.name || 'unknown'} → ${badge.displayName || 'unknown'}</div>`;
    }
    if (badges.length > 5) badgeshtml += `<div class="item">... and ${badges.length-5} more badges</div>`;
    out.appendChild(createsection(`badges earned (${badges.length})`, badgeshtml));

    let avatarhtml = '';
    const avatar = data.avatar || {};
    if (avatar.error) {
        avatarhtml += `<div class="item">• ${avatar.error}</div>`;
    } else {
        avatarhtml += `<div class="item">• type: ${avatar.avatarType || 'unknown'}</div>`;
        avatarhtml += `<div class="item">• scale: ${avatar.playerAvatarScale || 'unknown'}</div>`;
    }
    out.appendChild(createsection('avatar', avatarhtml));

    let headshothtml = '';
    const headshot = data.avatarheadshot || {};
    if (headshot.error) {
        headshothtml += `<div class="item">• unavailable</div>`;
    } else if (headshot.imageUrl) {
        headshothtml += `<div class="item">• ${headshot.imageUrl}</div>`;
    } else {
        headshothtml += `<div class="item">• unavailable</div>`;
    }
    out.appendChild(createsection('avatar headshot url', headshothtml));

    let inventoryhtml = '';
    const inv = data.inventory || [];
    for (const item of inv) {
        const iteminfo = item.item || {};
        inventoryhtml += `<div class="item">• ${iteminfo.name || 'unknown'} (id: ${iteminfo.id || 'unknown'})</div>`;
    }
    out.appendChild(createsection(`inventory (showing first ${inv.length} items)`, inventoryhtml));

    document.getElementById('outputsection').classList.remove('hidden');
}

document.getElementById('scrapebtn').addEventListener('click', function() {
    const username = document.getElementById('usernameinput').value.trim();
    if (!username) {
        document.getElementById('statusmsg').textContent = 'please enter a username';
        document.getElementById('statusmsg').className = 'statusmsg error';
        return;
    }
    fetchuserdata(username);
});

document.getElementById('usernameinput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        document.getElementById('scrapebtn').click();
    }
});

document.getElementById('themeselect').addEventListener('change', function() {
    const theme = this.value;
    document.body.className = theme;
});
