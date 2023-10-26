import { NextFunction, Request, Response } from 'express';

import { RequestWithUser } from '../backend-types';
import BadRequestError from '../custom-errors/BadRequestError';

import validateEmail from "../../../frontend/src/helpers/validateEmail";

import SlugHelper from '../../../frontend/src/helpers/SlugHelper';

const specialKey = Symbol.for('SPECIAL');

interface RequirementProps {
    [specialKey]?: {
        atLeast?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20;
    }
    [key: string]: {
        required?: boolean;
        type: Types;
        enumOptions?: enumOptionsType;
        trim?: boolean;
        toLowercase?: boolean;
        toUppercase?: boolean;
    }
}


type Types = 'enum' | 'string' | 'number' | 'any' | 'boolean' | 'array' | 'hash' | 'defined' | 'email' | 'slug';
type enumOptionsType = (string | boolean | number)[];

const slugs = new SlugHelper();

/**@middleware to require body parts */
export default function validateBodyProps(requirements: RequirementProps) {
    return function (req: RequestWithUser, res: Response, next: NextFunction): void {
        if (req.body?.SPECIAL != null) throw new BadRequestError(`The property "SPECIAL" is reserved and cannot be used in requests.`);

        const { SPECIAL, ...others } = requirements;

        const cleanedBody: any = {};

        Object.entries(others).forEach(([
            key, {
                required = false,
                type = 'any',
                enumOptions = [],
                trim = true,
                toLowercase = false,
                toUppercase = false }]) => {

            let val = req.body?.[key];

            if (['any', 'slug', 'email', 'string', 'defined'].includes(type)) {
                try {
                    if (trim) val = val.trim();

                    if (toLowercase) {
                        val = val.toLowerCase();
                    } else if (toUppercase) {
                        val = val.toUpperCase();
                    }
                } catch (e) {
                    // nothing
                }
            }

            if (type === 'any') return cleanedBody[key] = val;

            switch (type) {
                case 'boolean': {
                    if (typeof val === 'boolean') return cleanedBody[key] = val;
                }
                case 'email': {
                    if (typeof val === 'string' && validateEmail(val)) return cleanedBody[key] = val;
                }
                case 'number': {
                    if (typeof val === 'number') return cleanedBody[key] = val;

                    if (!isNaN(parseInt(val))) return cleanedBody[key] = parseInt(val);
                }
                case 'string': {
                    if (typeof val === 'string' && !!val) return cleanedBody[key] = val;
                }
                case 'array': {
                    if (Array.isArray(val)) return cleanedBody[key] = val;
                }
                case 'enum': {
                    if (enumOptions?.includes(val)) return cleanedBody[key] = val;

                    if (required) throw new BadRequestError(`Expected one of the following values for property "${key}" but was not satisfied: ${enumOptions?.map(x => x.toString()).join(', ')}`);
                }
                case 'hash': {
                    if (typeof val === 'object' && !Array.isArray(val)) return cleanedBody[key] = val;
                }
                case 'defined': {
                    if (val !== undefined) return cleanedBody[key] = val;
                }
                case 'slug': {
                    const isValid = slugs.validateSlug(val);
                    if (!!val && isValid) return cleanedBody[key] = val;

                    if (required && isValid) throw new BadRequestError(`Expected a valid slug but the provided slug is invalid "${val}"`);
                }
            };

            if (required) throw new BadRequestError(`Expected "${type}" for property "${key}" but was not satisfied`);
        });

        const specialProp = requirements[specialKey]

        if (specialProp?.atLeast) {
            const howManyValid = Object.keys(cleanedBody).length;
            if (howManyValid < specialProp.atLeast) throw new BadRequestError(`Expected at least ${specialProp?.atLeast} of the following properties to be defined but received ${howManyValid} of the following: ${Object.entries(others).map(([key, { type }]) => `${key} - ${type}`)}`);
        };

        req.body = structuredClone(cleanedBody);

        //if we're here, we're good
        return next();
    };
}