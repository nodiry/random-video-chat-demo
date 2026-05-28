// services/cache.ts
type UserInfo = { nick: string; did: string; id: string };

// temporary in-memory map
const users = new Map<string, UserInfo>();

// add a user
export function addUser(nick: string, did: string, id: string) {
  users.set(nick, { nick, did, id });
}

// get user
export function getUser(nick: string) {
  return users.get(nick);
}

// remove user
export function removeUser(nick: string) {
  users.delete(nick);
}

// optional: get all users
export function listUsers() {
  return Array.from(users.values());
}
