import { Request, Router } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import allUrls from '../utils/systemOwnUrl';
import authenticateToken from '../middlewares/authenticateToken';
import { ResponseWithFunctions, RequestWithUser } from '../backend-types';
import NotFoundError from '../custom-errors/NotFoundError';
import BadRequestError from '../custom-errors/BadRequestError';
import ForbiddenError from '../custom-errors/ForbiddenError';
import UnauthenticatedError from '../custom-errors/UnauthenticatedError';

import validatePassword from '../../../frontend/src/helpers/validatePassword';
import validateBodyProps from '../middlewares/validateBodyProps';

import EmailSender from '../helpers/EmailSender';
import DynamoDBHelper from '../helpers/DynamoDBHelper';
import prisma from 'prisma';

const usersRouter = Router();
const cache = new DynamoDBHelper();

//@ts-ignore
usersRouter.post('/login', validateBodyProps({
    email: {
        type: 'email',
        required: true,
        trim: true,
        toLowercase: true,
    },
    password: {
        type: 'string',
        required: true,
        trim: true,
    }
}), async (req: RequestWithUser, res: ResponseWithFunctions) => {
    const { email, password } = req.body;

    const findUser = await prisma.user.findUnique({
        where: {
            email,
            deleted: false
        },
        include: {
            userPassword: true
        }
    });

    if (!findUser) throw new UnauthenticatedError(`Incorrect Email or Password`);

    if (!findUser.active) throw new UnauthenticatedError(`Cannot log into inactive user. Please activate your account first.`);

    if (await bcrypt.compare(password, findUser.userPassword?.password || '')) {
        //@ts-ignore
        const accessToken = jwt.sign({ id: findUser.id }, process.env.ACCESS_TOKEN_SECRET_KEY);

        //@ts-ignore
        delete findUser.userPassword;

        return res.success({
            ...findUser,
            accessToken,
        });
    } else {
        throw new UnauthenticatedError(`Incorrect Email or Password`);
    }
});

// this endpoint can also be used to re-activate deleted accounts
//@ts-ignore
usersRouter.post('/forgot-password', validateBodyProps({
    email: {
        type: 'email',
        required: true
    }
}), async (req: Request, res: ResponseWithFunctions) => {
    const userWithEmail = await prisma.user.findUnique({
        where: {
            email: req.body.email
        }
    });

    if (!userWithEmail) {
        // user is not found, but we shouldn't release this information.
        // instead, say 'If there is a user with this email, they will receive an email' (or words to that affect)
        return res.noContent();
    }

    // We shall follow the same process as when the user is added to an Org

    // step 1 --> generate activation token based with a temp password
    const { temporaryPassword, url } = createActivationToken(userWithEmail.id);

    // step 2 --> deactivate account and change their password
    const update = await prisma.user.update({
        where: {
            id: userWithEmail.id,
        },
        data: {
            active: false,
            userPassword: {
                update: {
                    password: temporaryPassword
                }
            }
        }
    });

    await cache.createOrUpdate('User', update);

    //step 3 --> send Activation Token Email
    EmailSender({
        to: req.body.email,
        subject: `Password Reset`,
        body: `Hello ${userWithEmail.name}, \n\nPlease click the link below to reset your password \n\n ${url}`
    })
    return res.noContent();

});

//Account activation pathway when user receives a link with the Activation Token
//@ts-ignore
usersRouter.post('/activate', validateBodyProps({
    activationToken: {
        type: 'string',
        required: true,
        trim: true,
    },
    newPassword: {
        type: 'string',
        required: true,
        trim: true,
    }
}), async (req: RequestWithUser, res: ResponseWithFunctions) => {
    const { activationToken, newPassword } = req.body;

    if (!validatePassword(newPassword).hasAll) throw new BadRequestError(`New Password is too weak.`);

    const decode_result = jwt.verify(activationToken, process.env.ACTIVATION_TOKEN_SECRET_KEY as jwt.Secret);

    //should be the User's ID
    if (!decode_result || typeof decode_result !== 'object') {
        throw new UnauthenticatedError(`Activation Token is invalid.`);
    }

    const findUser = await prisma.user.findUnique({
        where: {
            id: decode_result.id,
            userPassword: {
                password: decode_result.password
            }
        }
    });

    if (!findUser) throw new NotFoundError(`Activation Token does not belong to an existing user.`);

    if (findUser.active) throw new BadRequestError(`User is already active.`);

    const hashedPassword = await bcrypt.hash(newPassword, 10); //default strength for salt creation is 10

    await cache.deleteById('User', findUser.id);

    const update = await prisma.user.update({
        where: {
            id: findUser.id,
        },
        data: {
            active: true,
            deleted: false,
            userPassword: {
                update: {
                    password: hashedPassword
                }
            }
        }
    });

    if (!update) throw Error(`Failed to update User.`);

    await cache.createOrUpdate('User', update);

    //@ts-ignore
    delete update.userPassword;

    return res.ok(update);
});

//used by FE when Access Token is stored, to log back in easily
//@ts-ignore
usersRouter.get('/session', authenticateToken, async (req: RequestWithUser, res: ResponseWithFunctions) => {
    return res.ok(req.user);
});

export default usersRouter;

function createActivationToken(id: number, tempPasswordOverride?: string) {
    const temporaryPassword = tempPasswordOverride || crypto.randomUUID();
    const activationToken = jwt.sign({
        id,
        password: temporaryPassword,
    }, process.env.ACTIVATION_TOKEN_SECRET_KEY as jwt.Secret);
    return {
        activationToken,
        temporaryPassword,
        url: `${allUrls.appUrl}/activate/${activationToken}`
    };
}