import { CustomErrorProps } from "../backend-types";

const defaultMessage = `Service Unavailable: We are unable to complete your request at this time. Please try again later.`;

export default class ServiceUnavailableError extends Error {
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
        this.name = 'ServiceUnavailableError';
    }
}