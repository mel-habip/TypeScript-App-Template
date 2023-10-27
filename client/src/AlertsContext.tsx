import React, { createContext, useContext, useMemo } from 'react';
import { enqueueSnackbar } from 'notistack';

type Options = {
    persist?: boolean,
    autoHideDuration?: number | null,
    variant?: 'default' | 'error' | 'success' | 'warning' | 'info',
    style?: any,
    onEnter?: (arg: any) => void,
    disableKickOut?: boolean
}

type SnackbarContextType = {
    handleError: (error: any, options?: Options) => void;
};

const defaultOptions: Options = {
    persist: false,
    autoHideDuration: 4000,
    variant: 'error',
    onEnter: () => null,
    disableKickOut: false,
}

type responseObject = {
    data?: {
        message?: string,
        [key: string]: any
    }
    [key: string]: any
}

type errorObject = {
    response?: {
        data?: {
            message?: string,
            [key: string]: any
        }
        [key: string]: any
    }
    [key: string]: any
}


// Create a context to hold the modified enqueueSnackbar function
//@ts-ignore
const SnackbarContext = createContext<SnackbarContextType>(null);

export const AlertsContext = ({ children }: { children: React.ReactNode }) => {

    // Modify enqueueSnackbar function here
    const modifiedEnqueueSnackbar = (err: string | errorObject | responseObject | any, options: Options = defaultOptions) => {
        let message;


        if (err?.response?.status === 401 && !options.disableKickOut) {
            //start the kick-out process.
            localStorage.removeItem('accessToken');
            window.history.go(0);// refreshes the page and forces re-login
        }

        if (err?.response?.status === 429) {
            message = `You are sending too many requests. Please hang tight while the server catches up.`;
        }

        if (typeof err === 'string') {
            message = err;
        } else if (options.variant === 'success') {
            message = err?.data?.message || err?.data
        } else {
            message = err?.response?.data?.message || err?.response?.data;
        }

        if (!message || typeof message !== 'string') {
            message = 'Something went wrong on our end. Sorry!'
        }

        console.log('message received: ', message);
        enqueueSnackbar(message, { ...defaultOptions, ...options });
    };

    // Memoize the context value to avoid unnecessary re-renders
    const contextValue: SnackbarContextType = useMemo(() => ({
        handleError: modifiedEnqueueSnackbar
    }), []);

    return (
        <SnackbarContext.Provider value={contextValue}>{children}</SnackbarContext.Provider>
    );
};

export default function useErrorHandler() {
    return useContext(SnackbarContext).handleError;
};

export function useSuccessHandler() {
    const func = useContext(SnackbarContext).handleError;
    return (message: string | responseObject) => func(message, { variant: 'success' });
}