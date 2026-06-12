const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const fs         = require('fs');
const path       = require('path');

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, { cors: { origin: '*' } });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Estado global ---
const DATA_FILE = path.join(__dirname, 'data.json');

function loadData() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return { users: [], config: defaultConfig() }; }
}

function saveData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
}

function defaultConfig() {
  return {
    speed:         1.0,
    warpIntensity: 1.0,
    starCount:     700,
    theme: {
      bgColor:   '#000008',
      nebulaHue: 220,
      starColor: 'blue',
      ringColor: 'cyan'
    },
    showQR:  true,
    paused:  false
  };
}

const state = loadData();
if (!state.config) state.config = defaultConfig();
if (!state.users)  state.users  = [];

// --- Rutas REST ---
app.get('/api/config', (_, res) => res.json(state.config));
app.get('/api/users',  (_, res) => res.json(state.users));

app.get('/api/users/csv', (_, res) => {
  const lines = ['instagram,tiempo,warps'];
  for (const u of state.users)
    lines.push(`${u.instagram},${u.joinedAt},${u.warps || 0}`);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="visitantes.csv"');
  res.send(lines.join('\n'));
});

app.post('/api/config', (req, res) => {
  Object.assign(state.config, req.body);
  saveData();
  io.to('main').emit('config_update', state.config);
  res.json({ ok: true });
});

app.delete('/api/users', (_, res) => {
  state.users = [];
  saveData();
  io.to('control').emit('users_update', state.users);
  res.json({ ok: true });
});

// --- Socket.io ---
io.on('connection', (socket) => {
  const role = socket.handshake.query.role || 'user';
  socket.join(role);

  if (role === 'main') {
    socket.emit('config_update', state.config);
    console.log('[main] pantalla conectada');
  }

  if (role === 'control') {
    socket.emit('config_update', state.config);
    socket.emit('users_update', state.users);
    console.log('[control] panel conectado');
  }

  if (role === 'user') {
    socket.on('user_join', (data) => {
      const ig = (data.instagram || '')
        .toLowerCase()
        .replace(/[^a-z0-9._]/g, '')
        .slice(0, 30);
      if (!ig) return;

      let user = state.users.find(u => u.instagram === ig);
      if (!user) {
        user = { instagram: ig, joinedAt: new Date().toISOString(), warps: 0, socketId: socket.id };
        state.users.push(user);
      } else {
        user.socketId = socket.id;
      }
      saveData();

      socket.data.instagram = ig;
      socket.emit('join_ok', { instagram: ig, config: state.config });
      io.to('control').emit('users_update', state.users);
      io.to('main').emit('user_joined', { instagram: ig });
      console.log('[user] @' + ig + ' conectado');
    });

    // El usuario toca el pad -> warp
    socket.on('warp', (data) => {
      if (state.config.paused) return;
      const ig = socket.data.instagram;
      if (!ig) return;

      const user = state.users.find(u => u.instagram === ig);
      if (user) { user.warps = (user.warps || 0) + 1; saveData(); }

      io.to('main').emit('warp', { nx: data.nx, ny: data.ny, instagram: ig });
      io.to('control').emit('warp_event', { instagram: ig, nx: data.nx, ny: data.ny, ts: Date.now() });
      socket.emit('warp_ack');
    });

    socket.on('disconnect', () => {
      const ig = socket.data.instagram;
      if (ig) io.to('main').emit('user_left', { instagram: ig });
      console.log('[user] @' + (ig || '?') + ' desconectado');
    });
  }

  // Control panel
  socket.on('set_config', (cfg) => {
    Object.assign(state.config, cfg);
    saveData();
    io.to('main').emit('config_update', state.config);
    socket.emit('config_update', state.config);
  });

  socket.on('force_warp', (data) => {
    io.to('main').emit('warp', { nx: data.nx || 0.5, ny: data.ny || 0.5, instagram: 'control' });
  });

  socket.on('reset_scene', () => {
    io.to('main').emit('reset_scene');
  });
});

// --- Keep-alive para Render.com (free tier) ---
app.get('/ping', (_, res) => res.send('pong'));
setInterval(() => {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (url) require('https').get(url + '/ping', () => {}).on('error', () => {});
}, 14 * 60 * 1000);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Galaxias Warp en puerto ' + PORT));
