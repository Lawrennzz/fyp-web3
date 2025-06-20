declare module 'firebase/firestore' {
  import { Firestore, DocumentData, QuerySnapshot, DocumentSnapshot, Query } from '@firebase/firestore-types';
  export { Firestore, DocumentData, QuerySnapshot, DocumentSnapshot, Query };
  export function getFirestore(app?: any): Firestore;
  export function collection(firestore: Firestore, path: string): any;
  export function getDocs(query: Query): Promise<QuerySnapshot>;
  export function doc(firestore: Firestore, path: string, ...pathSegments: string[]): any;
  export function getDoc(documentRef: any): Promise<DocumentSnapshot>;
  export function setDoc(documentRef: any, data: any): Promise<void>;
  export function updateDoc(documentRef: any, data: any): Promise<void>;
  export function onSnapshot(query: Query, observer: { next?: (snapshot: QuerySnapshot) => void, error?: (error: Error) => void, complete?: () => void }): () => void;
  export function query(query: any, ...queryConstraints: any[]): Query;
  export function where(fieldPath: string, opStr: string, value: any): any;
  export function orderBy(fieldPath: string, directionStr?: 'asc' | 'desc'): any;
  export function addDoc(reference: any, data: any): Promise<any>;
  export function serverTimestamp(): any;
  export class Timestamp {
    seconds: number;
    nanoseconds: number;
    toDate(): Date;
    toMillis(): number;
    static now(): Timestamp;
    static fromDate(date: Date): Timestamp;
    static fromMillis(milliseconds: number): Timestamp;
  }
} 