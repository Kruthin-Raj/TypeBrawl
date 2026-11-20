import { io } from '../apps/web/node_modules/socket.io-client/build/esm/index.js';

async function testLobbyBotsAndStart() {
  console.log('--- Testing Lobby Bots & Start Verification ---');
  const socket = io('http://localhost:4000');
  await new Promise((resolve) => socket.on('connect', resolve));
  console.log('Connected to server');

  let currentState = null;
  socket.on('room:state', (s) => {
    currentState = s;
  });

  // 1. Create a room
  const createRes = await new Promise((resolve) => {
    socket.emit(
      'room:create',
      {
        settings: {
          mode: 'keydash-race',
          difficulty: 'easy',
          timerSec: 5,
          rounds: 5,
          maxPlayers: 8,
          isPublic: true
        },
        player: { nickname: 'Alice', avatar: { color: '#F59E0B', eyes: 0, mouth: 0, accessory: 0 } }
      },
      resolve
    );
  });

  console.log('Room created:', createRes.roomCode);
  await new Promise((r) => setTimeout(r, 200));

  // Check initial bot count
  const initialPlayers = Object.values(currentState.players);
  console.log(`Initial player count: ${initialPlayers.length}`);
  const initialBots = initialPlayers.filter((p) => p.isBot);
  console.log(`Initial bot count: ${initialBots.length}`);
  if (initialBots.length !== 0 || initialPlayers.length !== 1) {
    throw new Error(`Expected initially 0 bots and 1 player, got ${initialBots.length} bots, ${initialPlayers.length} players`);
  }
  console.log('✓ Verified: Room initially has 0 bots.');

  // 2. Try to start game with 1 player alone
  console.log('Attempting to start game alone with 1 player...');
  socket.emit('room:start');
  await new Promise((r) => setTimeout(r, 500));
  if (currentState.status !== 'lobby') {
    throw new Error(`Game should NOT start with only 1 player alone! Current status: ${currentState.status}`);
  }
  console.log('✓ Verified: Game does not start when player is alone in lobby.');

  // 3. Add Bot 1
  console.log('Emitting room:add_bot...');
  socket.emit('room:add_bot');
  await new Promise((r) => setTimeout(r, 300));
  let bots = Object.values(currentState.players).filter((p) => p.isBot);
  console.log(`Bot count after add_bot: ${bots.length} (${bots.map((b) => b.nickname).join(', ')})`);
  if (bots.length !== 1) {
    throw new Error(`Expected 1 bot, got ${bots.length}`);
  }
  console.log('✓ Verified: 1st bot added successfully.');

  // 4. Add Bot 2
  console.log('Emitting room:add_bot again...');
  socket.emit('room:add_bot');
  await new Promise((r) => setTimeout(r, 300));
  bots = Object.values(currentState.players).filter((p) => p.isBot);
  console.log(`Bot count after second add_bot: ${bots.length} (${bots.map((b) => b.nickname).join(', ')})`);
  if (bots.length !== 2) {
    throw new Error(`Expected 2 bots, got ${bots.length}`);
  }
  console.log('✓ Verified: 2nd bot added successfully.');

  // 5. Remove Bot
  console.log('Emitting room:remove_bot...');
  socket.emit('room:remove_bot');
  await new Promise((r) => setTimeout(r, 300));
  bots = Object.values(currentState.players).filter((p) => p.isBot);
  console.log(`Bot count after remove_bot: ${bots.length} (${bots.map((b) => b.nickname).join(', ')})`);
  if (bots.length !== 1) {
    throw new Error(`Expected 1 bot after remove_bot, got ${bots.length}`);
  }
  console.log('✓ Verified: Bot removed successfully.');

  // 6. Start Game now that we have 2 combatants (1 human + 1 bot)
  console.log('Emitting room:start with 2 combatants...');
  socket.emit('room:start');
  await new Promise((r) => setTimeout(r, 600));
  console.log(`Room status after start: ${currentState.status}`);
  if (currentState.status !== 'countdown' && currentState.status !== 'in-game') {
    throw new Error(`Game should start when >= 2 players! Current status: ${currentState.status}`);
  }
  console.log('✓ Verified: Game successfully starts with >= 2 players.');

  socket.disconnect();
  console.log('ALL TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}

testLobbyBotsAndStart().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
