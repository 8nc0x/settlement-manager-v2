import 'next-auth';
import { DefaultSession } from 'next-auth';
import { Role } from './index';

declare module 'bcryptjs' {
  export function hash(s: string, salt: number | string): Promise<string>;
  export function hashSync(s: string, salt?: number | string): string;
  export function compare(s: string, hash: string): Promise<boolean>;
  export function compareSync(s: string, hash: string): boolean;
  export function genSalt(rounds?: number): Promise<string>;
  export function genSaltSync(rounds?: number): string;
}

declare module 'pg' {
  export interface QueryResult<T = any> {
    rows: T[];
    rowCount: number | null;
    command: string;
    oid: number;
    fields: any[];
  }

  export interface PoolConfig {
    connectionString?: string;
    ssl?: boolean | { rejectUnauthorized: boolean };
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  }

  export class Pool {
    constructor(config?: PoolConfig);
    query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>>;
    end(): Promise<void>;
    connect(): Promise<any>;
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      businessName?: string;
      phone?: string;
      defaultUpiId?: string;
      subAdminId?: string;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    role: Role;
    businessName?: string;
    phone?: string;
    defaultUpiId?: string;
    subAdminId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    businessName?: string;
    phone?: string;
    defaultUpiId?: string;
    subAdminId?: string;
  }
}
