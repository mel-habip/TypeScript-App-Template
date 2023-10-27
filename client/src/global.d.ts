import * as TYPES from 'shared-types/shared-types';

declare global {
    /**
     * Now declare things that go in the global namespace,
     * or augment existing declarations in the global namespace.
     */

    // Extend with shared types
    interface User extends TYPES.User { }

};

export { };