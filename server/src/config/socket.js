const socketIo = require('socket.io');

let io;

const initSocket = (server) => {
    io = socketIo(server, {
        cors: {
            origin: "*", // Allow all for now, restrict in production
            methods: ["GET", "POST"]
        }
    });

    io.on('connection', (socket) => {
        console.log('New client connected', socket.id);

        // Join user to their own room for private messages
        socket.on('join', (userId) => {
            console.log(`User ${userId} joined room ${userId}`);
            socket.join(userId);
        });

        // Join community room
        socket.on('joinCommunity', (communityId) => {
            console.log(`User joined community ${communityId}`);
            socket.join(`community_${communityId}`);
        });

        socket.on('sendMessage', (data) => {
            // This is primarily for real-time acknowledgement, actual saving is done via API to ensure persistency
            // But we can also broadcast from here if we want to bypass API for speed (hybrid approach)
            // For this implementation, we will rely on the API controller to emit events via the 'io' instance
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected', socket.id);
        });
    });

    return io;
};

const getIo = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};

module.exports = { initSocket, getIo };
