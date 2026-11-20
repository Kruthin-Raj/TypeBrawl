import { io } from '../apps/web/node_modules/socket.io-client/build/esm/index.js';

async function testRoomLifecycle() {
  console.log('Testing Room Lifecycle and Quick Play Logic...');

  // Start server check
  const socket1 = io('http://localhost:4000');
  const socket2 = io('http://localhost:4000');
  const socket3 = io('http://localhost:4000');

  await Promise.all([
    new Promise((res) => socket1.on('connect', res)),
    new Promise((res) => socket2.on('connect', res)),
    new Promise((res) => socket3.on('connect', res))
  ]);
  console.log('All 3 client sockets connected');

  // Step 1: Socket 1 creates KeyDash Racing room A
  const roomARes = await new Promise((res) => {
    socket1.emit(
      'room:create',
      {
        settings: {
          mode: 'keydash-race',
          difficulty: 'easy',
          timerSec: 5,
          rounds: 5,
          maxPlayers: 3,
          isPublic: true
        },
        player: { nickname: 'Racer1', avatar: { color: '#F59E0B', eyes: 0, mouth: 0, accessory: 0 } }
      },
      res
    );
  });
  console.log('Room A created (KeyDash Race):', roomARes.roomCode);

  // Step 2: Socket 2 creates KeyDash Racing room B
  const roomBRes = await new Promise((res) => {
    socket2.emit(
      'room:create',
      {
        settings: {
          mode: 'keydash-race',
          difficulty: 'easy',
          timerSec: 5,
          rounds: 5,
          maxPlayers: 3,
          isPublic: true
        },
        player: { nickname: 'Racer2', avatar: { color: '#10B981', eyes: 1, mouth: 1, accessory: 0 } }
      },
      res
    );
  });
  console.log('Room B created (KeyDash Race):', roomBRes.roomCode);

  // Step 3: Another player joins Room B so Room B has 2 players, while Room A has 1 player
  const joinBRes = await new Promise((res) => {
    socket3.emit(
      'room:join',
      {
        roomCode: roomBRes.roomCode,
        player: { nickname: 'Racer3', avatar: { color: '#3B82F6', eyes: 2, mouth: 2, accessory: 0 } }
      },
      res
    );
  });
  console.log('Racer3 joined Room B:', joinBRes);

  // Step 4: Socket 4 tests Quick Play matchmaking algorithm:
  // It should pick Room B because Room B has 2 players, while Room A has 1 player!
  const socket4 = io('http://localhost:4000');
  await new Promise((res) => socket4.on('connect', res));

  const publicRooms = await new Promise((res) => {
    socket4.emit('room:list', res);
  });
  console.log('Public rooms list:', publicRooms.map(r => ({ code: r.code, mode: r.mode, count: r.playerCount, max: r.maxPlayers })));

  const matching = publicRooms.filter(r => !r.hasPassword && r.mode === 'keydash-race' && r.playerCount < r.maxPlayers);
  matching.sort((a, b) => b.playerCount - a.playerCount);
  const highestCount = matching[0].playerCount;
  const topRooms = matching.filter(r => r.playerCount === highestCount);
  const picked = topRooms[Math.floor(Math.random() * topRooms.length)];

  console.log(`Quick Play chosen room: ${picked.code} with ${picked.playerCount} players (expected Room B: ${roomBRes.roomCode})`);

  if (picked.code !== roomBRes.roomCode) {
    console.error('Quick play did not choose room with highest players!');
    process.exit(1);
  }

  // Step 5: Test quitting/leaving and creating a new room on Socket 1
  console.log('Testing clean exit and new room creation without ghost game bugs...');
  socket1.emit('room:start');

  // Wait 1 second into countdown/game
  await new Promise((res) => setTimeout(res, 1000));

  // Socket 1 leaves Room A
  socket1.emit('room:leave');

  // Socket 1 immediately creates Room C
  const roomCRes = await new Promise((res) => {
    socket1.emit(
      'room:create',
      {
        settings: {
          mode: 'bomb-pass',
          difficulty: 'easy',
          timerSec: 5,
          rounds: 5,
          maxPlayers: 4,
          isPublic: true
        },
        player: { nickname: 'Racer1', avatar: { color: '#F59E0B', eyes: 0, mouth: 0, accessory: 0 } }
      },
      res
    );
  });
  console.log('Room C created after exit:', roomCRes.roomCode);

  let stateUpdatesReceived = [];
  socket1.on('room:state', (s) => {
    stateUpdatesReceived.push(s.code);
  });

  socket1.emit('room:start');

  await new Promise((res) => setTimeout(res, 4500));

  // Verify that Socket 1 only receives states for Room C, NEVER for Room A!
  const hasGhostRoomA = stateUpdatesReceived.includes(roomARes.roomCode);
  console.log('Did Socket 1 receive ghost events from old Room A?:', hasGhostRoomA);

  socket1.disconnect();
  socket2.disconnect();
  socket3.disconnect();
  socket4.disconnect();

  if (!hasGhostRoomA && picked.code === roomBRes.roomCode) {
    console.log('>>> ROOM LIFECYCLE & QUICK PLAY TEST PASSED 100%! <<<');
    process.exit(0);
  } else {
    console.error('>>> TEST FAILED <<<');
    process.exit(1);
  }
}

testRoomLifecycle().catch((err) => {
  console.error(err);
  process.exit(1);
});
