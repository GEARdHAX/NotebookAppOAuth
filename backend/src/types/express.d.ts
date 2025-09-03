import { IJWTPayload } from './index';

declare global {
    namespace Express {
        interface Request {
            user?: IJWTPayload;
        }
    }
}

export { };
