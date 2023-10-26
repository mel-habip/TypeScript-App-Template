
import {
    Request,
    Response,
    NextFunction
} from 'express';
import {
    ResponseWithFunctions
} from '../backend-types';

/**
 * This middleware is used once for the entire app
 */
export default function responseEnhancer(req: Request, res: ResponseWithFunctions, next: NextFunction): any {
    // Extend the Response object directly, reassigning doesn't work
    res.ok = function (data: any) {
        return this.status(200).json(data);
    };

    res.success = function (data: any) {
        return this.status(200).json(data);
    };

    res.created = function (data: any) {
        return this.status(201).json(data);
    };

    res.accepted = function (data: any) {
        return this.status(202).json(data);
    }

    res.noContent = function () {
        return this.status(204).end();
    };

    next();
}