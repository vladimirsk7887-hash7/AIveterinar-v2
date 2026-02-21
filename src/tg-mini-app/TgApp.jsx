import { useState, useCallback } from 'react';
import { useTelegram } from './hooks/useTelegram';
import PetSelect from './screens/PetSelect';
import Chat from './screens/Chat';
import Appointment from './screens/Appointment';

export default function TgApp() {
  const { user, showBackButton, hideBackButton, hideMainButton, haptic } = useTelegram();
  const [screen, setScreen] = useState('pet-select');
  const [petType, setPetType] = useState(null);
  const [chatState, setChatState] = useState(null);

  const goToChat = useCallback((pet) => {
    setPetType(pet);
    setScreen('chat');
    haptic('medium');
  }, [haptic]);

  const goToAppointment = useCallback(() => {
    setScreen('appointment');
    haptic('light');
  }, [haptic]);

  const goBack = useCallback(() => {
    if (screen === 'appointment') {
      setScreen('chat');
    } else if (screen === 'chat') {
      hideMainButton();
      setScreen('pet-select');
      setPetType(null);
      setChatState(null);
    }
    haptic('light');
  }, [screen, haptic, hideMainButton]);

  // Manage BackButton visibility
  if (screen === 'pet-select') {
    hideBackButton();
  } else {
    showBackButton(goBack);
  }

  switch (screen) {
    case 'pet-select':
      return <PetSelect onSelect={goToChat} />;
    case 'chat':
      return (
        <Chat
          petType={petType}
          userName={user?.first_name || ''}
          onAppointment={goToAppointment}
          chatState={chatState}
          onChatStateChange={setChatState}
        />
      );
    case 'appointment':
      return (
        <Appointment
          chatState={chatState}
          userName={user?.first_name || ''}
          onBack={goBack}
        />
      );
    default:
      return <PetSelect onSelect={goToChat} />;
  }
}
