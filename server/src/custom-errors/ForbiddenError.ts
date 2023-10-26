import { CustomErrorProps } from "../backend-types";

const defaultMessage = `Forbidden: You do not have access to this.`;

export default class ForbiddenError extends Error {
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
    }
}