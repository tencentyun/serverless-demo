import { NestInterceptor, Type } from '@nestjs/common';
import { MulterOptions } from '../interfaces/multer-options.interface';
export declare function FilesInterceptor(fieldName: string, maxCount?: number, localOptions?: MulterOptions): Type<NestInterceptor>;
