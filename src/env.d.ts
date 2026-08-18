import type { AppUser } from "./lib/auth";

declare global {
  namespace App {
    interface Locals {
      user?: AppUser;
    }
  }
}

export {};
