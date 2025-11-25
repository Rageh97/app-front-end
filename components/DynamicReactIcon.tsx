import React, { Suspense } from 'react';

interface DynamicReactIconProps {
  iconName: string; // e.g., "FaFacebook", "FiInstagram"
  className?: string;
  size?: number;
}

const DynamicReactIcon: React.FC<DynamicReactIconProps> = ({ iconName, className, size = 24 }) => {
  if (!iconName || typeof iconName !== 'string' || iconName.length < 3) {
    console.error('Invalid iconName provided to DynamicReactIcon:', iconName);
    return <span className={className}>⚠️</span>; // Fallback for invalid name
  }

  const libraryPrefix = iconName.substring(0, 2).toLowerCase(); // e.g., "fa", "fi", "md"
  
  // Ensure the first two letters are a valid prefix for react-icons common libraries
  // This is a simplification; a more robust solution might involve a mapping or more complex logic
  // if you use icons from libraries with different naming conventions (e.g., 'ai', 'bs', 'cg', etc.)
  if (!/^[a-z]{2}$/.test(libraryPrefix)) {
      console.error(`Could not determine library for icon: ${iconName}`);
      return <span className={className}>❓</span>;
  }

  const IconComponent = React.lazy(async () => {
    try {
      // Dynamically import the entire library module (e.g., react-icons/fa)
      const libraryModule = await import(`react-icons/${libraryPrefix}/index.js`);
      // Access the specific icon component from the module
      if (libraryModule && (libraryModule as any)[iconName]) {
        return { default: (libraryModule as any)[iconName] };
      } else {
        console.error(`Icon '${iconName}' not found in library '${libraryPrefix}'. Available icons might include:`, Object.keys(libraryModule || {}).join(', '));
        // Return a component that renders a fallback
        return { default: () => <span className={className}>🚫</span> };
      }
    } catch (error) {
      console.error(`Error loading icon library ${libraryPrefix} for icon ${iconName}:`, error);
      // Return a component that renders a fallback
      return { default: () => <span className={className}>💥</span> };
    }
  });

  return (
    <Suspense fallback={<span className={className}>⏳</span>}> {/* Fallback while loading */}
      <IconComponent className={className} size={size} />
    </Suspense>
  );
};

export default DynamicReactIcon;
