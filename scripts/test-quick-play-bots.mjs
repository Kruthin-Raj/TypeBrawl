import { io } from '../apps/web/node_modules/socket.io-client/build/esm/index.js';

async function testQuickPlayBots() {
  console.log('Testing Quick Play 4 Bots Integration...');

  const socket = io('http://localhost:4000');
  await new Promise((res) => socket.on('connect', res));
  console.log('Socket connected');

  let latestState = null;
  socket.on('room:state', (s) => (latestState = s));

  // Step 1: Simulate Quick Play when 0 rooms exist
  const createRes = await new Promise((res) => {
    socket.emit(
      'room:create',
      {
        settings: {
          mode: 'keydash-race',
          difficulty: 'easy',
          timerSec: 5,
          rounds: 5,
          maxPlayers: 8,
          isPublic: true,
          withBots: true
        },
        player: { nickname: 'HumanPlayer', avatar: { color: '#F59E0B', eyes: 0, mouth: 0, accessory: 0 } }
      },
      res
    );
  });
  console.log('Room created with 4 bots:', createRes.roomCode);

  await new Promise((res) => setTimeout(res, 300));
  const roomState = latestState;

  const players = Object.values(roomState.players);
  console.log('Players in room:', players.map(p => ({ nickname: p.nickname, isBot: !!p.isBot, isReady: p.isReady })));

  const bots = players.filter(p => p.isBot);
  if (bots.length !== 4) {
    console.error(`Expected 4 bots, got ${bots.length}`);
    process.exit(1);
  }

  // Step 2: Start game with bots
  console.log('Starting KeyDash Race with 4 bots...');
  socket.emit('room:start');

  let botWordSolved = [];
  socket.on('game:word_solved', (data) => {
    console.log(`Word solved by: ${data.nickname} (+${data.points} pts in ${data.timeSec}s)`);
    botWordSolved.push(data);
  });

  const round1 = await new Promise((res) => socket.on('game:round_start', res));
  console.log('Round 1 active word:', round1.word);

  // Wait 4 seconds for bots to type their words
  await new Promise((res) => setTimeout(res, 4000));

  console.log(`Total word solves recorded: ${botWordSolved.length}`);
  const botsWhoSolved = botWordSolved.filter(b => b.nickname !== 'HumanPlayer');

  if (botsWhoSolved.length === 0) {
    console.error('No bots submitted word!');
    process.exit(1);
  }

  console.log('Bots successfully typed and solved words in real-time!');

  socket.emit('room:leave');
  socket.disconnect();

  console.log('>>> QUICK PLAY 4 BOTS TEST PASSED 100%! <<<');
  process.exit(0);
}

testQuickPlayBots().catch((err) => {
  console.error(err);
  process.exit(1);
});
