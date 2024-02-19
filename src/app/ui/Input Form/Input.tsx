import clsx from "clsx";
import { FocusEventHandler } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    placeholder: string;
}

export default  function Input( {placeholder, className, ...rest }: InputProps) {
    return (  
        <div className="mb-6">
            <input 
                {...rest}
                type="text" 
                id="large-input" 
                placeholder={placeholder}
                className={clsx(
                    "block w-full p-5 text-gray-900 border border-gray-300 rounded-lg bg-gray-50 text-base focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" , 
                    className
                )}
            />
        </div>
    );
}