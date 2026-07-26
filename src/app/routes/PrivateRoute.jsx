import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAdmin, selectUser, selectIsWhatsappAdmin } from "@/features/auth/slices/authSlice";

export default function PrivateRoute({ allowedAdmin, requireAdminr = false }) {
  const location = useLocation();

  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);
  const isWhatsappAdmin = useSelector(selectIsWhatsappAdmin);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedAdmin === true && !isAdmin) {
    return <Navigate to="/unauthorized" replace state={{ requiredRole: "Admin" }} />;
  }

  if (allowedAdmin === false && isAdmin) {
    return <Navigate to="/unauthorized" replace state={{ requiredRole: "Agent" }} />;
  }

  if (requireAdminr && !isWhatsappAdmin) {
    return <Navigate to="/unauthorized" replace state={{ requiredRole: "adminr" }} />;
  }

  return <Outlet />;
}
