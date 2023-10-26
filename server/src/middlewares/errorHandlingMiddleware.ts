import { NextFunction, Response, Request } from 'express';
import { Prisma } from '@prisma/client'
import NotFoundError from '../custom-errors/NotFoundError';
import ForbiddenError from '../custom-errors/ForbiddenError';
import BadRequestError from '../custom-errors/BadRequestError';
import UnauthenticatedError from '../custom-errors/UnauthenticatedError';
import GoneError from '../custom-errors/GoneError';
import UnavailableForLegalReasonsError from '../custom-errors/UnavailableForLegalReasonsError';
import ServiceUnavailableError from '../custom-errors/ServiceUnavailableError';

export default function errorHandlingMiddleware(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {

    let statusCode = 422;

    if (err instanceof BadRequestError) {
        statusCode = 400;
    } else if (err instanceof UnauthenticatedError) {
        statusCode = 401;
    } else if (err instanceof ForbiddenError) {
        statusCode = 403;
    } else if (err instanceof NotFoundError) {
        statusCode = 404;
    } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
        statusCode = 400;
    } else if (err instanceof GoneError) {
        statusCode = 410;
    } else if (err instanceof UnavailableForLegalReasonsError) {
        statusCode = 451;
    } else if (err instanceof ServiceUnavailableError) {
        statusCode = 503;
    }

    const stack_line_1 = err.stack?.split(`\n`)?.[0];

    console.log('\n\tERROR MESSAGE', err.message);
    console.log('\n\tERROR NAME', err.name);
    console.log('\n\tERROR STACK LINE 1', stack_line_1);
    console.log('\n\tERROR STACK FULL', err.stack);

    if (err.message) {

        return res.status(statusCode).json({
            message: err.message,
            ...err,
            name: undefined,
        });
    }

    // Handle other types of errors or provide a generic error response.
    return res.status(422).json({ message: `Something went wrong` });
}