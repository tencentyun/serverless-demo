interface ExportOptions {
    outdir: string;
    silent?: boolean;
    threads?: number;
    pages?: string[];
    buildExport?: boolean;
    statusMessage?: string;
}
export default function exportApp(dir: string, options: ExportOptions, configuration?: any): Promise<void>;
export {};
