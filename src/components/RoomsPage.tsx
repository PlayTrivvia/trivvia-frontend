import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch } from '../store/hooks';
import { generateUsername } from '../store/usernameSlice';
import NavigationBar from './NavigationBar';
import './RoomsPage.css';

interface Room {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  isActive: boolean;
  buttonText: string;
}

const rooms: Room[] = [
  {
    id: 'general',
    name: 'General Knowledge',
    description: 'Mix of questions from all categories',
    icon: '🧠',
    color: '#6366F1',
    isActive: true,
    buttonText: 'Play'
  },
  {
    id: 'science',
    name: 'Science & Nature',
    description: 'Physics, chemistry, biology, and more',
    icon: '🔬',
    color: '#10B981',
    isActive: false,
    buttonText: 'Play'
  },
  {
    id: 'math',
    name: 'Mathematics',
    description: 'Numbers, equations, and problem solving',
    icon: '🧮',
    color: '#F59E0B',
    isActive: false,
    buttonText: 'Play'
  },
  {
    id: 'pop-culture',
    name: 'Pop Culture',
    description: 'Movies, music, TV shows, and celebrities',
    icon: '🎬',
    color: '#EF4444',
    isActive: false,
    buttonText: 'Play'
  },
  {
    id: 'history',
    name: 'History',
    description: 'World history, events, and figures',
    icon: '🏛️',
    color: '#8B5CF6',
    isActive: false,
    buttonText: 'Play'
  },
  {
    id: 'sports',
    name: 'Sports',
    description: 'Athletes, teams, and sporting events',
    icon: '⚽',
    color: '#06B6D4',
    isActive: false,
    buttonText: 'Play'
  },
  {
    id: 'geography',
    name: 'Geography',
    description: 'Countries, capitals, and landmarks',
    icon: '🌍',
    color: '#84CC16',
    isActive: false,
    buttonText: 'Play'
  },
  {
    id: 'literature',
    name: 'Literature',
    description: 'Books, authors, and literary works',
    icon: '📚',
    color: '#F97316',
    isActive: false,
    buttonText: 'Play'
  }
];

interface RoomsPageProps {
  onJoinRoom: () => void;
}

function RoomsPage({}: RoomsPageProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [showComingSoonModal, setShowComingSoonModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  const handleButtonClick = async (room: Room) => {
    if (room.isActive) {
      // Generate username and navigate to game
      try {
        await dispatch(generateUsername()).unwrap();
        navigate('/game');
      } catch (error) {
        console.error('Failed to generate username:', error);
      }
    } else {
      setSelectedRoom(room);
      setShowComingSoonModal(true);
    }
  };

  const closeModal = () => {
    setShowComingSoonModal(false);
    setSelectedRoom(null);
  };

  return (
    <div className="rooms-page">
      <NavigationBar currentPage="rooms" />
      <div className="rooms-container">
        <header className="rooms-header">
          <h1 className="rooms-title">Choose Your Challenge</h1>
          <p className="rooms-subtitle">Select a category and test your knowledge</p>
        </header>

        <div className="rooms-grid">
          {rooms.map((room) => (
            <div
              key={room.id}
              className={`room-card ${room.isActive ? 'active' : 'coming-soon'}`}
              style={{ '--room-color': room.color } as React.CSSProperties}
            >
              <div className="room-top-section" data-category={room.id}>
                <div className="room-icon">{room.icon}</div>
                <div className="room-content">
                  <h3 className="room-name">{room.name}</h3>
                  <p className="room-description">{room.description}</p>
                </div>
              </div>
              <div className="room-bottom-section">
                {room.isActive ? (
                  <button 
                    className="room-button active-button"
                    onClick={() => handleButtonClick(room)}
                  >
                    {room.buttonText}
                  </button>
                ) : (
                  <button 
                    className="room-button coming-soon-button"
                    onClick={() => handleButtonClick(room)}
                  >
                    Coming Soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Coming Soon Modal */}
      {showComingSoonModal && selectedRoom && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon">{selectedRoom.icon}</div>
              <h2 className="modal-title">{selectedRoom.name}</h2>
            </div>
            <div className="modal-body">
              <p className="modal-description">{selectedRoom.description}</p>
              <div className="coming-soon-message">
                <span className="coming-soon-text">Coming Soon!</span>
                <p className="coming-soon-subtext">This category is currently under development. Stay tuned for updates!</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-button" onClick={closeModal}>
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoomsPage;
