type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RequiredBy<T, K extends keyof T> = T & {
    [P in K]-?: T[P];
};

export { PartialBy, RequiredBy };
