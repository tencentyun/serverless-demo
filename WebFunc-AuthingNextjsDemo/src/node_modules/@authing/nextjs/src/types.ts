declare interface IronSessionData {
  // If we allow for any keys, then there's no more type check on unknown properties
  // which is not good
  // If we allow for any keys, the later delete will work but I prefer to disable the
  // check at this stage and
  // provide good type checking instead
  [key: string]: unknown;
}

declare type IronSession = IronSessionData & {
  /**
   * Destroys the session data and removes the cookie.
   */
  destroy: () => void;

  /**
   * Encrypts the session data and sets the cookie.
   */
  save: () => Promise<void>;
};

declare module 'http' {
  interface IncomingMessage {
    session: IronSession;
  }
}
