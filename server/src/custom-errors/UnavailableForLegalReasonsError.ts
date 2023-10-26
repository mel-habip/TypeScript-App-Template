import { CustomErrorProps } from "../backend-types";

const defaultMessage = `Unavailable for Legal Reasons: The requested resource cannot be provided or the requested action cannot be completed.`;

export default class UnavailableForLegalReasonsError extends Error {
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
        this.name = 'UnavailableForLegalReasonsError';
    }
}