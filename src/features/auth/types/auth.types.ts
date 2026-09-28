export interface ApiUser {
  ID: number;
  Username: string;
  Email: string;
  Role?: "PLAYER" | "ADMIN";
}
