import { ClassNameValue, twMerge } from "tailwind-merge";

interface ContainerProps {
  children: React.ReactNode;
  className?: ClassNameValue;
}

export default function Container({ children, className }: ContainerProps) {
  return <div className={twMerge("px-4 md:px-16", className)}>{children}</div>;
}
