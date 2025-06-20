// This file is used to fix conflicts in Node.js type definitions
declare global {
    interface SymbolConstructor {
        readonly iterator: unique symbol;
        readonly asyncIterator: unique symbol;
    }
    
    interface Iterator<T, TReturn = any, TNext = undefined> {
        // NOTE: 'next' is defined using a tuple to ensure we report the correct assignability errors in all places.
        next(...args: [] | [TNext]): IteratorResult<T, TReturn>;
        return?(value?: TReturn): IteratorResult<T, TReturn>;
        throw?(e?: any): IteratorResult<T, TReturn>;
    }

    interface AsyncIterator<T, TReturn = any, TNext = undefined> {
        next(...args: [] | [TNext]): Promise<IteratorResult<T, TReturn>>;
        return?(value?: TReturn | PromiseLike<TReturn>): Promise<IteratorResult<T, TReturn>>;
        throw?(e?: any): Promise<IteratorResult<T, TReturn>>;
    }
}

export {}; 