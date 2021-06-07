import { NestInterceptor, Type } from '@nestjs/common';
import { MulterField, MulterOptions } from '../interfaces/multer-options.interface';
export declare function FileFieldsInterceptor(uploadFields: MulterField[], localOptions?: MulterOptions): Type<NestInterceptor>;
