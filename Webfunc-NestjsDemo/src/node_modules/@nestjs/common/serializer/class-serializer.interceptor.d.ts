import { Observable } from 'rxjs';
import { CallHandler, ExecutionContext, NestInterceptor } from '../interfaces';
import { ClassTransformOptions } from '../interfaces/external/class-transform-options.interface';
export interface PlainLiteralObject {
    [key: string]: any;
}
export declare class ClassSerializerInterceptor implements NestInterceptor {
    protected readonly reflector: any;
    protected readonly defaultOptions: ClassTransformOptions;
    constructor(reflector: any, defaultOptions?: ClassTransformOptions);
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    serialize(response: PlainLiteralObject | Array<PlainLiteralObject>, options: ClassTransformOptions): PlainLiteralObject | PlainLiteralObject[];
    transformToPlain(plainOrClass: any, options: ClassTransformOptions): PlainLiteralObject;
    protected getContextOptions(context: ExecutionContext): ClassTransformOptions | undefined;
    private reflectSerializeMetadata;
}
