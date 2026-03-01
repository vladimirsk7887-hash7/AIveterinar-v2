import { useState, useCallback } from 'react';
import { useMax } from './hooks/useMax';
import PetSelect from '../tg-mini-app/screens/PetSelect';
import Chat from '../tg-mini-app/screens/Chat';
import Appointment from '../tg-mini-app/screens/Appointment';

export default function MaxApp() {
  const { user, showBackButton, hideBackButton, hideMainButton, haptic } = useMax();
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
