import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectIsAdmin, selectUser } from "@/features/auth/slices/authSlice";

export default function PublicRoute() {
  const user = useSelector(selectUser);
  const isAdmin = useSelector(selectIsAdmin);

  if (user) {
    return <Navigate to={isAdmin ? "/" : "/call"} replace />;
  }

  return <Outlet />;
}
