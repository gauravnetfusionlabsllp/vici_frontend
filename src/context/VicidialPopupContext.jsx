import { createContext, useContext, useRef, useEffect } from "react";

const VicidialPopupContext = createContext(null);

export const VicidialPopupProvider = ({ children }) => {
  const vicidialPopupRef = useRef(null);
  const intervalRef = useRef(null);

  // Open popup
  const openPopup = () => {
    if (!vicidialPopupRef.current || vicidialPopupRef.current.closed) {
      vicidialPopupRef.current = window.open(
        "http://192.168.15.165:5165/agc/vicidial.php",
        "VICIDIAL_POPUP",
        "width=1100,height=750,left=100,top=50,resizable=yes,scrollbars=yes"
      );
    }

    // Start soft-keep-alive interval
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        if (!vicidialPopupRef.current || vicidialPopupRef.current.closed) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return;
        }
        // Soft touch to keep popup "active" for VICIdial functionality
        vicidialPopupRef.current.document.title =
          vicidialPopupRef.current.document.title;
      }, 30000); // every 30 seconds
    }
  };

  // Optional: bring popup to front (only if needed)
  const focusPopup = () => {
    if (vicidialPopupRef.current && !vicidialPopupRef.current.closed) {
      vicidialPopupRef.current.focus();
    }
  };

  // Close popup
  const closePopup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (vicidialPopupRef.current && !vicidialPopupRef.current.closed) {
      vicidialPopupRef.current.close();
      vicidialPopupRef.current = null;
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      closePopup();
    };
  }, []);

  return (
    <VicidialPopupContext.Provider
      value={{ openPopup, closePopup, focusPopup }}
    >
      {children}
    </VicidialPopupContext.Provider>
  );
};

export const useVicidialPopup = () => useContext(VicidialPopupContext);
