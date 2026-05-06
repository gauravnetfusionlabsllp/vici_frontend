import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAdmin, selectUser } from "@/features/auth/slices/authSlice";

export default function PrivateRoute({ allowedAdmin }) {
  const location = useLocation();

  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedAdmin === true && !isAdmin) {
    return <Navigate to="/unauthorized" replace state={{ requiredRole: "Admin" }} />;
  }

  if (allowedAdmin === false && isAdmin) {
    return <Navigate to="/unauthorized" replace state={{ requiredRole: "Agent" }} />;
  }

  return <Outlet />;
}
