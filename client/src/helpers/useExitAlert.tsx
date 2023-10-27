import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useExitAlert(changesMade = false) {
    const goTo = useNavigate();

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (changesMade) {
                e.preventDefault();
                e.returnValue = ''; // Some browsers require this to display the message
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [changesMade]);
}
