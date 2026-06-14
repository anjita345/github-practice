// users.js - users page and private messaging
const socket = io();

const usersList = document.getElementById('usersList');
const privateChats = document.getElementById('privateChats');
const currentUserLabel = document.getElementById('currentUser');

let myName = localStorage.getItem('pc_name');
let myGender = localStorage.getItem('pc_gender');
let myId = null;

if (!myName || !myGender) {
  // not joined — go back to join page
  window.location = '/';
}

// Conversations stored client-side while page is open
const convos = new Map();

function convoKey(a,b){ if(!a||!b) return null; return a<b? `${a}_${b}`:`${b}_${a}` }

// utility to open private panel
function openPrivatePanel(target){
  const targetId = target.id;
  let panel = document.getElementById('panel-' + targetId);
  if (panel) return panel;

  panel = document.createElement('div');
  panel.className = 'private-panel';
  panel.id = 'panel-' + targetId;

  const header = document.createElement('div');
  header.className = 'panel-header';
  header.textContent = target.name + (target.gender ? ' (' + target.gender + ')' : '');

  const body = document.createElement('div');
  body.className = 'panel-body';
  body.id = 'panel-body-' + targetId;

  const inputWrap = document.createElement('form');
  inputWrap.className = 'panel-input';
  inputWrap.addEventListener('submit', (e)=>{
    e.preventDefault();
    const input = inputWrap.querySelector('input');
    const text = input.value.trim();
    if (!text) return;
    appendPrivateMessage(targetId, { fromId: myId, fromName: myName, text, ts: Date.now() }, { me:true });
    socket.emit('private message', { to: targetId, text });
    const list = convos.get(targetId) || [];
    list.push({ fromId: myId, fromName: myName, text, ts: Date.now() });
    convos.set(targetId, list);
    input.value = '';
  });

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Message ' + target.name;

  inputWrap.appendChild(input);

  panel.appendChild(header);
  panel.appendChild(body);
  panel.appendChild(inputWrap);

  privateChats.appendChild(panel);

  const saved = convos.get(targetId) || [];
  saved.forEach(msg => appendPrivateMessage(targetId, msg, { me: msg.fromId === myId }));

  return panel;
}

function appendPrivateMessage(targetId, msg, opts={}){
  const body = document.getElementById('panel-body-' + (targetId));
  if (!body) return;
  const el = document.createElement('div');
  el.className = 'private-msg';
  if (opts.me) el.classList.add('me');
  const who = document.createElement('div');
  who.className = 'meta';
  who.textContent = msg.fromId === myId ? 'You' : (msg.fromName || 'Them');
  const text = document.createElement('div');
  text.className = 'text';
  text.textContent = msg.text;
  el.appendChild(who);
  el.appendChild(text);
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
}

function renderUsers(list){
  usersList.innerHTML = '';
  list.forEach(user =>{
    const li = document.createElement('li');
    li.className = 'user-item';
    if (user.id === myId) {
      const selfLabel = document.createElement('div');
      selfLabel.className = 'user-meta';
      selfLabel.textContent = user.name + ' (You)';
      li.appendChild(document.createElement('div'));
      li.appendChild(selfLabel);
      usersList.appendChild(li);
      return;
    }
    li.tabIndex = 0;
    li.addEventListener('click', ()=> openPrivatePanel(user));

    const avatar = document.createElement('div');
    avatar.className = 'user-avatar';
    avatar.textContent = (user.name || '?').slice(0,2).toUpperCase();

    const meta = document.createElement('div');
    meta.className = 'user-meta';
    const nameEl = document.createElement('div');
    nameEl.className = 'user-name';
    nameEl.textContent = user.name;
    const genderEl = document.createElement('div');
    genderEl.className = 'user-gender';
    genderEl.textContent = user.gender;

    meta.appendChild(nameEl);
    meta.appendChild(genderEl);

    li.appendChild(avatar);
    li.appendChild(meta);
    usersList.appendChild(li);
  });
}

// socket handlers
socket.on('connect', ()=>{
  myId = socket.id;
  currentUserLabel.textContent = myName;
  // send join
  socket.emit('join', { name: myName, gender: myGender });
});

socket.on('users', (list)=>{
  renderUsers(list);
});

socket.on('system', (data)=>{
  // optional: show small notification
  console.log('system:', data.message);
});

socket.on('private message', (payload)=>{
  if (!payload || !payload.fromId) return;
  // save
  const target = payload.fromId === myId ? payload.toId : payload.fromId;
  const key = payload.fromId === myId ? payload.toId : payload.fromId;
  const list = convos.get(key) || [];
  list.push({ fromId: payload.fromId, fromName: payload.fromName, text: payload.text, ts: payload.ts });
  convos.set(key, list);

  // ensure panel
  const panelId = payload.fromId === myId ? payload.toId : payload.fromId;
  let panel = document.getElementById('panel-' + (panelId));
  if (!panel){
    const userObj = { id: payload.fromId, name: payload.fromName, gender: '' };
    panel = openPrivatePanel(userObj);
  }

  // ignore echoes from self
  if (payload.fromId === myId) return;
  appendPrivateMessage(payload.fromId, { fromId: payload.fromId, fromName: payload.fromName, text: payload.text, ts: payload.ts }, { me: false });
});

socket.on('error', (err)=>{
  console.error('socket error', err);
});