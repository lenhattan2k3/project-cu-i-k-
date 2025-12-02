import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export type UserRole = "admin" | "partner" | "user";

export interface StoredUser {
  _id?: string;
  email?: string;
  ten?: string;
  photoURL?: string;
  partnerId?: string;
  role?: UserRole | string;
  [key: string]: unknown;
}

const ROLE_REDIRECT: Record<UserRole, string> = {
  admin: "/homeadmin",
  partner: "/homepartner",
  user: "/homeuser",
};

/**
 * Keeps a screen scoped to the correct role. Whenever the stored user is missing,
 * invalid, or belongs to another role, the hook immediately redirects to the
 * appropriate entry point and returns null.
 */
export function useRoleGuard(expectedRole: UserRole) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<StoredUser | null>(null);

  useEffect(() => {
    const enforceRole = (rawValue: string | null) => {
      if (!rawValue) {
        setCurrentUser(null);
        navigate("/login", { replace: true });
        return;
      }

      try {
        const parsed = JSON.parse(rawValue) as StoredUser;
        const role = parsed.role as UserRole | undefined;
        setCurrentUser(parsed);

        if (!role) {
          navigate("/login", { replace: true });
          return;
        }

        if (role !== expectedRole) {
          navigate(ROLE_REDIRECT[role] ?? "/login", { replace: true });
        }
      } catch (err) {
        console.error("Failed to parse user from storage", err);
        localStorage.removeItem("user");
        setCurrentUser(null);
        navigate("/login", { replace: true });
      }
    };

    enforceRole(localStorage.getItem("user"));

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "user") {
        enforceRole(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [expectedRole, navigate]);

  return currentUser;
}
