import { ReactNode } from "react";
import { View } from "react-native";

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: "default" | "elevated";
}

export default function Card({ children, className = "", variant = "default" }: CardProps) {
  const baseClasses = "rounded-2xl overflow-hidden";
  const variantClasses = {
    default: "bg-white/80 dark:bg-black/40",
    elevated: "bg-white dark:bg-gray-800",
  };

  return (
    <View className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </View>
  );
}