import { CustomErrorProps } from "../backend-types";

export default class UnauthenticatedError extends Error {
    constructor(message: CustomErrorProps = `Unauthenticated: A valid Access Token was not received.`) {
        if (typeof message === 'string') {
            super(message);
            this.message = message;
        } else {
            super(message.message);
            this.message = message.message;
        }
    }
}