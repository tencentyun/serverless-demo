import { Sandbox as Sandbox$1 } from 'e2b';
export * from 'e2b';

/**
 * Chart types
 */
declare enum ChartType {
    LINE = "line",
    SCATTER = "scatter",
    BAR = "bar",
    PIE = "pie",
    BOX_AND_WHISKER = "box_and_whisker",
    SUPERCHART = "superchart",
    UNKNOWN = "unknown"
}
/**
 * Ax scale types
 */
declare enum ScaleType {
    LINEAR = "linear",
    DATETIME = "datetime",
    CATEGORICAL = "categorical",
    LOG = "log",
    SYMLOG = "symlog",
    LOGIT = "logit",
    FUNCTION = "function",
    FUNCTIONLOG = "functionlog",
    ASINH = "asinh"
}
/**
 * Represents a chart.
 */
type Chart = {
    type: ChartType;
    title: string;
    elements: any[];
};
type Chart2D = Chart & {
    x_label?: string;
    y_label?: string;
    x_unit?: string;
    y_unit?: string;
};
type PointData = {
    label: string;
    points: [number | string, number | string][];
};
type PointChart = Chart2D & {
    x_ticks: (number | string)[];
    x_scale: ScaleType;
    x_tick_labels: string[];
    y_ticks: (number | string)[];
    y_scale: ScaleType;
    y_tick_labels: string[];
    elements: PointData[];
};
type LineChart = PointChart & {
    type: ChartType.LINE;
};
type ScatterChart = PointChart & {
    type: ChartType.SCATTER;
};
type BarData = {
    label: string;
    value: string;
    group: string;
};
type BarChart = Chart2D & {
    type: ChartType.BAR;
    elements: BarData[];
};
type PieData = {
    label: string;
    angle: number;
    radius: number;
};
type PieChart = Chart & {
    type: ChartType.PIE;
    elements: PieData[];
};
type BoxAndWhiskerData = {
    label: string;
    min: number;
    first_quartile: number;
    median: number;
    third_quartile: number;
    max: number;
    outliers: number[];
};
type BoxAndWhiskerChart = Chart2D & {
    type: ChartType.BOX_AND_WHISKER;
    elements: BoxAndWhiskerData[];
};
type SuperChart = Chart & {
    type: ChartType.SUPERCHART;
    elements: Chart[];
};
type ChartTypes = LineChart | ScatterChart | BarChart | PieChart | BoxAndWhiskerChart | SuperChart;

/**
 * Represents an output message from the sandbox code execution.
 */
declare class OutputMessage {
    /**
     * The output line.
     */
    readonly line: string;
    /**
     * Unix epoch in nanoseconds.
     */
    readonly timestamp: number;
    /**
     * Whether the output is an error.
     */
    readonly error: boolean;
    constructor(
    /**
     * The output line.
     */
    line: string, 
    /**
     * Unix epoch in nanoseconds.
     */
    timestamp: number, 
    /**
     * Whether the output is an error.
     */
    error: boolean);
    toString(): string;
}
/**
 * Represents an error that occurred during the execution of a cell.
 * The error contains the name of the error, the value of the error, and the traceback.
 */
declare class ExecutionError {
    /**
     * Name of the error.
     **/
    name: string;
    /**
     * Value of the error.
     **/
    value: string;
    /**
     * The raw traceback of the error.
     **/
    traceback: string;
    constructor(
    /**
     * Name of the error.
     **/
    name: string, 
    /**
     * Value of the error.
     **/
    value: string, 
    /**
     * The raw traceback of the error.
     **/
    traceback: string);
}
/**
 * Represents a MIME type.
 */
type MIMEType = string;
type E2BData = {
    data: Record<string, unknown>;
    chart: ChartTypes;
};
/**
 * Dictionary that maps MIME types to their corresponding representations of the data.
 */
type RawData = {
    [key: MIMEType]: string;
} & E2BData;
/**
 * Represents the data to be displayed as a result of executing a cell in a Jupyter notebook.
 * The result is similar to the structure returned by ipython kernel: https://ipython.readthedocs.io/en/stable/development/execution.html#execution-semantics
 *
 *
 * The result can contain multiple types of data, such as text, images, plots, etc. Each type of data is represented
 * as a string, and the result can contain multiple types of data. The display calls don't have to have text representation,
 * for the actual result the representation is always present for the result, the other representations are always optional.
 */
declare class Result {
    readonly isMainResult: boolean;
    /**
     * Text representation of the result.
     */
    readonly text?: string;
    /**
     * HTML representation of the data.
     */
    readonly html?: string;
    /**
     * Markdown representation of the data.
     */
    readonly markdown?: string;
    /**
     * SVG representation of the data.
     */
    readonly svg?: string;
    /**
     * PNG representation of the data.
     */
    readonly png?: string;
    /**
     * JPEG representation of the data.
     */
    readonly jpeg?: string;
    /**
     * PDF representation of the data.
     */
    readonly pdf?: string;
    /**
     * LaTeX representation of the data.
     */
    readonly latex?: string;
    /**
     * JSON representation of the data.
     */
    readonly json?: string;
    /**
     * JavaScript representation of the data.
     */
    readonly javascript?: string;
    /**
     * Contains the data from DataFrame.
     */
    readonly data?: Record<string, unknown>;
    /**
     * Contains the chart data.
     */
    readonly chart?: ChartTypes;
    /**
     * Extra data that can be included. Not part of the standard types.
     */
    readonly extra?: any;
    readonly raw: RawData;
    constructor(rawData: RawData, isMainResult: boolean);
    /**
     * Returns all the formats available for the result.
     *
     * @returns Array of strings representing the formats available for the result.
     */
    formats(): string[];
    /**
     * Returns the serializable representation of the result.
     */
    toJSON(): {
        extra?: any;
        text: string | undefined;
        html: string | undefined;
        markdown: string | undefined;
        svg: string | undefined;
        png: string | undefined;
        jpeg: string | undefined;
        pdf: string | undefined;
        latex: string | undefined;
        json: string | undefined;
        javascript: string | undefined;
    };
}
/**
 * Data printed to stdout and stderr during execution, usually by print statements, logs, warnings, subprocesses, etc.
 */
type Logs = {
    /**
     * List of strings printed to stdout by prints, subprocesses, etc.
     */
    stdout: string[];
    /**
     * List of strings printed to stderr by prints, subprocesses, etc.
     */
    stderr: string[];
};
/**
 * Represents the result of a cell execution.
 */
declare class Execution {
    /**
     * List of result of the cell (interactively interpreted last line), display calls (e.g. matplotlib plots).
     */
    results: Result[];
    /**
     * Logs printed to stdout and stderr during execution.
     */
    logs: Logs;
    /**
     * An Error object if an error occurred, null otherwise.
     */
    error?: ExecutionError | undefined;
    /**
     * Execution count of the cell.
     */
    executionCount?: number | undefined;
    constructor(
    /**
     * List of result of the cell (interactively interpreted last line), display calls (e.g. matplotlib plots).
     */
    results?: Result[], 
    /**
     * Logs printed to stdout and stderr during execution.
     */
    logs?: Logs, 
    /**
     * An Error object if an error occurred, null otherwise.
     */
    error?: ExecutionError | undefined, 
    /**
     * Execution count of the cell.
     */
    executionCount?: number | undefined);
    /**
     * Returns the text representation of the main result of the cell.
     */
    get text(): string | undefined;
    /**
     * Returns the serializable representation of the execution result.
     */
    toJSON(): {
        results: Result[];
        logs: Logs;
        error: ExecutionError | undefined;
    };
}

/**
 * Represents a context for code execution.
 */
type Context = {
    /**
     * The ID of the context.
     */
    id: string;
    /**
     * The language of the context.
     */
    language: string;
    /**
     * The working directory of the context.
     */
    cwd: string;
};
/**
 * Options for running code.
 */
interface RunCodeOpts {
    /**
     * Callback for handling stdout messages.
     */
    onStdout?: (output: OutputMessage) => Promise<any> | any;
    /**
     * Callback for handling stderr messages.
     */
    onStderr?: (output: OutputMessage) => Promise<any> | any;
    /**
     * Callback for handling the final execution result.
     */
    onResult?: (data: Result) => Promise<any> | any;
    /**
     * Callback for handling the `ExecutionError` object.
     */
    onError?: (error: ExecutionError) => Promise<any> | any;
    /**
     * Custom environment variables for code execution.
     *
     * @default {}
     */
    envs?: Record<string, string>;
    /**
     * Timeout for the code execution in **milliseconds**.
     *
     * @default 60_000 // 60 seconds
     */
    timeoutMs?: number;
    /**
     * Timeout for the request in **milliseconds**.
     *
     * @default 30_000 // 30 seconds
     */
    requestTimeoutMs?: number;
}
/**
 * Options for creating a code context.
 */
interface CreateCodeContextOpts {
    /**
     * Working directory for the context.
     *
     * @default /home/user
     */
    cwd?: string;
    /**
     * Language for the context.
     *
     * @default python
     */
    language?: string;
    /**
     * Timeout for the request in **milliseconds**.
     *
     * @default 30_000 // 30 seconds
     */
    requestTimeoutMs?: number;
}
/**
 * E2B cloud sandbox is a secure and isolated cloud environment.
 *
 * The sandbox allows you to:
 * - Access Linux OS
 * - Create, list, and delete files and directories
 * - Run commands
 * - Run isolated code
 * - Access the internet
 *
 * Check docs [here](https://e2b.dev/docs).
 *
 * Use {@link Sandbox.create} to create a new sandbox.
 *
 * @example
 * ```ts
 * import { Sandbox } from '@e2b/code-interpreter'
 *
 * const sandbox = await Sandbox.create()
 * ```
 */
declare class Sandbox extends Sandbox$1 {
    protected static readonly defaultTemplate: string;
    protected get jupyterUrl(): string;
    /**
     * Run the code as Python.
     *
     * Specify the `language` or `context` option to run the code as a different language or in a different `Context`.
     *
     * You can reference previously defined variables, imports, and functions in the code.
     *
     * @param code code to execute.
     * @param opts options for executing the code.
     *
     * @returns `Execution` result object.
     */
    runCode(code: string, opts?: RunCodeOpts & {
        /**
         * Language to use for code execution.
         *
         * If not defined, the default Python context is used.
         */
        language?: 'python';
    }): Promise<Execution>;
    /**
     * Run the code for the specified language.
     *
     * Specify the `language` or `context` option to run the code as a different language or in a different `Context`.
     * If no language is specified, Python is used.
     *
     * You can reference previously defined variables, imports, and functions in the code.
     *
     * @param code code to execute.
     * @param opts options for executing the code.
     *
     * @returns `Execution` result object.
     */
    runCode(code: string, opts?: RunCodeOpts & {
        /**
         * Language to use for code execution.
         *
         * If not defined, the default Python context is used.
         */
        language?: string;
    }): Promise<Execution>;
    /**
     * Runs the code in the specified context, if not specified, the default context is used.
     *
     * Specify the `language` or `context` option to run the code as a different language or in a different `Context`.
     *
     * You can reference previously defined variables, imports, and functions in the code.
     *
     * @param code code to execute.
     * @param opts options for executing the code
     *
     * @returns `Execution` result object
     */
    runCode(code: string, opts?: RunCodeOpts & {
        /**
         * Context to run the code in.
         */
        context?: Context;
    }): Promise<Execution>;
    /**
     * Creates a new context to run code in.
     *
     * @param opts options for creating the context.
     *
     * @returns context object.
     */
    createCodeContext(opts?: CreateCodeContextOpts): Promise<Context>;
    /**
     * Removes a context.
     *
     * @param context context to remove.
     *
     * @returns void.
     */
    removeCodeContext(context: Context | string): Promise<void>;
    /**
     * List all contexts.
     *
     * @returns list of contexts.
     */
    listCodeContexts(): Promise<Context[]>;
    /**
     * Restart a context.
     *
     * @param context context to restart.
     *
     * @returns void.
     */
    restartCodeContext(context: Context | string): Promise<void>;
}

export { type BarChart, type BarData, type BoxAndWhiskerChart, type BoxAndWhiskerData, type Chart, ChartType, type ChartTypes, type Context, type CreateCodeContextOpts, Execution, ExecutionError, type LineChart, type Logs, type MIMEType, OutputMessage, type PieChart, type PieData, type PointData, type RawData, Result, type RunCodeOpts, Sandbox, ScaleType, type ScatterChart, type SuperChart, Sandbox as default };
