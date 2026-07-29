import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import { clearUser } from "@/features/auth/slices/authSlice";
import { useVicidialPopup } from "@/shared/context/VicidialPopupContext";

/** Closes the ViciDial popup, clears the session and returns to /login. */
export function useLogout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { closePopup } = useVicidialPopup();

  return useCallback(() => {
    closePopup();
    dispatch(clearUser());
    navigate("/login", { replace: true });
  }, [closePopup, dispatch, navigate]);
}
