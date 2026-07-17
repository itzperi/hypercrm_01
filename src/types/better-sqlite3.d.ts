declare module "better-sqlite3" {
  import { EventEmitter } from "events";

  type BindableValue = string | number | bigint | Buffer | Uint8Array | null;

  interface Statement<T = unknown> {
    get(...params: BindableValue[]): T | undefined;
    all(...params: BindableValue[]): T[];
    run(...params: BindableValue[]): { changes: number; lastInsertRowid: number };
  }

  interface Database<T = unknown> extends EventEmitter {
    prepare(sql: string): Statement<T>;
    exec(sql: string): void;
    close(): void;
  }

  interface BetterSqlite3Module {
    new (filename: string): Database;
  }

  const Database: BetterSqlite3Module;
  export default Database;
}
