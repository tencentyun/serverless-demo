declare function flattenObject(obj: Record<string, any>, parentKey?: string, res?: Record<string, any>): Record<string, any>;
declare function printSecurityNotice(advisory: {
    advisory: string | null;
    message: string;
    severity: "low" | "medium" | "high" | "none";
}): void;

export { flattenObject, printSecurityNotice };
