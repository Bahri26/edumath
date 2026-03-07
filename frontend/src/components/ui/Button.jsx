const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyle = 'px-6 py-3 rounded-xl font-bold transition-all shadow-lg transform hover:-translate-y-1';

    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-red-200',
        outline: 'border-2 border-gray-300 text-gray-600 hover:bg-gray-50'
    };

    const variantClass = variants[variant] || variants.primary;

    return (
        <button className={`${baseStyle} ${variantClass} ${className}`} {...props}>
            {children}
        </button>
    );
};

export default Button;
