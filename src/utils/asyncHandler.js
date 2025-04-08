export default function asyncHandler(fn) {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (err) {
            throw err instanceof Error ? err : new Error(String(err));
        }
    };
}