import { useState, useEffect } from 'react'
import { io } from 'socket.io-client'
import Canvas from './components/Canvas'
import Chat from './components/Chat'
import PlayerList from './components/PlayerList'

const socket = io(import.meta.env.VITE_SERVER_URL || 'https://testv2-1lna.onrender.com')

export default function App() {
  const [playerName, setPlayerName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [isDrawer, setIsDrawer] = useState(false)
  const [players, setPlayers] = useState([])
  const [word, setWord] = useState('')

  useEffect(() => {
    socket.on('newRound', ({ drawer, drawerName }) => {
      setIsDrawer(socket.id === drawer)
      setPlayers(prevPlayers => 
        prevPlayers.map(p => ({
          ...p,
          isDrawing: p.id === drawer
        }))
      )
    })

    socket.on('wordToGuess', (newWord) => {
      setWord(newWord)
    })

    socket.on('correctGuess', ({ playerId, playerName, score }) => {
      setPlayers(prevPlayers => 
        prevPlayers.map(p => 
          p.id === playerId ? { ...p, score } : p
        )
      )
    })

    return () => {
      socket.off('newRound')
      socket.off('wordToGuess')
      socket.off('correctGuess')
    }
  }, [])

  const createRoom = () => {
    if (!playerName) return
    socket.emit('createRoom', playerName, (roomId) => {
      setRoomId(roomId)
      setGameStarted(true)
      setPlayers([{ id: socket.id, name: playerName, score: 0 }])
    })
  }

  const joinRoom = () => {
    if (!playerName || !roomId) return
    socket.emit('joinRoom', roomId, playerName, (response) => {
      if (response.error) {
        alert(response.error)
        return
      }
      setGameStarted(true)
    })
  }

  if (!gameStarted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-center mb-8">Skribbl Clone</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Room ID
              </label>
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter room ID to join"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={createRoom}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Create Room
              </button>
              <button
                onClick={joinRoom}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-[1fr,300px] gap-4">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            {isDrawer && <div className="text-xl font-bold mb-4">Word: {word}</div>}
            <Canvas isDrawer={isDrawer} socket={socket} roomId={roomId} />
          </div>
        </div>
        <div className="space-y-4">
          <PlayerList players={players} />
          <Chat socket={socket} roomId={roomId} />
        </div>
      </div>
    </div>
  )
}
