import { CustomErrorProps } from "../backend-types";
export default class NotFoundError extends Error {
    constructor(message: CustomErrorProps = `Requested resource is not found.`) {
        if (typeof message === 'string') {
            super(message);
            this.message = message;
        } else {
            super(message.message);
            this.message = message.message;
        }
    }
}