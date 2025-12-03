export interface User {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "SUPER_ADMIN";
}