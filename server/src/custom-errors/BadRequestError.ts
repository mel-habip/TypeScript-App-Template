import { CustomErrorProps } from "../backend-types";

const defaultMessage = `Bad Request: A required value has not been provided or the provided value is invalid.`;

export default class BadRequestError extends Error {
    constructor(message: CustomErrorProps = defaultMessage) {
        if (typeof message === 'string') {
            super(message);
            this.message = message;
        } else {
            super(message.message || defaultMessage);

            Object.entries(message).forEach(([key, value]) => {
                this[key] = value
            });
        }
        this.name = 'BadRequestError';
    }
}