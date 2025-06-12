import { ClassNameValue, twMerge } from "tailwind-merge";
import Container from "../Container";

interface Props {
  className?: ClassNameValue;
}

export default function Footer({ className }: Props) {
  return (
    <div className={twMerge("pt-8 pb-12 bg-black", className)}>
      <Container>Footer</Container>
    </div>
  );
}
