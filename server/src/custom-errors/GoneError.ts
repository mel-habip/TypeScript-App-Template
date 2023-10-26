import { CustomErrorProps } from "../backend-types";

const defaultMessage = `Gone: The requested resource is no longer available.`;

export default class GoneError extends Error {
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
        this.name = 'GoneError';
    }
}