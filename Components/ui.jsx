import React from 'react';

const baseButtonClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none';
const variantClasses = {
  solid: 'bg-[#800000] text-white hover:bg-[#600000] focus:ring-[#DAA520] focus:ring-offset-0',
  outline: 'border bg-transparent hover:bg-black/5 focus:ring-[#DAA520] focus:ring-offset-0',
  ghost: 'bg-transparent hover:bg-black/10 focus:ring-[#DAA520] focus:ring-offset-0'
};
const sizeClasses = {
  sm: 'px-3 py-2 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-md',
  lg: 'px-6 py-3 text-base rounded-lg',
  icon: 'w-10 h-10 rounded-full'
};

export const Button = React.forwardRef(({ variant = 'solid', size = 'md', className = '', children, ...props }, ref) => {
  const variantClass = variantClasses[variant] || variantClasses.solid;
  const sizeClass = sizeClasses[size] || sizeClasses.md;
  return (
    <button
      ref={ref}
      className={`${baseButtonClasses} ${variantClass} ${sizeClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';

export const Input = React.forwardRef(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-[#800000] focus:ring-2 focus:ring-[#DAA520] focus:ring-offset-0 ${className}`.trim()}
    {...props}
  />
));
Input.displayName = 'Input';

export const Card = ({ className = '', ...props }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-gray-200 ${className}`.trim()} {...props} />
);

export const CardHeader = ({ className = '', ...props }) => (
  <div className={`p-4 border-b border-gray-100 ${className}`.trim()} {...props} />
);

export const CardContent = ({ className = '', ...props }) => (
  <div className={`p-4 ${className}`.trim()} {...props} />
);

export const CardTitle = ({ className = '', ...props }) => (
  <h3 className={`text-lg font-semibold ${className}`.trim()} {...props} />
);

export const Badge = ({ className = '', ...props }) => (
  <span className={`inline-flex items-center rounded-full border border-transparent bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 ${className}`.trim()} {...props} />
);
