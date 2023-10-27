/**
 * Now declare things that go in the global namespace,
 * or augment existing declarations in the global namespace.
 */

export interface User {
    id: number
    name: string
    email: string
    active: boolean
    deleted: boolean
    updatedAt?: Date | null
    createdAt: Date
    [key: string]: any
};