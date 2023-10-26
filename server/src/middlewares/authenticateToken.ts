import jwt from 'jsonwebtoken';
import { NextFunction, Response } from 'express';
import NotFoundError from '../custom-errors/NotFoundError';
import prisma from 'prisma';

import { RequestWithUser } from '../backend-types';
import UnauthenticatedError from '../custom-errors/UnauthenticatedError';

import DynamoDBHelper from '../helpers/DynamoDBHelper';

const cache = new DynamoDBHelper();

const adminEmails = [
    'yourname@email.com',
];

const ACCESS_TOKEN_SECRET_KEY: jwt.Secret = process.env.ACCESS_TOKEN_SECRET_KEY as string;

/**
 * @function authenticateToken - middleware that converts JWT to user and adds it to request data
 * @middleware
 */
export default function authenticateToken(req: RequestWithUser, res: Response, next: NextFunction) { //this is middleware in /login

    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1];
    if (!token) {
        return res.status(401).send('Unauthenticated: No session token received.');
    }

    //@ts-ignore
    jwt.verify(token, ACCESS_TOKEN_SECRET_KEY, jwt_callback);

    async function jwt_callback(err: jwt.JsonWebTokenError, user: { id: number | string }): Promise<any> {
        typeof user?.id === 'string' && (user.id = parseInt(user.id));

        if (err?.name === 'TokenExpiredError') throw new UnauthenticatedError('Unauthenticated: Your session has expired.');

        if (err || !user || !user?.id) {
            throw new UnauthenticatedError('Unauthenticated: Invalid Token');
        }

        const checkCache = await cache.getById('User', user.id);

        let current_details = checkCache.success ? checkCache.data : null;

        if (!current_details || !current_details?.organizationRelationships) {
            current_details = await prisma.user.findUnique({
                where: {
                    id: user.id,
                    deleted: false
                }
            });
            if (current_details) {
                //means it wasn't in cache before
                await cache.createOrUpdate('User', current_details);
            }
        }

        if (!current_details) throw new NotFoundError(`User #${user.id} not found.`);

        if (!current_details.active) {
            return res.status(401).send(`Unauthenticated: Inactive User #${user.id} cannot make requests.`);
        };

        let is_admin = adminEmails.includes(current_details.email);

        //@ts-ignore will fix later TODO: fix.
        req.user = {
            ...current_details,
            is_admin,
        };

        return next();
    }
}